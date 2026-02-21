import express from "express";
import plan from "./plan.js";
// simulate will come next (file below)
import simulate from "./simulate.js";

const router = express.Router();
router.use("/", plan);
router.use("/", simulate);

export default router;
