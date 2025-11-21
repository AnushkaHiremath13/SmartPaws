import mongoose, { Schema, Document } from "mongoose";

export interface IOutcomeRecord extends Document {
    animalId: string;
    name?: string;
    datetime: Date;
    monthyear: string;
    outcomeType: string;
    outcomeSubtype?: string;
    animalType: string;
    sexUponOutcome: string;
    ageUponOutcome: string;
    breed: string;
    color: string;
}

const OutcomeSchema: Schema = new Schema(
    {
        animalId: { type: String, required: true, index: true },
        name: { type: String },
        datetime: { type: Date, required: true, index: true },
        monthyear: { type: String },
        outcomeType: { type: String },
        outcomeSubtype: { type: String },
        animalType: { type: String },
        sexUponOutcome: { type: String },
        ageUponOutcome: { type: String },
        breed: { type: String },
        color: { type: String },
    },
    { 
        timestamps: true,
        validateBeforeSave: false  // Skip validation for faster inserts
    }
);

export default mongoose.model<IOutcomeRecord>("OutcomeRecord", OutcomeSchema);