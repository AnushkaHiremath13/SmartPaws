import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { uploadCsv, getIntakeRecords, getOutcomeRecords, clearAllData, backfillRegions, backfillDatetimes } from "../controllers/dataController";
import { cleanupData } from "../controllers/cleanupController";
import multer from "multer";

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Route to upload CSV files
router.post("/ingest", protect, upload.single('file'), uploadCsv);

// Routes to get data
router.get("/intake", getIntakeRecords);
router.get("/outcome", getOutcomeRecords);

// Route to clear all data
router.delete("/clear", protect, clearAllData);

// Route to cleanup data
router.delete("/cleanup", protect, cleanupData);

// Route to backfill regions on existing intake records
router.post("/backfill-regions", protect, backfillRegions);

// Route to backfill missing datetimes from MonthYear
router.post("/backfill-datetimes", protect, backfillDatetimes);

export default router;