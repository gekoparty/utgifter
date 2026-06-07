import express from "express";
import summary from "./summary.js";
import terms from "./terms.js";
import pause from "./pause.js";
import purge from "./purge.js";
import crud from "./crud.js";

const router = express.Router();

router.use("/", purge);
router.use("/", summary);
router.use("/", terms);
router.use("/", pause);

// CRUD routes include "/:id", so they must stay last.
router.use("/", crud);

export default router;
