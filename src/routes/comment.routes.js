import { Router } from "express";
import {
  addComment,
  getVideoComments,
} from "../controllers/comment.controller";

const router = Router();

router.use(verifyJWT, upload.none()); // Apply verifyJWT middleware to all routes in this file

// The route handles both fetching (GET) and adding (POST) comments for a specific video by its videoId
router.route("/:videoId").get(getVideoComments).post(addComment);

export default router;
