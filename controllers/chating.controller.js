
import {Message} from "../models/message.model.js"
import {Conversation} from "../models/conversation.model.js"
import {io} from "../socket/socket.js"
import {getReceiverSocketId} from "../socket/socket.js"
export const sendMessage=async(req,res)=>{
    try {
        const senderID=req.id;
        const receiverID=req.params.id;
        const{message}=req.body;

        let conversation=await Conversation.findOne({
            participants:{$all:[senderID,receiverID]}
        })

        if(!conversation){
            conversation=await Conversation.create({
                participants:[senderID,receiverID],
            })
        }
        const newMessage=await Message.create({
            senderID,
            receiverID,
            message
        })
        if(newMessage) conversation.messages.push(newMessage._id);
        await Promise.all([conversation.save(),newMessage.save()])


        const receiverSocketId= getReceiverSocketId(receiverID);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage",newMessage);
        }

        return res.status(201).json({
            success:true,
            newMessage
        })
    } catch (error) {
        console.log(error);
    }
}
export const getMessage=async(req,res)=>{
    try {
        const senderID=req.id;
        const receiverID=req.params.id;
       
        const conversation = await Conversation.findOne({
            participants: { $all: [senderID, receiverID] }
        }).populate({
            path: 'messages',
            populate: [
                { path: 'senderID', select: 'username profilePicture' },
                { path: 'receiverID', select: 'username profilePicture' }
            ]
        });
        if(!conversation){
         return res.status(200).json({
            success:true,
            messages:[]
         })
        }
       
        return res.status(200).json({
            success:true,
            messages:conversation?.messages
        })
    } catch (error) {
        console.log(error);
    }
}