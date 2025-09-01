import cloudinary from "../lib/cloudinary";
import Message from "../models/message.model";
import User from "../models/user.model";

export const getUsersForSidebar = async(req,res)=>
{
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({_id:{$ne:loggedInUserId}}).select("-password");

        res.status(200).json(filteredUsers);

    } catch (error) {
        console.log("Error in getting user for the SideBar",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}


export const getMessages = async(req,res)=>
{
    try {
        const {id:userToChatId} = req.parmas
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[{
                senderId:myId,receiverId:userToChatId },
            {senderId:userToChatId,receiverId:myId}]
        })
        res.status(200).json(messages)
    } catch (error) {
        console.log("Error in getMessages controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
}

export const sendMessage = async(req,res)=>
{
    try {
        const{text,image} = req.body;
        const {id:receiverId} = req.parmas;
        const senderId = req.user._id;

        let imageUrl;
        if(image)
        {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMesage = new Message({
            senderId,
            receiverId,
            text,
            image:imageUrl
        });

        await newMesage.save();

        //todo:real time functionality goes here => socket.io

        res.status(201).json(newMesage);
    } catch (error) {
        console.log("Error in sendMessage controller :",error.message);
        res.status(500).json("Internal Server Error");
    }
}