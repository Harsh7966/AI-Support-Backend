import mongoose, { model } from "mongoose";

const AuthSchema= new mongoose.Schema({
    firstName:{
        type: String,
        trim: true,
        default: null
    },
    lastName:{
        type: String,
        trim: true,
        default: null
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      default: "user",
    },
    phone: {
      type: String,
      default: null,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastLoginAt: {
      type: Date,
      default: null,
    }
},
{
    timestamps: true,
}
)

const User = mongoose.model("User", AuthSchema);

export default User;