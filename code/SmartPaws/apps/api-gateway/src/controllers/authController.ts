// src/controllers/authController.ts
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import { AuthRequest } from "../middleware/authMiddleware";
import File from "../models/File";

// ✅ REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, phone = '', address = '', bio = '' } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Only allow NGO owners and admins
    if (!["ngo", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      bio,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const jwtSecret = process.env.JWT_SECRET || "defaultsecret"; // ✅ fallback
    const token = jwt.sign(
      { id: user._id, role: user.role },
      jwtSecret,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ UPDATE PROFILE (name, phone, address, bio)
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { phone, address, bio } = req.body as any;

    const updated = await User.findByIdAndUpdate(
      userId,
      { phone, address, bio },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({
      message: "Profile updated",
      user: {
        id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone,
        address: updated.address,
        bio: updated.bio,
      },
    });
  } catch (error: any) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ✅ GET CURRENT USER PROFILE + BASIC STATS
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await (await import("../models/User")).default.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Stats from files collection
    const files = await File.find({ uploadedBy: userId }).sort({ uploadDate: -1 });
    const totalRecords = files.reduce((sum: number, f: any) => sum + (f.records || 0), 0);
    const recentFiles = files.slice(0, 5);

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        bio: user.bio,
        createdAt: user.createdAt
      },
      stats: {
        dataFiles: files.length,
        totalRecords,
        analysisReports: 0
      },
      recentFiles
    });
  } catch (error: any) {
    console.error("Get profile error:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
