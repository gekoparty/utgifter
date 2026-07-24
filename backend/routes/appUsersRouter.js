import express from "express";
import mongoose from "mongoose";
import AppUser from "../models/appUserSchema.js";
import Brand from "../models/brandSchema.js";
import Category from "../models/categorySchema.js";
import Expense from "../models/expenseSchema.js";
import Location from "../models/locationSchema.js";
import Product from "../models/productSchema.js";
import ReceiptMatchAlias from "../models/receiptMatchAliasSchema.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../models/recurringTermsHistorySchema.js";
import Shop from "../models/shopSchema.js";
import Variant from "../models/variantSchema.js";
import { requireAdmin } from "../middleware/requireBetterAuth.js";

const appUsersRouter = express.Router();

const OWNED_MODELS = [
  ["brands", Brand],
  ["categories", Category],
  ["expenses", Expense],
  ["locations", Location],
  ["products", Product],
  ["receiptAliases", ReceiptMatchAlias],
  ["recurringExpenses", RecurringExpense],
  ["recurringPayments", RecurringPayment],
  ["recurringTerms", RecurringTermsHistory],
  ["shops", Shop],
  ["variants", Variant],
];

const toSafeUser = (user, dataSummary = null) => ({
  id: String(user._id),
  betterAuthUserId: user.betterAuthUserId,
  email: user.email,
  name: user.name,
  role: user.role,
  dataSummary,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const getDataSummary = async (ownerUserId) => {
  const owner = new mongoose.Types.ObjectId(ownerUserId);
  const entries = await Promise.all(
    OWNED_MODELS.map(async ([key, Model]) => [
      key,
      await Model.countDocuments({ ownerUserId: owner }),
    ]),
  );

  const byType = Object.fromEntries(entries);
  const total = Object.values(byType).reduce((sum, count) => sum + count, 0);
  return { total, byType };
};

const updateBetterAuthUserName = async ({ betterAuthUserId, name }) => {
  if (!betterAuthUserId) return;

  const userCollection = mongoose.connection.db.collection("user");
  await Promise.allSettled([
    userCollection.updateOne({ id: betterAuthUserId }, { $set: { name } }),
    userCollection.updateOne({ _id: betterAuthUserId }, { $set: { name } }),
  ]);
};

const deleteBetterAuthUser = async (betterAuthUserId) => {
  if (!betterAuthUserId) return;

  const db = mongoose.connection.db;
  await Promise.allSettled([
    db.collection("session").deleteMany({ userId: betterAuthUserId }),
    db.collection("account").deleteMany({ userId: betterAuthUserId }),
    db.collection("user").deleteOne({ id: betterAuthUserId }),
    db.collection("user").deleteOne({ _id: betterAuthUserId }),
  ]);
};

const deleteOwnedData = async (ownerUserId) => {
  const owner = new mongoose.Types.ObjectId(ownerUserId);
  const results = await Promise.all(
    OWNED_MODELS.map(async ([key, Model]) => {
      const result = await Model.deleteMany({ ownerUserId: owner });
      return [key, result.deletedCount || 0];
    }),
  );

  return Object.fromEntries(results);
};

appUsersRouter.get("/me", (req, res) => {
  res.json({ user: req.appUser });
});

appUsersRouter.patch("/me", async (req, res, next) => {
  try {
    const name = String(req.body?.name ?? "").trim();
    if (!name) return res.status(400).json({ message: "Navn er påkrevd." });

    const user = await AppUser.findByIdAndUpdate(
      req.appUser.id,
      { $set: { name } },
      { new: true, runValidators: true },
    ).lean();

    if (!user) return res.status(404).json({ message: "Bruker finnes ikke." });
    await updateBetterAuthUserName({ betterAuthUserId: user.betterAuthUserId, name });

    res.json({ user: toSafeUser(user) });
  } catch (error) {
    next(error);
  }
});

appUsersRouter.get("/", requireAdmin, async (req, res, next) => {
  try {
    const users = await AppUser.find().sort({ createdAt: 1 }).lean();
    const summaries = await Promise.all(users.map((user) => getDataSummary(user._id)));
    res.json({
      users: users.map((user, index) => toSafeUser(user, summaries[index])),
    });
  } catch (error) {
    next(error);
  }
});

appUsersRouter.patch("/:id", requireAdmin, async (req, res, next) => {
  try {
    const updates = {};
    if (["admin", "user"].includes(req.body?.role)) updates.role = req.body.role;
    if (typeof req.body?.name === "string") updates.name = req.body.name.trim();

    const target = await AppUser.findById(req.params.id).lean();
    if (!target) return res.status(404).json({ message: "Bruker finnes ikke." });

    if (updates.role && target.role === "admin" && updates.role !== "admin") {
      const adminCount = await AppUser.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Du må ha minst én administrator." });
      }
    }

    const user = await AppUser.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (updates.name != null) {
      await updateBetterAuthUserName({
        betterAuthUserId: user.betterAuthUserId,
        name: user.name,
      });
    }

    const dataSummary = await getDataSummary(user._id);
    res.json({ user: toSafeUser(user, dataSummary) });
  } catch (error) {
    next(error);
  }
});

appUsersRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    if (String(req.params.id) === String(req.appUser.id)) {
      return res.status(400).json({ message: "Du kan ikke slette din egen bruker." });
    }

    const user = await AppUser.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "Bruker finnes ikke." });

    if (user.role === "admin") {
      const adminCount = await AppUser.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Du må ha minst én administrator." });
      }
    }

    const dataSummary = await getDataSummary(user._id);
    const deleteData = req.query.deleteData === "1" || req.body?.deleteData === true;

    if (dataSummary.total > 0 && !deleteData) {
      return res.status(409).json({
        message: "Brukeren har data. Velg slett data sammen med bruker.",
        dataSummary,
      });
    }

    const deletedData = deleteData ? await deleteOwnedData(user._id) : {};
    await deleteBetterAuthUser(user.betterAuthUserId);
    await AppUser.deleteOne({ _id: user._id });

    res.json({
      ok: true,
      deletedUser: toSafeUser(user, dataSummary),
      deletedData,
    });
  } catch (error) {
    next(error);
  }
});

export default appUsersRouter;
