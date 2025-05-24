import sharp from "sharp";
import cloudinary from "../utils/cloudinary.js";
import { Post } from "../models/post.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";

import { getReceiverSocketId, io } from "../socket/socket.js";

export const addNewPost = async (req, res) => {
  try {
    const { caption } = req.body;
    const image = req.file;
    const authorId = req.id;

    if (!image) return res.status(400).json({ message: "Image is required." });

    //image upload
    const optimizedImageBuffer = await sharp(image.buffer)
      .resize({ width: 800, height: 800, fit: "inside" })
      .toFormat("jpeg", { quality: 80 })
      .toBuffer();

    const fileUri = `data:image/jpeg;base64,${optimizedImageBuffer.toString(
      "base64"
    )}`;
    const cloudResponse = await cloudinary.uploader.upload(fileUri);
    const post = await Post.create({
      caption,
      image: cloudResponse.secure_url,
      author: authorId,
    });
    const user = await User.findById(authorId);
    if (user) {
      user.posts.push(post._id);
      await user.save();
    }
    await post.populate({ path: "author", select: "-password" });

    return res.status(201).json({
      message: "New Post added successfully.",
      post,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getAllPost = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "username profilePicture followers following",
      })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getUserPost = async (req, res) => {
  try {
    const authorId = req.params.id;
    const posts = await Post.find({ author: authorId })
      .sort({ createdAt: -1 })
      .populate({
        path: "author",
        select: "profilePicture username",
      })
      .populate({
        path: "comments",
        sort: { createdAt: -1 },
        populate: {
          path: "author",
          select: "username profilePicture",
        },
      });
    return res.status(200).json({
      posts,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const likePost = async (req, res) => {
  try {
    const postLikeUserId = req.id;
    const postId = req.params.id;

    // Get post with author populated
    const post = await Post.findById(postId).populate({
      path: "author",
      select: "username _id",
    });

    if (!post) {
      return res
        .status(404)
        .json({ message: "No post available", success: false });
    }

    // Add to likes
    await post.updateOne({ $addToSet: { likes: postLikeUserId } });
    await post.save();

    const user = await User.findById(postLikeUserId).select(
      "username profilePicture"
    );
    const postOwnerId = post.author._id.toString();

    if (postOwnerId !== postLikeUserId) {
      const notification = {
        type: "like",
        userId: postLikeUserId,
        userDetails: user,
        postId: postId,
        message:
          postOwnerId === postLikeUserId
            ? `❤️ You liked your own post`
            : `❤️ ${post.author.username}'s '${post.caption}' post was liked by ${user.username}`,
      };

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit("newNotification", notification);
      }
    }

    return res
      .status(200)
      .json({ message: "You liked this post", success: true });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export const dislikePost = async (req, res) => {
  try {
    const postLikeUserId = req.id;
    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ messase: "No post available", success: false });

    await post.updateOne({ $pull: { likes: postLikeUserId } });
    await post.save();

    const user = await User.findById(postLikeUserId).select(
      "username profilePicture"
    );
    const postOwnerId = post.author.toString();
    if (postOwnerId !== postLikeUserId) {
      const notification = {
        type: "dislike",
        userId: postLikeUserId,
        userDetails: user,
        postId: postId,
        message: `Your post was disliked by ${user.username}`,
      };
      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit("newNotification", notification);
        console.log(
          `Notification emitted to ${postOwnerId} at socket ${postOwnerSocketId}`
        );
      }
    }
    return res
      .status(200)
      .json({ message: "You disliked this post", success: true });
  } catch (error) {
    console.log(error);
  }
};
export const addComment = async (req, res) => {
  try {
    const commentedUserId = req.id;
    const postId = req.params.id;
    const { input } = req.body;

    if (!input) {
      return res
        .status(400)
        .json({ message: "Text is required", success: false });
    }

    // Only query once with populated author
    const post = await Post.findById(postId).populate("author", "username _id");

    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

    // Create comment
    const comment = await Comment.create({
      text: input,
      author: commentedUserId,
      post: postId,
    });

    await comment.populate({
      path: "author",
      select: "username profilePicture",
    });

    post.comments.push(comment._id);
    await post.save();

    const user = await User.findById(commentedUserId).select(
      "username profilePicture"
    );
    const postOwnerId = post.author._id.toString();

    if (postOwnerId !== commentedUserId) {
      const notification = {
        type: "comment",
        userId: commentedUserId,
        userDetails: user,
        postId,
        message:
          postOwnerId === commentedUserId
            ? `💬 You commented on your post, '${post.caption}'.`
            : `💬 ${user.username} commented on ${post.author.username}'s post, '${post.caption}'.`,
      };

      const postOwnerSocketId = getReceiverSocketId(postOwnerId);
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit("newNotification", notification);
        console.log(
          `Notification emitted to ${postOwnerId} at socket ${postOwnerSocketId}`
        );
      }
    }

    return res
      .status(200)
      .json({ message: "Comment Added", comment, success: true });
  } catch (error) {
    console.error("Add Comment Error:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

export const getCommentsOfPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const comments = await Comment.find({ post: postId }).populate(
      "author",
      "username,profilePicture"
    );

    if (!comments)
      return res.status(404).json({ messase: "No Comments", success: false });

    return res.status(200).json({ comments, success: true });
  } catch (error) {
    console.log(error);
  }
};
export const deletePost = async (req, res) => {
  try {
    const authorId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post)
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    //check if the logged-in user is the owner of the post
    if (post.author.toString() !== authorId)
      return res.status(403).json({ message: "Unauthorized User" });
    //delete post
    await Post.findByIdAndDelete(postId);

    //remove the post id from the user's post
    let user = await User.findById(authorId);
    user.posts = user.posts.filter((id) => id.toString() !== postId);
    await user.save();

    //delete associated comments
    await Comment.deleteMany({ post: postId });
    return res
      .status(200)
      .json({ message: "Post deleted successfully", success: true });
  } catch (error) {
    console.log(error);
  }
};
export const bookMarkedPost = async (req, res) => {
  try {
    const authorId = req.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res
        .status(404)
        .json({ message: "Post not found", success: false });
    }

   

    const user = await User.findById(authorId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    if (user.bookmarks.includes(post._id)) {
      // If post is already bookmarked, remove it
      await user.updateOne({ $pull: { bookmarks: post._id } });
      return res.status(200).json({
        type: "unsaved",
        message: "Post removed from bookmarks",
        success: true,
        bookmarked:false
      });
    } else {
      // Otherwise, add it to bookmarks
      await user.updateOne({ $addToSet: { bookmarks: post._id } });
      return res.status(200).json({
        type: "saved",
        message: "Post bookmarked",
        success: true,
        bookmarked:true
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Internal server error", success: false });
  }
};

export const deleteInvalidPosts = async (req, res) => {
  try {
    const result = await Post.deleteMany({
      $or: [
        { username: { $exists: false } },
        { username: "" },
        { name: { $exists: false } },
        { name: "" },
        { id: { $exists: false } },
        { id: null },
      ],
    });

    res
      .status(200)
      .json({ message: `${result.deletedCount} invalid posts deleted.` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete invalid posts." });
  }
};
