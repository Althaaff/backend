import { Router } from "express";
import {
  getChannelStats,
  getChannelVideos,
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/stats").get(getChannelStats); // total likes of the channel and total video uploaded by the channel etc..
router.route("/videos").get(getChannelVideos); // getting the likes & views etc.. count of specific channel video

export default router;
