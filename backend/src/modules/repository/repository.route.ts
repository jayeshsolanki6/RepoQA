import { Router } from "express";
import { authenticate } from "../../middleware/authenticate.js";
import { validate } from "../../middleware/validate.js";
import { createRepositorySchema } from "./repository.validation.js";
import { create, getAll, getOne, remove } from "./repository.controller.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createRepositorySchema, "body"), create);
router.get("/", getAll);
router.get("/:id", getOne);
router.delete("/:id", remove);

export default router;