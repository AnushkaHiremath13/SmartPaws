import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import { getAdoptionTrends, getHotspots } from "../controllers/predictionController";

const router = Router();

// These routes require a valid JWT token to access
router.get("/trends", protect, getAdoptionTrends);
router.get("/hotspots", protect, getHotspots);

export default router;