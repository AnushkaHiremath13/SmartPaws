const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const mongoose = require('mongoose');

const IntakeRecord = require('../../src/models/IntakeRecord').default;
const OutcomeRecord = require('../../src/models/OutcomeRecord').default;

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      out[key] = args[i + 1];
      i++;
    }
  }
  return out;
}

function parseAgeToMonths(ageStr) {
  if (!ageStr || typeof ageStr !== 'string') return null;
  ageStr = ageStr.toLowerCase().trim();
  let months = 0;
  const yearMatch = ageStr.match(/(\d+)\s*yr|(\d+)\s*year/);
  const multiMatch = ageStr.match(/(\d+)\s*year[s]?\s*(\d+)\s*month/);
  if (multiMatch) {
    months = parseInt(multiMatch[1], 10) * 12 + parseInt(multiMatch[2], 10);
    return months;
  }
  const y = ageStr.match(/(\d+)\s*year/);
  if (y) {
    months += parseInt(y[1], 10) * 12;
  }
  const m = ageStr.match(/(\d+)\s*month/);
  if (m) months += parseInt(m[1], 10);
  const w = ageStr.match(/(\d+)\s*week/);
  if (w) months += Math.round(parseInt(w[1], 10) / 4.345);
  if (months === 0) {
    const n = ageStr.match(/(\d+)/);
    if (n) months = parseInt(n[1], 10);
  }
  return months || null;
}

async function run() {
  const args = parseArgs();
  const mongo = args.mongo || args.mongo_uri || args.mongoUri || args.mongoUri;
  const intakePath = args.intake;
  const outcomePath = args.outcome;

  if (!mongo || !intakePath || !outcomePath) {
    console.error("Missing args. Example: node load_austin.js --mongo <URI> --intake <file.csv> --outcome <file.csv>");
    process.exit(1);
  }

  await mongoose.connect(mongo);
  console.log("Connected to Mongo");

  async function processFile(filePath, Model, normalizer) {
    let inserted = 0, updated = 0;
    console.log(`Ingesting from: ${filePath}`);
    const stream = fs.createReadStream(filePath).pipe(csv());
    for await (const row of stream) {
      try {
        const doc = normalizer(row);
        const filter = { animalId: doc.animalId, datetime: doc.datetime };
        const update = { $set: doc };
        const res = await Model.updateOne(filter, update, { upsert: true });
        if (res.upsertedCount > 0) inserted++;
        else updated++;
      } catch (err) {
        console.error("Row error:", err);
      }
    }
    console.log(`Processed. inserted: ${inserted}, updated: ${updated}`);
  }

  const normalizeIntake = (row) => ({
    animalId: row['Animal ID'] || null,
    name: row['Name'] || null,
    datetime: new Date(row['DateTime']),
    monthyear: row['MonthYear'],
    foundLocation: row['Found Location'] || null,
    intakeType: row['Intake Type'] || null,
    intakeCondition: row['Intake Condition'] || null,
    animalType: row['Animal Type'] || null,
    sexUponIntake: row['Sex upon Intake'] || null,
    ageUponIntake: row['Age upon Intake'] || null,
    breed: row['Breed'] || null,
    color: row['Color'] || null,
  });

  const normalizeOutcome = (row) => ({
    animalId: row['Animal ID'] || null,
    name: row['Name'] || null,
    datetime: new Date(row['DateTime']),
    monthyear: row['MonthYear'],
    outcomeType: row['Outcome Type'] || null,
    outcomeSubtype: row['Outcome Subtype'] || null,
    animalType: row['Animal Type'] || null,
    sexUponOutcome: row['Sex upon Outcome'] || null,
    ageUponOutcome: row['Age upon Outcome'] || null,
    breed: row['Breed'] || null,
    color: row['Color'] || null,
  });

  await processFile(intakePath, IntakeRecord, normalizeIntake);
  await processFile(outcomePath, OutcomeRecord, normalizeOutcome);

  console.log("Done. Disconnecting...");
  await mongoose.disconnect();
  console.log("Disconnected.");
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });