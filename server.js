import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './route/authroute.js'

import cookieParser from 'cookie-parser'; 
import { connectToMongo } from './database/mongoConnection.js'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173", // 👈 your frontend URL
    credentials: true, // 👈 allow cookies
  })
);
app.use(express.json());
app.use(cookieParser());

// connection to mongoDB
connectToMongo().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on: http://localhost:${PORT}`);
  });
});


app.get('/', (req, res) => {
  res.send('Welcome to the Quotes API');
});

app.use("/api/", router);

// sendOtpToUser('rahul5g3d@gmail.com')

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api`);
});


export default app;