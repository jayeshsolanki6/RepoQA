import express from 'express'
import dotenv from 'dotenv'

import authRoute from './modules/auth/auth.route.js'
import repoRoute from './modules/repository/repository.route.js'
import retrievalRoutes from "./modules/retrieval/retrival.route.js"
import chatRoutes from './modules/chat/chat.route.js'
import progressRoutes from "./modules/progress/progress.route.js"

import './queue/indexing.worker.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());

app.get("/", (req, res)=>{
    res.send("Server working.");
})

app.use('/api/auth', authRoute);
app.use('/api/repositories', (req, res, next) => {console.log(req.headers); next()}, repoRoute);
app.use("/api", retrievalRoutes);
app.use("/api", chatRoutes)
app.use("/api", progressRoutes);

app.listen(PORT, ()=>{
    console.log("Server started on PORT:", PORT);
})