import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import connectDb from "./utils/dbConnection.js";

dotenv.config();

const app= express();

//Middleware
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT= process.env.PORT;
connectDb();
app.listen(PORT, ()=>{
    console.log(`Server run on port ${PORT}`);
})