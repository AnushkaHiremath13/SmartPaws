import { Request, Response } from "express";
import fs from "fs";
import csv from "csv-parser";
import IntakeRecord from "../models/IntakeRecord";
import OutcomeRecord from "../models/OutcomeRecord";
import { regionFromAddress } from "../utils/regionMapper";

// Helper function to process and save a single CSV file
async function processCsv(filePath: string, model: any) {
  const results: any[] = [];
  const isOutcome = model && model.modelName === 'OutcomeRecord';
  
  return new Promise((resolve, reject) => {
    console.log("   📖 Reading CSV file...");
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => results.push(row))
      .on("error", reject)
      .on("end", async () => {
        console.log(`   ✅ Parsed ${results.length} rows`);
        console.log(`   💾 Inserting into database...`);
        
        try {
          // Transform all rows at once (faster than row-by-row)
          const documents = results.map(row => {
            // Robust datetime extraction from various possible headers
            const dtRaw =
              row.datetime || row.DateTime || row["DateTime"] || row["Intake DateTime"] ||
              row["Intake Date"] || row.date || row.Date || row["Intake Date & Time"] || row["Intake Date and Time"] ||
              row["dateTime"] || row["DATETIME"];
            let parsedDate: any = dtRaw ? new Date(dtRaw) : null;
            if (parsedDate && isNaN(parsedDate.getTime())) {
              parsedDate = null;
            }

            const doc: any = {
              animalId: row.animalId || row["Animal ID"],
              name: row.name || row.Name,
              datetime: parsedDate,
              monthyear: row.monthyear || row.MonthYear,
              breed: row.breed || row.Breed,
              color: row.color || row.Color,
              animalType: row.animalType || row["Animal Type"]
            };
            
            if (isOutcome) {
              doc.outcomeType = row.outcomeType || row["Outcome Type"];
              doc.outcomeSubtype = row.outcomeSubtype || row["Outcome Subtype"];
              doc.sexUponOutcome = row.sexUponOutcome || row["Sex upon Outcome"];
              doc.ageUponOutcome = row.ageUponOutcome || row["Age upon Outcome"];
            } else {
              doc.foundLocation = row.foundLocation || row["Found Location"];
              // Compute region from address at ingest time
              doc.region = regionFromAddress(doc.foundLocation);
              doc.intakeType = row.intakeType || row["Intake Type"];
              doc.intakeCondition = row.intakeCondition || row["Intake Condition"];
              doc.sexUponIntake = row.sexUponIntake || row["Sex upon Intake"];
              doc.ageUponIntake = row.ageUponIntake || row["Age upon Intake"];
            }
            
            return doc;
          });
          
          // Insert in batches for speed (10K per batch)
          console.log(`   💾 Inserting ${documents.length} documents into ${model.collection.name}...`);
          
          const collection = model.collection;
          const BATCH_SIZE = 10000;
          let totalInserted = 0;
          
          // Process in parallel batches for maximum speed
          const batches = [];
          for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            batches.push(documents.slice(i, i + BATCH_SIZE));
          }
          
          console.log(`   📦 Processing ${batches.length} batches in parallel...`);
          
          // Insert all batches in parallel with fast write concern
          const insertPromises = batches.map(async (batch, idx) => {
            try {
              const result = await collection.insertMany(batch, { 
                ordered: false,
                writeConcern: { w: 1 } // Fast: only wait for primary acknowledgment
              });
              console.log(`      ✅ Batch ${idx + 1}/${batches.length}: ${result.insertedCount} records`);
              return result.insertedCount;
            } catch (error: any) {
              if (error.writeErrors) {
                const successCount = batch.length - error.writeErrors.length;
                console.log(`      ⚠️ Batch ${idx + 1}/${batches.length}: ${successCount}/${batch.length} records`);
                return successCount;
              }
              return 0;
            }
          });
          
          const batchResults = await Promise.all(insertPromises);
          totalInserted = batchResults.reduce((sum: number, count: number) => sum + count, 0);
          
          console.log(`   ✅ Successfully inserted ${totalInserted}/${documents.length} records!`);
          resolve(totalInserted);
        } catch (error: any) {
          console.error(`   ❌ Insert error:`, error);
          reject(error);
        }
      });
  });
}

// Clear all data from database
export const clearAllData = async (req: Request, res: Response) => {
  try {
    console.log("🗑️ Clearing all data from database...");
    
    const intakeCount = await IntakeRecord.countDocuments();
    const outcomeCount = await OutcomeRecord.countDocuments();
    
    await IntakeRecord.deleteMany({});
    await OutcomeRecord.deleteMany({});
    
    console.log(`✅ Deleted ${intakeCount} intake records and ${outcomeCount} outcome records`);
    
    res.status(200).json({ 
      message: "All data cleared successfully",
      deleted: {
        intakes: intakeCount,
        outcomes: outcomeCount
      }
    });
  } catch (error) {
    console.error("❌ Error clearing data:", error);
    res.status(500).json({ message: "Failed to clear data", error });
  }
};

// Main controller function for file uploads
export const uploadCsv = async (req: any, res: Response) => {
  try {
    console.log("📥 Upload request received");
    
    if (!req.file) {
      console.log("❌ No file in request");
      return res.status(400).json({ message: "No file uploaded." });
    }

    const filePath = req.file.path;
    const originalname = req.file.originalname;
    const fileSize = req.file.size;

    console.log(`   File: ${originalname}`);
    console.log(`   Size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Path: ${filePath}`);

    let inserted = 0;
    const lowerFilename = originalname.toLowerCase();
    
    if (lowerFilename.includes("intake")) {
      console.log("   Type: Intake records");
      inserted = (await processCsv(filePath, IntakeRecord)) as number;
    } else if (lowerFilename.includes("outcome")) {
      console.log("   Type: Outcome records");
      inserted = (await processCsv(filePath, OutcomeRecord)) as number;
    } else {
      console.log(`❌ Invalid filename: ${originalname}`);
      return res.status(400).json({ message: "Invalid file name. Must include 'intake' or 'outcome' in the filename." });
    }

    console.log(`✅ Successfully inserted ${inserted} records`);

    // Clean up the temporary file
    fs.unlinkSync(filePath);

    res.status(200).json({ message: "File ingested successfully.", inserted });
  } catch (error) {
    console.error("❌ Ingestion failed:", error);
    res.status(500).json({ message: "File ingestion failed.", error });
  }
};

// Get intake records
export const getIntakeRecords = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const records = await IntakeRecord.find()
      .sort({ datetime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching intake records:", error);
    res.status(500).json({ message: "Failed to fetch intake records", error });
  }
};

// Get outcome records
export const getOutcomeRecords = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = parseInt(req.query.skip as string) || 0;
    
    const records = await OutcomeRecord.find()
      .sort({ datetime: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.status(200).json(records);
  } catch (error) {
    console.error("Error fetching outcome records:", error);
    res.status(500).json({ message: "Failed to fetch outcome records", error });
  }
};

// Backfill regions for existing intake records where region is missing
export const backfillRegions = async (req: Request, res: Response) => {
  try {
    const BATCH = 5000;
    let processed = 0;
    let updated = 0;

    while (true) {
      const docs = await IntakeRecord.find({ $or: [ { region: { $exists: false } }, { region: null }, { region: '' } ] })
        .select({ _id: 1, foundLocation: 1 })
        .limit(BATCH)
        .lean();
      if (!docs.length) break;

      const ops: any[] = [];
      for (const d of docs) {
        const region = regionFromAddress(d.foundLocation);
        if (region) {
          ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { region } } } });
        }
      }
      if (ops.length) {
        const resBulk: any = await (IntakeRecord as any).bulkWrite(ops, { ordered: false });
        updated += (resBulk.modifiedCount || 0) + (resBulk.upsertedCount || 0);
      }
      processed += docs.length;
      if (docs.length < BATCH) break;
    }

    res.status(200).json({ message: "Backfill complete", processed, updated });
  } catch (error) {
    console.error("Backfill regions failed:", error);
    res.status(500).json({ message: "Backfill regions failed", error });
  }
};

// Backfill datetimes for intake records where datetime is missing but MonthYear or other fields exist
export const backfillDatetimes = async (req: Request, res: Response) => {
  try {
    const BATCH = 5000;
    let processed = 0;
    let updated = 0;

    while (true) {
      const docs = await IntakeRecord.find({ $or: [ { datetime: { $exists: false } }, { datetime: null } ] })
        .select({ _id: 1, monthyear: 1 })
        .limit(BATCH)
        .lean();
      if (!docs.length) break;

      const ops: any[] = [];
      for (const d of docs) {
        let parsed: Date | null = null;
        const my = (d as any).monthyear as string | undefined;
        if (my) {
          const s = String(my).trim();
          const tryFormats = [
            (x: string) => new Date(x),
            (x: string) => {
              const m = x.match(/^(\d{4})[-/](\d{1,2})$/);
              if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
              return new Date(NaN);
            },
            (x: string) => {
              const m = x.match(/^(\d{1,2})[-/](\d{4})$/);
              if (m) return new Date(Number(m[2]), Number(m[1]) - 1, 1);
              return new Date(NaN);
            }
          ];
          for (const f of tryFormats) {
            const dt = f(s);
            if (!isNaN(dt.getTime())) { parsed = dt; break; }
          }
        }
        if (parsed) {
          ops.push({ updateOne: { filter: { _id: d._id }, update: { $set: { datetime: parsed } } } });
        }
      }

      if (ops.length) {
        const resBulk: any = await (IntakeRecord as any).bulkWrite(ops, { ordered: false });
        updated += (resBulk.modifiedCount || 0) + (resBulk.upsertedCount || 0);
      }
      processed += docs.length;
      if (docs.length < BATCH) break;
    }

    res.status(200).json({ message: "Datetime backfill complete", processed, updated });
  } catch (error) {
    console.error("Backfill datetimes failed:", error);
    res.status(500).json({ message: "Backfill datetimes failed", error });
  }
};