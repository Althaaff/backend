import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
} from "../controllers/video.controller.js";
import { verifyJWT } from "../controllers/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router
  .route("/")
  .get(getAllVideos)
  .post(
    verifyJWT,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1, // maxCount: 1: This restricts the number of files that can be uploaded for each specific field.
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    publishAVideo
  );

router
  .route("/v/:videoId")
  .get(verifyJWT, getVideoById)
  .delete(verifyJWT, deleteVideo)
  .patch(
    verifyJWT,
    upload.fields([
      {
        name: "videoFile",
        maxCount: 1, // maxCount: 1: This restricts the number of files that can be uploaded for each specific field.
      },
      {
        name: "thumbnail",
        maxCount: 1,
      },
    ]),
    updateVideo
  );

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;
