import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log("request body: ", req.body);
  console.log("email: ", email);

  // if (fullName === "") {
  //   throw new ApiError(400, "full name is required!");
  // } /* u can use this above code also */

  if (
    [fullName, username, password, email].some((field) => field?.trim() === "") // here some means any one statement is true then it will move forward //
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  console.log("existed user is :", existedUser);

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists!");
  }

  const avatarLoacalPath = req.files?.avatar[0]?.path;
  console.log("avatar,s local path is", avatarLoacalPath);

  if (!avatarLoacalPath) {
    throw new ApiError(400, "Avatar file is required!");
  }

  // const coverImageLocalPath = req.files?.coverimage[0]?.path;
  // this code coverImage handeling is commented bcoz
  // if user don't need upload cover image then above line of code will provide error //

  // Here This code is handled if user not uploaded cover image (above bug fixed) :
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
    console.log("coverimage's localPath is : ", coverImageLocalPath);
  }
  console.log("files :", req.files);

  const avatar = await uploadOnCloudinary(avatarLoacalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required!!");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  console.log("user:", user); // here password will come.

  const createdUser = await User.findById(user._id).select(
    // if user is created then hide that user password and refresh token //
    "-password -refreshToken" // here password is not will come bcz of this line of code
    // password is sensitive //
  );
  console.log("user is created Here :", createdUser);

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user!");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Sucessfully!"));
});

export { registerUser };
