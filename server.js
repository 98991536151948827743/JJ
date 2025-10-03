import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; 

import authRouter from './route/auth.route.js';
import profileRouter from './route/profile.route.js';
import { connectToMongo } from './database/mongoConnection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Quotes API');
});

// Routers
app.use("/api/auth", authRouter);        // auth routes
app.use("/api/profile", profileRouter);  // profile routes

// Connect to MongoDB and start server
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api`);
  });
});

export default app;
