import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
export const signup = async(req,res)=>
{
    const {fullname,email,password} = req.body
    try {
        //hash passwords
        if(password.length <6)
        {
            return res.staus(400).json({message:"Password must be at least 6 characters"});
        }
        const user = await User.findOne({email});
        if(user) return res.staus(400),json({message:"Email already exits"});

        const salt = await b
    } catch (error) {
        
    }
}

export const login = (req,res)=>
{
    res.send("login  route");
}

export const logout = (req,res)=>
{
    res.send("logout route");
}