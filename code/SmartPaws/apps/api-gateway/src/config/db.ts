import mongoose from "mongoose";

const connectDB = async (): Promise<typeof mongoose> => {
  try {
    const MONGO_URI = process.env.MONGO_URI;

    if (!MONGO_URI) {
      throw new Error("❌ MONGO_URI is not defined in environment variables");
    }

    const conn = await mongoose.connect(MONGO_URI);

    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1); // Stop the app if DB connection fails
  }
};

export default connectDB;
