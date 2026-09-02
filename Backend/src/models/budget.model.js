const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required for budget configuration"],
      unique: true,
      index: true,
    },
    weeklyBudget: {
      type: Number,
      required: [true, "Weekly budget limit is required"],
      min: [0, "Weekly budget cannot be negative"],
    },
    monthlyBudget: {
      type: Number,
      required: [true, "Monthly budget limit is required"],
      min: [0, "Monthly budget cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    alertThreshold: {
      type: Number,
      default: 80, // Alert percentage (e.g., 80% spent)
      min: [1, "Alert threshold must be at least 1%"],
      max: [100, "Alert threshold cannot exceed 100%"],
    },
    categoryBudgets: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

const Budget = mongoose.model("Budget", budgetSchema);
module.exports = Budget;
