import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';

const router = Router();
router.route("/register").post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    }
  ]),  // register user just before using the upload fields //
  registerUser
);

// if we want to users login route :
// router.route("/login").post(loginUser);


export default router;
