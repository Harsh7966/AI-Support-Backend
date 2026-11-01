import jwt from "jsonwebtoken";

// Token check karke user nikalta hai. Token galat ya expire ho to null deta hai.
const getUserFromToken = (req) => {
    try {
        const token = String(req.headers.authorization || "").split(" ").pop();
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

// Jo roles allowed hain unke liye middleware banata hai
const checkRole = (allowedRoles) => (req, res, next) => {
    const user = getUserFromToken(req);
    if (!user) return res.status(401).json({ status: false, msg: "Invalid or expired token" });
    if (!allowedRoles.includes(user.role)) return res.status(200).json({ status: false, msg: "Unauthorized user" });

    // Controllers yahin se user padhte hain
    if (user.role === "admin") res.admin = user;
    if (user.role === "agent") res.agent = user;
    if (user.role === "user") res.customer = user;
    next();
};

export const adminAuthMiddleware = checkRole(["admin"]);
export const customerAuthMiddleware = checkRole(["user"]);
export const agentAuthMiddleware = checkRole(["agent"]);

// Ek se zyada role chahiye to: allowRoles("agent", "admin")
export const allowRoles = (...roles) => checkRole(roles);

// Logged-in user (kisi bhi role ka)
export const getAuthUser = (res) => res.admin || res.agent || res.customer || null;
