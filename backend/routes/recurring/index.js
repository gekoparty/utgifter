import express from "express";
import summary from "./summary.js";
import terms from "./terms.js";
import pause from "./pause.js";
import purge from "./purge.js";
import crud from "./crud.js";

const router = express.Router();

// ✅ static/special routes first (so they don't get caught by "/:id")
router.use("/", purge);
router.use("/", summary);
router.use("/", terms);
router.use("/", pause);

// ✅ CRUD last (contains "/:id")
router.use("/", crud);

export default router;