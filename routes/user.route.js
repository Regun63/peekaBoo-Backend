import express from "express";
import isAuthenticate from "../middleware/isAuthenticate.js";
import upload from "../middleware/multer.js";
import {
  register,
  login,
  logout,
  getProfile,
  editProfile,
  getSuggestedUsers,
  followOrUnfollowLogic,
  
} from "../controllers/user.controller.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);

router.route("/logout").get(logout);
router.route("/profile/:id").get(isAuthenticate, getProfile);
router.route("/profile/edit").post(isAuthenticate, upload.single("profilePhoto"), editProfile);
router.route("/suggestedusers").get(isAuthenticate, getSuggestedUsers);
router.route("/follow_or_unfollow/:id").post(isAuthenticate, followOrUnfollowLogic);

export default router;