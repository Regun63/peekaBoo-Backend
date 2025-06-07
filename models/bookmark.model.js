import mongoose from "mongoose";

const bookmarkSchema = new mongoose.Schema({
    caption: { type: String, default: "No caption" },
    image: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
   
}, { timestamps: true });

export const Bookmark = mongoose.model("Bookmark", bookmarkSchema);
