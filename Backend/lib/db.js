import mongoose from "mongoose"

export const connectDB = async()=>
{
    try {
        const conn = await mongoose.connect(process.env.MONGOODB_URI);
        console.log(`Mongodb Connected:${conn.connection.host}`);
    
    } catch (error) {
        console.log("MongoDB connection error:",error);
    }
};