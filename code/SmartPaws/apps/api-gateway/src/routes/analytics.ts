import { Router } from "express";
import { getSummary, getIntakeHeatmap } from "../controllers/analytics";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// This route is now protected and can only be accessed with a valid JWT token.
router.get("/summary", protect, getSummary);
router.get("/intake-heatmap", protect, getIntakeHeatmap);

export default router;