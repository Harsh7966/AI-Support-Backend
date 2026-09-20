import mongoose, { model } from "mongoose";

const AuthSchema= new mongoose.Schema({
    firstName:{
        type: String,
        trim: true
    },
    lastName:{
        type: String,
        trim: true
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
    profileImage: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
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