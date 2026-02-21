import express from "express";
import summary from "./summary.js";
import terms from "./terms.js";
import pause from "./pause.js";
import crud from "./crud.js";

const router = express.Router();

// Keep same URL structure as before:
router.use("/", summary);
router.use("/", terms);
router.use("/", pause);
router.use("/", crud);

export default router;
