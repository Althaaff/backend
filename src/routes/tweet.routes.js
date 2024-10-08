import { Router } from "express";
import { verifyJWT } from "../controllers/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  createTweet,
  deleteTweet,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller";

const router = Router();

router.use(verifyJWT, upload.none()); // Apply verifyJWT middleware to all routes in this file

router.route("/").post(createTweet);

router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default router;
