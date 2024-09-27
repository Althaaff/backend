import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../controllers/auth.middleware.js";

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]), // register user just before using the upload fields bcoz that is middleware //
  registerUser
);
router.route("/login").post(loginUser);

// secured routes:
router.route("/logout").post(verifyJWT, logoutUser); // verifyJWT --> is middleware

router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword); // here verifyJWT middleware bcoz only loggedin user can do change password //
router.route("/current-user").post(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails); // here patch bcoz it is intended for making partial updates to an existing resource, such as updating specific account details without modifying the entire account.
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/cover-image")
  .patch(verifyJWT, upload.single("/coverImage"), updateUserCoverImage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile); // here colon is important `c` --> instead any name u can give
router.route("/history").get(verifyJWT, getWatchHistory);

// if we want to users login route :
// router.route("/login").post(loginUser);

export default router;
