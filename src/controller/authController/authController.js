import User from "../../Schema/auth/userSchema.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const loginSignupAuth = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (email && password && role) {
            const isEmailExist = await User.findOne({ email });
            if (isEmailExist) return res.status(200).json({
                status: false,
                msg: "Email already exist"
            })
            const hashedPassword = await bcrypt.hash(password, 10);
            const register = await User.create({ email, password: hashedPassword, role });
            if (register) return res.status(200).json({
                status: true,
                msg: "User register successfully"
            })
        } else {
            if (email && password) {
                const isUserExist = await User.findOne({ email });
                if (!isUserExist) return res.status(200).json({
                    status: false,
                    msg: "User not found"
                })
                // Verify password
                const isMatch = await bcrypt.compare(password, isUserExist?.password);
                if (isMatch) {
                    const token = jwt.sign(
                        {
                            userId: isUserExist._id,
                            email: isUserExist.email,
                            role: isUserExist.role
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: process.env.JWT_EXPIRES_IN
                        }
                    )

                    return res.status(200).json({
                        status: true,
                        msg: "User login successfully",
                        jwt: token
                    })
                } else {
                    return res.status(200).json({
                        status: false,
                        msg: "Invalid user password"
                    })
                }
            }
        }
    } catch (err) {
        console.log(err, "Internal server error");
    }
}

export default {
    loginSignupAuth
}