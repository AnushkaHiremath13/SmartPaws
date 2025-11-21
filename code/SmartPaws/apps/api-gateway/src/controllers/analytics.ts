import { Request, Response } from "express";
import IntakeRecord from "../models/IntakeRecord";
import OutcomeRecord from "../models/OutcomeRecord";
import { regionFromAddress } from "../utils/regionMapper";

export const getIntakeHeatmap = async (req: Request, res: Response) => {
  try {
    console.log('🗺️ Generating intake heatmap by Region over Years...');

    // Get all intake records with date and either region or foundLocation
    const intakeRecords = await IntakeRecord.find(
      {
        $and: [
          { $or: [
            { datetime: { $exists: true, $ne: null } },
            { monthyear: { $exists: true, $nin: [null, ''] } }
          ]},
          { $or: [
            { region: { $exists: true, $nin: [null, ''] } },
            { foundLocation: { $exists: true, $nin: [null, ''] } }
          ]}
        ]
      },
      { foundLocation: 1, region: 1, datetime: 1, monthyear: 1 }
    );

    console.log(`📊 Processing ${intakeRecords.length} intake records...`);
    
    // Debug: Check sample records
    if (intakeRecords.length > 0) {
      console.log('🔍 Sample intake records:');
      intakeRecords.slice(0, 5).forEach((record, i) => {
        console.log(`  ${i+1}. Location: "${record.foundLocation}", Date: ${record.datetime}`);
      });
    } else {
      console.log('⚠️ No intake records found with foundLocation field');
      
      // Check what fields exist in intake records
      const sampleRecord = await IntakeRecord.findOne({});
      if (sampleRecord) {
        console.log('🔍 Sample record fields:', Object.keys(sampleRecord.toObject()));
        console.log('🔍 Sample record:', JSON.stringify(sampleRecord.toObject(), null, 2));
        
        // Try alternative field names
        const altFields = ['location', 'found_location', 'Found Location', 'Location'];
        for (const field of altFields) {
          const altRecords = await IntakeRecord.find(
            { [field]: { $exists: true, $nin: [null, ""] } },
            { [field]: 1, datetime: 1 }
          ).limit(10);
          if (altRecords.length > 0) {
            console.log(`✅ Found ${altRecords.length} records with field '${field}'`);
            const sample: any = altRecords[0] as any;
            console.log(`🔍 Sample: "${sample[field as any]}"`);
            break;
          }
        }
      } else {
        console.log('❌ No intake records found at all');
      }
    }

    // Process records to extract Region and Year
    const regionYearCounts: Record<string, Record<number, number>> = {};
    const regionTotals: Record<string, number> = {};

    const normalizeLabel = (s: string) => s.trim().replace(/\s+/g, ' ');

    const deriveYear = (rec: any): number | null => {
      const tryParseYear = (s?: string): number | null => {
        if (!s) return null;
        const t = String(s).trim();
        // ISO or generally parseable
        const iso = new Date(t);
        if (!isNaN(iso.getTime())) return iso.getFullYear();
        // M/D/YYYY [time]
        let m = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
        if (m) return Number(m[3]);
        // D-M-YYYY or D/M/YYYY [time]
        m = t.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/);
        if (m) return Number(m[3]);
        // YYYY-MM
        m = t.match(/^(\d{4})[-/](\d{1,2})$/);
        if (m) return Number(m[1]);
        // MM-YYYY
        m = t.match(/^(\d{1,2})[-/](\d{4})$/);
        if (m) return Number(m[2]);
        return null;
      };

      const year1 = tryParseYear(rec.datetime);
      if (Number.isFinite(year1 as any)) return year1 as number;
      const year2 = tryParseYear(rec.monthyear);
      if (Number.isFinite(year2 as any)) return year2 as number;
      return null;
    };

    const bucketFromLocation = (loc?: string): string | undefined => {
      if (!loc) return undefined;
      const s = String(loc).trim();
      // remove house number at start
      let t = s.replace(/^\s*\d+\s+/, '');
      // remove trailing 'in <city> (state)' or 'in <city>'
      t = t.replace(/\s+in\s+[^,()]+(?:\s*\([^)]*\))?$/i, '');
      // canonical whitespace
      t = t.replace(/\s+/g, ' ').trim();
      if (!t) return undefined;
      return t;
    };

    const quadrantFromString = (s?: string): string | undefined => {
      if (!s) return undefined;
      const sum = Array.from(s).reduce((a, c) => a + c.charCodeAt(0), 0);
      const q = sum % 4;
      return ['Quadrant A','Quadrant B','Quadrant C','Quadrant D'][q];
    };

    intakeRecords.forEach(record => {
      if (!record) return;
      const year = deriveYear(record as any);
      if (!Number.isFinite(year as any)) return;
      let region = (record as any).region as string | undefined;
      if (!region) {
        const locRaw = (record as any).foundLocation as string | undefined;
        region = regionFromAddress(locRaw) || bucketFromLocation(locRaw) || quadrantFromString(locRaw);
      }
      if (!region) region = 'Unknown';

      const label = normalizeLabel(region);
      if (!regionYearCounts[label]) {
        regionYearCounts[label] = {};
        regionTotals[label] = 0;
      }
      if (!regionYearCounts[label][year as number]) {
        regionYearCounts[label][year as number] = 0;
      }
      regionYearCounts[label][year as number]++;
      regionTotals[label]++;
    });
    
    console.log('🔍 Region totals after processing (sample):', Object.entries(regionTotals).slice(0,5));

    // Get all unique years and sort them
    const allYears = new Set<number>();
    Object.values(regionYearCounts).forEach((yearData: any) => {
      Object.keys(yearData).forEach((year: any) => allYears.add(parseInt(year as any)));
    });
    const sortedYears = Array.from(allYears).sort();

    // Sort regions by total intake count (descending)
    const sortedRegions = Object.entries(regionTotals)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([label]) => label);

    // Compute risk tiers from REGION TOTALS (not per-cell counts)
    const totalsArray = Object.values(regionTotals).sort((a, b) => a - b);
    const p25 = totalsArray.length ? totalsArray[Math.floor(totalsArray.length * 0.25)] : 0;
    const p75 = totalsArray.length ? totalsArray[Math.floor(totalsArray.length * 0.75)] : 0;
    const regionRisk: Record<string, 1 | 2 | 3> = {};
    for (const [r, t] of Object.entries(regionTotals)) {
      if (t <= p25) regionRisk[r] = 1;          // Low
      else if (t <= p75) regionRisk[r] = 2;     // Medium
      else regionRisk[r] = 3;                   // High
    }

    // Create heatmap data matrix
    const heatmapData: any[] = [];
    const zValues: number[][] = [];
    const countsMatrix: number[][] = [];

    sortedRegions.forEach((label) => {
      const regData = regionYearCounts[label] || {};
      const row: number[] = [];
      const countsRow: number[] = [];
      sortedYears.forEach((year) => {
        const count = regData[year] || 0;
        const riskLevel = regionRisk[label] || 1; // color by region tier

        row.push(riskLevel);
        countsRow.push(count);
        heatmapData.push({
          x: year,
          y: label,
          z: riskLevel,
          count,
          region: label,
          year,
          riskLevel
        });
      });
      zValues.push(row);
      countsMatrix.push(countsRow);
    });
    
    console.log('🎨 Region risk tiers by totals:', { p25, p75 });

    console.log(`📈 Heatmap data generated:`);
    console.log(`   Years: ${sortedYears.length}${sortedYears.length ? ` (${sortedYears[0]}-${sortedYears[sortedYears.length-1]})` : ''}`);
    console.log(`   Regions: ${sortedRegions.length}`);
    console.log(`   Total records processed: ${intakeRecords.length}`);
    console.log(`   Risk cutoffs by totals - P25: ${p25}, P75: ${p75}`);

    // Ranked summary of regions with risk labels
    const rankedSummary = Object.entries(regionTotals)
      .map(([label, total]) => ({ label, total, risk: regionRisk[label] }))
      .sort((a, b) => b.total - a.total);

    const highRiskZones = rankedSummary.filter(r => r.risk === 3).slice(0, 5);

    const verification = {
      totalRecords: intakeRecords.length,
      totalByRegions: Object.values(regionTotals).reduce((a, b) => a + b, 0),
      regionCount: Object.keys(regionTotals).length,
      yearCount: sortedYears.length,
      matched: intakeRecords.length === Object.values(regionTotals).reduce((a, b) => a + b, 0)
    };

    // If no regions or years, return safe empty payload
    if (!sortedYears.length || !sortedRegions.length) {
      return res.json({ success: true, data: { years: [], regions: [], heatmapData: [], zValues: [], countsMatrix: [], thresholds: { low: 0, medium: 0 }, totalRecords: intakeRecords.length, regionTotals: {}, highRiskZones: [], rankedSummary: [], verification } });
    }

    res.json({
      success: true,
      data: {
        years: sortedYears,
        regions: sortedRegions, // y-axis labels now Found Locations (top N)
        heatmapData: heatmapData,
        zValues: zValues,
        countsMatrix: countsMatrix,
        thresholds: {
          low: p25,
          medium: p75
        },
        totalRecords: intakeRecords.length,
        regionTotals: Object.fromEntries(sortedRegions.map(l => [l, regionTotals[l] || 0])),
        highRiskZones,
        rankedSummary,
        verification
      }
    });

  } catch (error: any) {
    console.error('Error generating intake heatmap:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate intake heatmap data',
      message: error.message 
    });
  }
};

export const getSummary = async (req: Request, res: Response) => {
  try {
    const totalIntakes = await IntakeRecord.countDocuments();
    const totalOutcomes = await OutcomeRecord.countDocuments();
    
    console.log(`📊 Analytics Summary:`);
    console.log(`   Total Intakes: ${totalIntakes}`);
    console.log(`   Total Outcomes: ${totalOutcomes}`);

    const outcomesByType = await OutcomeRecord.aggregate([
      { $group: { _id: "$outcomeType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    
    console.log(`   Outcomes by Type:`, outcomesByType);

    // Count any outcome types that indicate adoption (case-insensitive, e.g., Adoption, Adopted)
    const totalAdoptions = await OutcomeRecord.countDocuments({ outcomeType: { $regex: /^adopt/i } });
    console.log(`   Total Adoptions (regex match): ${totalAdoptions}`);

    // Animal type distribution from intakes (record counts)
    const animalTypeBreakdown = await IntakeRecord.aggregate([
      { $group: { _id: "$animalType", intakes: { $sum: 1 } } },
      { $sort: { intakes: -1 } },
    ]);

    const intakeConditionBreakdown = await IntakeRecord.aggregate([
      { $group: { _id: "$intakeCondition", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Total unique animals (by distinct animalId in intake records)
    const totalAnimals = (await IntakeRecord.distinct("animalId")).length;
    const adoptionRate = totalOutcomes > 0 ? (totalAdoptions / totalOutcomes) * 100 : 0;

    // Seasonal breakdown analysis
    const seasonalBreakdown = await OutcomeRecord.aggregate([
      {
        $addFields: {
          month: { $month: "$datetime" },
          season: {
            $switch: {
              branches: [
                { case: { $in: ["$month", [3, 4, 5]] }, then: "Spring" },
                { case: { $in: ["$month", [6, 7, 8]] }, then: "Summer" },
                { case: { $in: ["$month", [9, 10, 11]] }, then: "Fall" },
                { case: { $in: ["$month", [12, 1, 2]] }, then: "Winter" }
              ],
              default: "Unknown"
            }
          }
        }
      },
      {
        $group: {
          _id: "$season",
          adoptions: {
            $sum: {
              $cond: [{ $regexMatch: { input: "$outcomeType", regex: /^adopt/i } }, 1, 0]
            }
          },
          totalOutcomes: { $sum: 1 }
        }
      },
      {
        $addFields: {
          season: "$_id",
          percentage: {
            $multiply: [
              { $divide: ["$adoptions", "$totalOutcomes"] },
              100
            ]
          }
        }
      },
      { $sort: { adoptions: -1 } }
    ]);

    res.json({
      totalIntakes,
      totalOutcomes,
      totalAdoptions,
      totalAnimals,
      adoptionRate: adoptionRate.toFixed(2),
      outcomesByType,
      animalTypeBreakdown,
      intakeConditionBreakdown,
      seasonalBreakdown,
    });
  } catch (error) {
    console.error("Failed to fetch analytics summary:", error);
    res.status(500).json({ error: "Failed to fetch analytics summary" });
  }
};