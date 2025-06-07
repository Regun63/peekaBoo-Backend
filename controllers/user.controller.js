import {User} from '../models/user.model.js'
import {Post} from '../models/post.model.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import getDataUri from "../utils/datauri.js"
import cloudinary from "../utils/cloudinary.js"

export const register =async(req,res)=>{
    try{
    const {username,email,password}=req.body;
    if(!username || !email || !password){
        return res.status(409).json({
            message:"something is missing, please fill up correctly!",
            success:false,
        });
    }
    const user=await User.findOne({email});
    if(user){
        return res.status(409).json({
            message:"This email ID already exists, please enter a different email ID.",
            success:false,
        });
    };
    const hashedPass=await bcrypt.hash(password,10);
    await User.create({
        username,
        email,
        password:hashedPass,
    });
    return res.status(201).json({
        message:"Account created Successfully!",
        success:true,
    });
}catch(error){
    console.log(error);
}
}

export const login=async(req,res)=>{
    try {
        const {email,password}=req.body;
    if( !email || !password){
        return res.status(401).json({
            message:"something is missing, please fill up correctly!",
            success:false,
        });
    }
    let user=await User.findOne({email});
    if(!user){
        return res.status(401).json({
            message:"Incorrect email or password.",
            success:false,
        });
    };

    let isPasswordMtached=await bcrypt.compare(password,user.password);
    if(!isPasswordMtached){
        return res.status(401).json({
            message:"Incorrect email or password.",
            success:false,
        });
    }
       
    

    const token= jwt.sign({userId:user._id},process.env.SECRET_KEY,{expiresIn:'3d'});
    const populatePosts = (
        await Promise.all(
          user.posts.map(async (postId) => {
            const post = await Post.findById(postId);
            return post && post.author?.equals(user._id) ? post : null;
          })
        )
      ).filter(post => post !== null);


      const populatedBookmarks = (
        await Promise.all(
          (user.bookmarks ?? []).map(async (postId) => {
            const post = await Post.findById(postId);
            return post;
          })
        )
      ).filter(post => post !== null);
      
      user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        gender: user.gender,
        followers: user.followers,
        following: user.following,
        posts: populatePosts,
        bookmarks: populatedBookmarks,
      };

    
    return res.cookie('token',token,{httpOnly:true, sameSite: 'None',secure: true  ,maxAge:3*24*60*60*1000}).json({
        message:`Welcome Back ${user.username}`,
        success:true,
        user
    });

    } catch (error) {
        console.log(error); 
    }
};


export const logout=async(_,res)=>{
    try {
        return res.cookie("token","",{maxAge:0}).json({
            message:"Logged out successfully.",
            success:true,
        })
    } catch (error) {
       console.log(error); 
    }
};


export const getProfile=async(req,res)=>{
    try {
        const userId=req.params.id;
        let user=await User.findById(userId).populate({path:'posts',createdAt:-1}).populate('bookmarks');
        return res.status(200).json({
            user,
            success:true,
        });
    } catch (error) {
        console.log(error); 
    }
};
export const editProfile = async (req, res) => {
    try {
      const userID = req.id;
      const { bio, gender, username } = req.body;
      const profilePicture = req.file;
      let cloudResponse;
  
      if (profilePicture) {
        const fileUri = getDataUri(profilePicture);
        cloudResponse = await cloudinary.uploader.upload(fileUri);
      }
  
      const user = await User.findById(userID).select("-password");
      if (!user) {
        return res.status(404).json({
          message: "User not found.",
          success: false,
        });
      }
  
      if (bio) user.bio = bio;
      if (gender) user.gender = gender;
      if (username) user.username = username;
      if (profilePicture) user.profilePicture = cloudResponse.secure_url;
  
      await user.save();
  
      return res.status(200).json({
        message: "Profile is updated successfully.",
        success: true,
        user,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        message: "Internal server error.",
        success: false,
      });
    }
  };
export const getSuggestedUsers=async(req,res)=>{
    try {
        const suggestedUsers=await User.find({_id:{$ne:req.id}}).select("-password");

        if(!suggestedUsers){
            return res.status(400).json({
                message:"Currently do not have any user.",

            })
        }

        return res.status(200).json({
            success:true,
            users:suggestedUsers,
        })
    } catch (error) {
        console.log(error);
    }
}

export const followOrUnfollowLogic=async(req,res)=>{
    try {
       const userId=req.id;
       const otherPersonId=req.params.id;

       if(userId===otherPersonId){
        return res.status(400).json({
            message:"You cannot follow/unfollow yourself",
            success:false,
        })
       }

       const user=await User.findById(userId);
       const otherPerson=await User.findById(otherPersonId);

       if(!user || !otherPerson){
        return res.status(400).json({
            message:"User is not available.",
            success:false,
        })
       }
       const isFollowing=user.following.includes(otherPersonId);
       if(isFollowing){
        //unfollow logic
        await Promise.all([
            User.updateOne({_id:userId},{$pull:{following:otherPersonId}}),
            User.updateOne({_id:otherPersonId},{$pull:{followers:userId}}),
        ])
        return res.status(200).json({
            message:"Unfollowed succesfully.",
            success:true,
            following: false,
        })
       }else{
        //follow logic
        await Promise.all([
            User.updateOne({_id:userId},{$push:{following:otherPersonId}}),
            User.updateOne({_id:otherPersonId},{$push:{followers:userId}}),
        ])
        return res.status(200).json({
            message:"Followed succesfully.",
            success:true,
            following: true,
        })
       }
    } catch (error) {
        console.log(error);
    }
}