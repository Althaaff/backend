import { Router } from "express";
import { verifyJWT } from "../controllers/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from "../controllers/playlists.controller";

const router = Router();

router.use(verifyJWT, upload.none()); // it will apply for all route handlers //

router.route("/").post(createPlaylist);

router
  .router("/:playlistId") // playlistId means playlist that playlist inside have videos
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist);

router.route("/user/:userId").get(getUserPlaylists);

export default router;
