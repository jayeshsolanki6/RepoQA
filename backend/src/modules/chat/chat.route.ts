import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js"
import { ask, createChat } from "./chat.controller.js";

const router = Router();

router.use(authenticate);

router.post(
    "/repositories/:repositoryId/ask",
    ask
);

router.post(
    "/repositories/:repositoryId/conversations",
    createChat
);

export default router;