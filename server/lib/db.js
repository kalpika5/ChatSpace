import mongoose from "mongoose";
import "dotenv/config";

mongoose.set("bufferCommands", false);

let isListenersAttached = false;

// Function to connect to the mongodb database
export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (mongoose.connection.readyState === 2) return;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in the environment");
  }

  if (!isListenersAttached) {
    mongoose.connection.on("connected", () => console.log("Database Connected"));
    mongoose.connection.on("error", (error) =>
      console.error("MongoDB connection error:", error.message)
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB disconnected")
    );
    isListenersAttached = true;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000,
      retryWrites: true,
      maxPoolSize: 10,
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};
