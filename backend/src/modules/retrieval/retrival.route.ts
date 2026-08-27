import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js"
import { search } from "./retrieval.controller.js";

const router = Router();

router.use(authenticate);

router.post(
    "/repositories/:repositoryId/search",
    search
);

export default router;