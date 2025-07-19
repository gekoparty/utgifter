import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import categoriesRouter from "./routes/categoriesRouter.js";
import shopsRouter from "./routes/shopsRouter.js";
import locationsRouter from "./routes/locationsRouter.js";
import brandsRouter from "./routes/brandsRouter.js";
import helmet from "helmet";
import cors from 'cors';
import compression from "compression";
import productsRouter from "./routes/productsRouter.js";
import expensesRouter from "./routes/expensesRouter.js";
import statsRouter from "./routes/statsRouter.js";
import path from 'path';
import { fileURLToPath } from 'url';

// Configure environment variables FIRST
dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

// Security and performance middlewares
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Replace with your frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Database connection
mongoose.set("strictQuery", false);
connectToDB();

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API routes
app.use("/api/categories", categoriesRouter);
app.use("/api/shops", shopsRouter);
app.use('/api/locations', locationsRouter);
app.use("/api/brands", brandsRouter);
app.use("/api/products", productsRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/stats", statsRouter);

// For production: Serve frontend static files if using single service approach
if (process.env.NODE_ENV !== 'production') {
  // Serve frontend build locally only (e.g. after running `npm run build` in frontend)
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  // In production, serve a simple message or API only
  app.get('/', (req, res) => {
    res.send('API is running. Frontend is hosted separately.');
  });
}


// Error handling middleware (uncomment and improve)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Server startup
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB");
  } catch (err) {
    console.error("Database connection error:", err.message);
    process.exit(1); // Exit if DB connection fails
  }
}