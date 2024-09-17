import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend :
  // validation not-empty :
  // check if user is already exists:
  // check for images, check for avatar :
  // upload them to cloudinary, check the avatar:
  // create user object - create entry in DB :
  // remove password and refresh token field from response :
  // check for user creation:
  // return response:

  const { fullName, email, username, password } = req.body;
  console.log("email: ", email);

  // if (fullName === "") {
  //   throw new ApiError(400, "full name is required!");
  // } /* u can use this above code also */

  if (
    [fullName, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existed user is :", existedUser);
});

const avatarLoacalPath = req.files?.avatar[0]?.path;
console.log("avatar,s local path is", avatarLoacalPath);

const coverImageLocalPath = req.files?.coverImage[0]?.path;

if (!avatarLoacalPath) {
  throw new ApiError(400, "Avatar file is required!");
}

const avatar = await uploadOnCloudinary(avatarLoacalPath);
const coverImage = uploadOnCloudinary(coverImageLocalPath);

if (!avatar) {
  throw new ApiError(400, "Avatar file is required!!");
}

export { registerUser };
