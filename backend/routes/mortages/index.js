// routes/mortgages/index.js
import express from "express";
import plan from "./plan.js";
import simulate from "./simulate.js";
import hardDelete from "./hardDelete.js";

const router = express.Router();

router.use("/", plan);
router.use("/", simulate);
router.use("/", hardDelete);

export default router;
