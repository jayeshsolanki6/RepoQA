import { Router } from "express";

import { streamProgress } from "./progress.controller.js";
import { authenticateSSE } from "../../middleware/authenticateSSE.js";

const router = Router();

router.use(authenticateSSE);

router.get("/repositories/:repositoryId/progress", streamProgress);

export default router;