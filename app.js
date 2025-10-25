import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import { authenticateToken } from './src/middleware/auth.js';
import userRoutes from './src/modules/auth/routes/user.routes.js';
import getStartedRoutes from './src/modules/getStarted/routes/getStarted.routes.js';
import stressRoutes from './src/modules/stress/routes/stress.routes.js';
import coachRoutes from './src/modules/coach/routes/coach.routes.js';
import tasksRoutes from './src/modules/tasks/routes/tasks.routes.js';


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/get-started', getStartedRoutes);
app.use('/api/stress', authenticateToken, stressRoutes);
app.use('/api/coach', authenticateToken, coachRoutes);
app.use('/api/tasks', authenticateToken, tasksRoutes);



// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Root route
app.get('/', (req, res) => {
  res.send('Calm Mind Backend API is running...');
});

// MongoDB connection
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });