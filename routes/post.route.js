import express from "express";
import isAuthenticate from "../middleware/isAuthenticate.js";
import upload from "../middleware/multer.js";
import {
  getUserPost,
  getAllPost,
  addNewPost,
  likePost,
  dislikePost,
  addComment,
  getCommentsOfPost,
  deletePost,
  bookMarkedPost,
  deleteInvalidPosts,
} from "../controllers/post.controller.js";

const router = express.Router();

router.route("/userpost/:id").get(isAuthenticate, getUserPost);

router.route("/all").get(isAuthenticate, getAllPost);
router
  .route("/addpost")
  .post(isAuthenticate, upload.single("image"), addNewPost);
router.route("/:id/like").get(isAuthenticate, likePost);
router.route("/:id/dislike").get(isAuthenticate, dislikePost);
router.route("/:id/comment").post(isAuthenticate, addComment);
router.route("/:id/comment/all").post(isAuthenticate, getCommentsOfPost);
router.route("/delete/:id").delete(isAuthenticate, deletePost);
router.route("/:id/bookmark").get(isAuthenticate, bookMarkedPost);


export default router;
