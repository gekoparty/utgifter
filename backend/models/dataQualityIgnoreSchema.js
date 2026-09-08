import mongoose from "mongoose";

const dataQualityIgnoreSchema = new mongoose.Schema(
  {
    issueType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityType: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      default: "",
      trim: true,
    },
    ownerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppUser",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

dataQualityIgnoreSchema.index(
  { ownerUserId: 1, issueType: 1, entityType: 1, entityId: 1 },
  { unique: true },
);

export default mongoose.model("DataQualityIgnore", dataQualityIgnoreSchema);
