import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js"
import { search } from "./retrieval.controller.js";
import { validate } from "../../middleware/validate.js";
import { searchSchema } from "./retrieval.validation.js";

const router = Router();

router.post("/repositories/:repositoryId/search", authenticate, validate(searchSchema, "body"), search);

export default router;