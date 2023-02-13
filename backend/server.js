import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

const port = process.env.PORT || 5000;
const app = express();
app.use(express.json());
dotenv.config();

mongoose.set("strictQuery", false);

connectToDB();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

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
