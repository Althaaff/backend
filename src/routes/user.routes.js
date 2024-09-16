import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

// if we want to users login route :
// router.route("/login").post(loginUser);

export default router;
