import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import { toNodeHandler } from "better-auth/node";

import { createBetterAuth } from "./auth/betterAuth.js";
import {
  createRequireBetterAuth,
} from "./middleware/requireBetterAuth.js";
import appUsersRouter from "./routes/appUsersRouter.js";
import categoriesRouter from "./routes/categoriesRouter.js";
import shopsRouter from "./routes/shopsRouter.js";
import locationsRouter from "./routes/locationsRouter.js";
import brandsRouter from "./routes/brandsRouter.js";
import productsRouter from "./routes/productsRouter.js";
import expensesRouter from "./routes/expensesRouter.js";
import variantsRouter from "./routes/variantsRouter.js";
import statsRouter from "./routes/statsRouter.js";
import receiptsRouter from "./routes/receiptsRouter.js";
import recurringPaymentsRouter from "./routes/recurringPaymentsRouter.js";
import recurringRouter from "./routes/recurring/index.js";
import mortgagesRouter from "./routes/mortgages/index.js";

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const isAllowedExact = allowedOrigins.includes(origin);
    const isVercelPreview = /^https:\/\/.*\.vercel\.app$/.test(origin);

    if (isAllowedExact || isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-confirm-purge"],
  credentials: true,
};

app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

mongoose.set("strictQuery", false);

if (process.env.LOG_REQUESTS === "true") {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

app.get("/", (req, res) => {
  res.send("API is running.");
});

const handleError = (err, req, res, next) => {
  console.error(err.stack);

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS error",
      message: "Request origin is not allowed",
    });
  }

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
};

let server;

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

async function connectToDB() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to DB");
}

async function startServer() {
  try {
    await connectToDB();

    const auth = createBetterAuth({
      db: mongoose.connection.db,
      trustedOrigins: allowedOrigins,
    });
    const requireAuth = createRequireBetterAuth(auth);

    app.all("/api/auth/*", toNodeHandler(auth));
    app.use(express.json({ limit: "1mb" }));
    app.use("/api", requireAuth);
    app.use("/api/app-users", appUsersRouter);
    app.use("/api/categories", categoriesRouter);
    app.use("/api/shops", shopsRouter);
    app.use("/api/locations", locationsRouter);
    app.use("/api/brands", brandsRouter);
    app.use("/api/products", productsRouter);
    app.use("/api/variants", variantsRouter);
    app.use("/api/expenses", expensesRouter);
    app.use("/api/receipts", receiptsRouter);
    app.use("/api/stats", statsRouter);
    app.use("/api/recurring-payments", recurringPaymentsRouter);
    app.use("/api/recurring-expenses", recurringRouter);
    app.use("/api/mortgages", mortgagesRouter);
    app.use(handleError);

    server = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error("Server startup error:", err.message);
    process.exit(1);
  }
}

startServer();
