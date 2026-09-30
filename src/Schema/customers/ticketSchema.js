import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    assignedAgentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },

    status: {
      type: String,
      enum: ["open", "pending", "resolved", "closed"],
      default: "open",
    },
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;