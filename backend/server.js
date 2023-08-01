import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import categoriesRouter from "./routes/categoriesRouter.js";
import shopsRouter from "./routes/shopsRouter.js";
import locationsRouter from "./routes/locationsRouter.js";
import brandsRouter from "./routes/brandsRouter.js";
import helmet from "helmet";
import cors from 'cors'
import compression from "compression";



const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
dotenv.config();

mongoose.set("strictQuery", false);

connectToDB();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});





// Use helmet middleware for setting various HTTP headers for security
app.use(helmet());
// Enable gzip compression on responses
app.use(compression());

app.use("/api/categories", categoriesRouter);
app.use("/api/shops", shopsRouter);
app.use('/api/locations', locationsRouter)
app.use("/api/brands", brandsRouter);

app.get("/", (req, res) => {
  res.send("Hello World!");
});








// Error handling middleware
/* app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
}); */

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

async function connectToDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to DB");
  } catch (err) {
    console.error(err.message);
  }
}
