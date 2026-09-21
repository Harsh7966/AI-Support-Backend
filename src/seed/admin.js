import dns from "dns";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../Schema/auth/userSchema.js";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const seedAdmin = async () => {
    try {
        // Connect MongoDB
        await mongoose.connect(process.env.CONNECTION_STRING);

        console.log("MongoDB connected");

        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({
            role: "admin",
        });

        if (existingSuperAdmin) {
            console.log("Admin already exists");
            process.exit(0);
        }

        // Super admin password
        // const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

        // Create super admin
        const superAdmin = await User.create({
            firstName: "Admin",
            lastName: "Jii",
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: "admin",
        });

        console.log("Super admin created successfully");
        console.log({
            id: superAdmin._id,
            firstName: superAdmin.firstName,
            lastName: superAdmin.lastName,
            email: superAdmin.email,
            role: superAdmin.role,
        });

        process.exit(0);
    } catch (error) {
        console.error("Error creating super admin:", error);
        process.exit(1);
    }
};

seedAdmin();
