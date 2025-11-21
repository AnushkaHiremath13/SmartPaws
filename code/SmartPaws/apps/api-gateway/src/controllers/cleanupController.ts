import { Request, Response } from "express";
import IntakeRecord from "../models/IntakeRecord";
import OutcomeRecord from "../models/OutcomeRecord";

export const cleanupData = async (req: Request, res: Response) => {
  try {
    const { type } = req.body;
    
    let intakeResult = { deletedCount: 0 };
    let outcomeResult = { deletedCount: 0 };
    
    // Delete based on type parameter
    if (!type || type === 'all' || type === 'intake') {
      intakeResult = await IntakeRecord.deleteMany({});
      console.log(`🗑️ Deleted ${intakeResult.deletedCount} intake records`);
    }
    
    if (!type || type === 'all' || type === 'outcome') {
      outcomeResult = await OutcomeRecord.deleteMany({});
      console.log(`🗑️ Deleted ${outcomeResult.deletedCount} outcome records`);
    }

    res.status(200).json({
      message: "Data cleaned up successfully",
      deletedIntakes: intakeResult.deletedCount,
      deletedOutcomes: outcomeResult.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup failed:", error);
    res.status(500).json({ message: "Data cleanup failed", error });
  }
};
