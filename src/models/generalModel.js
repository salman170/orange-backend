import mongoose from "mongoose";

const generalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    message: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },

    leadFrom: {
      type: String,
      require: true,
    },
    date: {
      type: String,
    },
    time: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const generalModel = new mongoose.Schema(generalSchema, { timestamps: true });

export default mongoose.model("generalEnquiry", generalModel);
