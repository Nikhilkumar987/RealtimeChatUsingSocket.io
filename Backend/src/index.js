import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser"
import authRoutes from "../routes/auth.route.js"
import { connectDB } from "../lib/db.js";
import messageRoutes from "../routes/message.route.js"
const app = express();

dotenv.config()

const port = process.env.PORT;

app.use(express.json());
app.use(cookieParser());

app.get("/",(req,res)=>
{
    res.send("Server is running");
})

app.use("/api/auth",authRoutes)

app.use("/api/message",messageRoutes);

app.listen(port,()=>{
    console.log(`app is listing to ${port} number`)
    connectDB();
})