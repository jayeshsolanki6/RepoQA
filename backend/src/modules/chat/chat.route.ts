import { Router } from "express";

import { authenticate } from "../../middleware/authenticate.js"
import { ask, createChat, getMessages, listConversations } from "./chat.controller.js";
import { validate } from "../../middleware/validate.js";
import { askSchema } from "./chat.validation.js";

const router = Router();

router.use(authenticate);

router.post("/repositories/:repositoryId/ask", validate(askSchema, "body"), ask);

router.post("/repositories/:repositoryId/conversations", createChat);

router.get("/repositories/:repositoryId/conversations", listConversations);

router.get("/conversations/:conversationId/messages", getMessages);

export default router;