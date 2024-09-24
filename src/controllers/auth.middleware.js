// this is the middleware this middleware just verify user is there or not //
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export const verifyJWT = asyncHandler(async (req, _, next) => {
  // here in this code res (response) is not used that time we can just write underscrore (_) instead of res //
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    // console.log("ACCESS_TOKEN IS :", token);
    if (!token) {
      throw new ApiError(401, "Unauthorized request!");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    console.log(decodedToken); //console it

    if (!user) {
      // NEXT_VIDEO: discuss about frontend:
      throw new ApiError(401, "Invalid Access Token!");
    }
    req.user = user;
    next(); // here next() means that verifyJWT work done at router @ user.routes.js file then its going to the logoutUser //
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Access Token!");
  }
});
