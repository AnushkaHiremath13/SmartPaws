import mongoose, { Schema, Document } from "mongoose";

export interface IIntakeRecord extends Document {
    animalId: string;
    name?: string;
    datetime: Date;
    monthyear: string;
    foundLocation: string;
    region?: string;
    intakeType: string;
    intakeCondition: string;
    animalType: string;
    sexUponIntake: string;
    ageUponIntake: string;
    breed: string;
    color: string;
}

const IntakeSchema: Schema = new Schema(
    {
        animalId: { type: String, required: true, index: true },
        name: { type: String },
        datetime: { type: Date, required: true, index: true },
        monthyear: { type: String },
        foundLocation: { type: String },
        region: { type: String, index: true },
        intakeType: { type: String },
        intakeCondition: { type: String },
        animalType: { type: String },
        sexUponIntake: { type: String },
        ageUponIntake: { type: String },
        breed: { type: String },
        color: { type: String },
    },
    { 
        timestamps: true,
        validateBeforeSave: false  // Skip validation for faster inserts
    }
);

export default mongoose.model<IIntakeRecord>("IntakeRecord", IntakeSchema);