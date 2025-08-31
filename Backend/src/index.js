import express from "express";
import dotenv from "dotenv";
import authRoutes from "../routes/auth.route.js"
import { connectDB } from "../lib/db.js";
const app = express();

dotenv.config()

const port = process.env.PORT;

app.use(express.json());

app.get("/",(req,res)=>
{
    res.send("Server is running");
})

app.use("/api/auth",authRoutes)

app.listen(port,()=>{
    console.log(`app is listing to ${port} no`)
    connectDB();

})