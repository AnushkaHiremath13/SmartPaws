import { Router } from "express";
import { register, login, updateProfile, getMe } from "../controllers/authController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.put("/profile", protect as any, updateProfile as any);
router.get("/me", protect as any, getMe as any);

export default router;
