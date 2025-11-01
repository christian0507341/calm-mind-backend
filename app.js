// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import { authenticateToken } from "./src/middleware/auth.js";

// -------------------- ROUTE IMPORTS --------------------
import userRoutes from "./src/modules/auth/routes/user.routes.js";
import getStartedRoutes from "./src/modules/getStarted/routes/getStarted.routes.js";
import stressRoutes from "./src/modules/stress/routes/stress.routes.js";
import coachRoutes from "./src/modules/coach/routes/coach.routes.js";
import tasksRoutes from "./src/modules/tasks/routes/tasks.routes.js";
import llmRoutes from "./src/llm/routes/llm.routes.js";
import profileRoutes from "./src/modules/routes/profile.routes.js";
import notificationRoutes from "./src/modules/notifications/routes/notification.routes.js"; // ✅ NEW

dotenv.config();

const app = express();

// -------------------- MIDDLEWARE --------------------
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// -------------------- ROUTES --------------------

// Public / Auth routes
app.use("/api/users", userRoutes); // user auth routes
app.use("/api/get-started", getStartedRoutes); // onboarding

// Protected routes (require token)
app.use("/api/stress", authenticateToken, stressRoutes);
app.use("/api/coach", authenticateToken, coachRoutes);
app.use("/api/tasks", authenticateToken, tasksRoutes);
app.use("/api/llm", authenticateToken, llmRoutes);
app.use("/api/notifications", authenticateToken, notificationRoutes); // ✅ NEW notifications route

// Profile route (check if this should be protected)
app.use("/api/getStarted", profileRoutes);

// -------------------- STATIC FILES --------------------
app.use("/uploads", express.static("uploads"));

// -------------------- ROOT --------------------
app.get("/", (req, res) => {
  res.send("Calm Mind Backend API is running...");
});

// -------------------- MONGODB CONNECTION --------------------
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000, // Fail fast if MongoDB is not reachable
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  })
  .then(() => {
    console.log("✅ MongoDB connected to:", MONGO_URI);
    // Log the available collections
    mongoose.connection.db.listCollections().toArray((err, collections) => {
      if (err) {
        console.error("Error listing collections:", err);
      } else {
        console.log(
          "📚 Available collections:",
          collections.map((c) => c.name).join(", ")
        );
      }
    });
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log("All user routes available under /api/users");
      console.log("Notifications routes available under /api/notifications ✅");
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
  });
