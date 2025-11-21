import express, { Application, Request, Response } from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

import connectDB from "./config/db";
import analyticsRoutes from "./routes/analytics";
import authRoutes from "./routes/auth";
import dataRoutes from "./routes/data";
import predictionRoutes from "./routes/predictionRoutes"; // Import the new prediction routes
import fileRoutes from "./routes/files"; // Import file management routes

// Load environment variables early
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ✅ Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "SmartPaws API is running 🚀" });
});

// ✅ Routes
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/data", dataRoutes);
app.use("/api/v1/predictions", predictionRoutes); // ✅ Use the new prediction routes
app.use("/api/v1/files", fileRoutes); // ✅ Add file management routes

// ✅ Start server only if DB connects
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database:", error);
    process.exit(1); // Stop process if DB connection fails
  }
};

startServer();