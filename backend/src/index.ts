import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser';
import cors from 'cors'

import { errorHandler } from './middleware/errorHandler.js'

import authRoute from './modules/auth/auth.route.js'
import repoRoute from './modules/repository/repository.route.js'
import retrievalRoutes from "./modules/retrieval/retrieval.route.js"
import chatRoutes from './modules/chat/chat.route.js'
import progressRoutes from "./modules/progress/progress.route.js"

import './queue/indexing.worker.js'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // required since you're using cookies for refresh tokens
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res)=>{
    res.send("Server working.");
})

app.use('/api/auth', authRoute);
app.use('/api/repositories', repoRoute);
app.use("/api", retrievalRoutes);
app.use("/api", chatRoutes)
app.use("/api", progressRoutes);

app.use(errorHandler);

app.listen(PORT, ()=>{
    console.log("Server started on PORT:", PORT);
})