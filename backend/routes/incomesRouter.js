import express from "express";
import mongoose from "mongoose";

import Income from "../models/incomeSchema.js";
import { ownedFilter, ownedCreateFields } from "../middleware/dataOwnership.js";
import { parseDateForStorage } from "../utils/dateUtils.js";

const incomesRouter = express.Router();

const parseAmount = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
};

const serializeIncome = (income) => ({
  _id: String(income._id),
  title: income.title,
  amount: Number(income.amount || 0),
  incomeDate: income.incomeDate,
  category: income.category || "Lønn",
  note: income.note || "",
  ownerUserId: income.ownerUserId ? String(income.ownerUserId) : undefined,
  createdAt: income.createdAt,
  updatedAt: income.updatedAt,
});

const buildPayload = (body) => {
  const title = String(body.title || "").trim();
  const amount = parseAmount(body.amount);
  const incomeDate = body.incomeDate ? parseDateForStorage(body.incomeDate) : null;
  const category = String(body.category || "Lønn").trim() || "Lønn";
  const note = String(body.note || "").trim();

  if (title.length < 2) return { error: "Navn må ha minst 2 tegn" };
  if (amount == null) return { error: "Beløp er ugyldig" };
  if (!incomeDate || Number.isNaN(incomeDate.getTime())) return { error: "Dato er ugyldig" };

  return {
    payload: {
      title,
      amount,
      incomeDate,
      category,
      note,
    },
  };
};

incomesRouter.get("/", async (req, res, next) => {
  try {
    const incomes = await Income.find(ownedFilter(req))
      .sort({ incomeDate: -1, createdAt: -1 })
      .lean();

    res.json({
      incomes: incomes.map(serializeIncome),
      meta: { totalRowCount: incomes.length },
    });
  } catch (err) {
    next(err);
  }
});

incomesRouter.post("/", async (req, res, next) => {
  try {
    const { payload, error } = buildPayload(req.body || {});
    if (error) return res.status(400).json({ message: error });

    const income = await Income.create({
      ...payload,
      ...ownedCreateFields(req),
    });

    res.status(201).json(serializeIncome(income.toObject()));
  } catch (err) {
    next(err);
  }
});

incomesRouter.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Ugyldig inntekt" });
    }

    const { payload, error } = buildPayload(req.body || {});
    if (error) return res.status(400).json({ message: error });

    const income = await Income.findOneAndUpdate(
      ownedFilter(req, { _id: req.params.id }),
      { $set: payload },
      { new: true },
    ).lean();

    if (!income) return res.status(404).json({ message: "Inntekt ble ikke funnet" });
    res.json(serializeIncome(income));
  } catch (err) {
    next(err);
  }
});

incomesRouter.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Ugyldig inntekt" });
    }

    const income = await Income.findOneAndDelete(
      ownedFilter(req, { _id: req.params.id }),
    ).lean();

    if (!income) return res.status(404).json({ message: "Inntekt ble ikke funnet" });
    res.json(serializeIncome(income));
  } catch (err) {
    next(err);
  }
});

export default incomesRouter;
