import dns from "dns";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDb from "./utils/dbConnection.js";
import auth from "./routes/authRoutes/auth.js";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

const app= express();

//Middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//Routes
app.use("/api/v1", auth)

const PORT= process.env.PORT;
connectDb();
app.listen(PORT, ()=>{
    console.log(`Server run on port ${PORT}`);
})