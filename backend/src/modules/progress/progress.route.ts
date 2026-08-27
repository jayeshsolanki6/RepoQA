import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js"

import {
    streamProgress,
} from "./progress.controller.js";

const router = Router();

router.use(authenticate);

router.get(
    "/repositories/:repositoryId/progress",
    streamProgress
);

export default router;