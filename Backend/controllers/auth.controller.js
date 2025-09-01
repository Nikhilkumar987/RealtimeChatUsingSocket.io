import cloudinary from "../lib/cloudinary.js";
import { generateJWTtoken } from "../lib/utlis.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req, res) => {
  const { fullname, email, password, profilePic } = req.body;

  try {
    // Check required fields
    if (!fullname || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullname,
      email,
      password: hashedPassword,
      profilePic
    });

    await newUser.save();

    // Generate JWT token
    generateJWTtoken(newUser._id, res);

    res.status(201).json({
      _id: newUser._id,
      fullname: newUser.fullname,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });

  } catch (error) {
    console.error("Error in auth controller:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async(req,res)=>
{
     const {email,password} = req.body
    try {
        const user = await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({message:"Inavlid credentials"});
        }
        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect)
        {
            return res.status(400).json({message:"Invalid ceredentials"});
        }
        generateJWTtoken(user._id,res);

        res.status(200).json({
            _id : user._id,
            fullname:user.fullname,
            email:user.email,
            profilePic:user.profilePic
        })
        } catch (error) {
        console.log("Error in login controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export const logout = (req,res)=>
{
    try {
        res.cookie("jwt","",{maxAge:0})
        res.status(200).json({message:"Logged out sucessfully"});
    } catch (error) {
        console.log("Error in logout contoller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}


export const updateProfile =  async(req,res)=>
{
  try {
    const {profilePic} = req.body;
    const userId = req.user._id;
    if(!profilePic)
    {
      return res.status(400).json({message:'Profile pic is required'});

    }
   const uploadResponse =  await cloudinary.uploader.upload(profilePic);

   const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadResponse.secure_url},{new:true});


   res.status(200).json(updatedUser);

  } catch (error) {
    console.log("Error in update Profile",error);
    res.status(500).json({message:"Internal Server Error"});
  }
}

export const checkAuth = (req,res)=>
{
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in CheckAuth controller",error.message);
    res.status(500).json({message:"Internal Server Error"});
  }
}