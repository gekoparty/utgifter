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
    incomeEstimateMode: { type: String, enum: ["manual", "history"], default: "manual" },
    incomeEstimateMonths: { type: Number, enum: [6, 12], default: 12 },
    expectedMonthlyIncome: {
      type: Number,
      default: 0,
      min: 0,
    },
    preferences: {
      language: {
        type: String,
        enum: ["nb", "en"],
        default: "nb",
      },
    },
  },
  { timestamps: true }
);

const AppUser = mongoose.model("AppUser", appUserSchema);

export default AppUser;
