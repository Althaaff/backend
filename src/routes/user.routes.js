import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
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

// if we want to users login route :
// router.route("/login").post(loginUser);

export default router;
