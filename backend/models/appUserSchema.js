import mongoose from "mongoose";

const appUserSchema = new mongoose.Schema(
  {
    betterAuthUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
      index: true,
    },
    expectedMonthlyIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

const AppUser = mongoose.model("AppUser", appUserSchema);

export default AppUser;
