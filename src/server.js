import "dotenv/config";
import dns from "dns";
import express from "express";
import cors from "cors";
import http from "http";
import connectDb from "./utils/dbConnection.js";
import auth from "./routes/authRoutes/auth.js";
import adminRoutes from "./routes/admin/adminRoute.js";
import userRoutes from "./routes/customers/userRoute.js";
import agentRoute from "./routes/agent/agentRoute.js";
import aiRoute from "./routes/ai/aiRoutes.js";
import { initSocket } from "./socket.js";
import { aiLimiter } from "./middleware/ai_rateLimiter.js";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app= express();

//Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Routes
app.use("/api/v1", auth);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/agent", agentRoute)
app.use("/api/v1/ai", aiLimiter, aiRoute)

const PORT= process.env.PORT;
connectDb();

// Socket ko raw http server chahiye, isliye app ko http server me lapeta
const server= http.createServer(app);
initSocket(server);
server.listen(PORT, ()=>{
    console.log(`Server run on port ${PORT}`);
})