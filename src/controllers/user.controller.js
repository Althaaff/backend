import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// registering the user:
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

const generateAccessAndRefereshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken; // user.refereshToken means database document refresh token's to this refresh token assignes //
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong While generating access token!"
    );
  }
};

// Login the user:
const loginUser = asyncHandler(async (req, res) => {
  console.log("Request Body: ", req.body);
  // 1. take the data from requset Body*
  // 2. usernameor or email
  // 3. find the user ( if user is there or not checking if user is there then login process othervise just error message )
  // 4. password checking
  // ( password process is done then below acess & refresh tokens )
  // 6. access token and refresh token
  // 7. send cookie

  // This code if username is present but email is not it will throw the error //
  const { email, username, password } = req.body;
  console.log("password :", password);

  // if (!username || !email) {
  //   throw new ApiError(400, "username or email is required!");
  // }
  // Here is an alternative of above code based on logic discussion:
  // In this alternative code, we are using the NOT (!) operator to negate the result of the OR (||) operator.
  // This means that the condition will be true only if both username and email are falsy.
  // if (!(username || email)) {
  // username is there but email is not it will not throw error both not there then only ERROR(below)
  //   throw new ApiError(400, "username or email is required!!");
  // }

  // this code is same as above second code ex: username is present email is not it will not throw the error
  if (!username && !email) {
    throw new ApiError(400, "username or email is required!");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  // console.log('')
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials!");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefereshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  console.log("loggedInUser:", loggedInUser);

  // accessToken is the JWT generated by the server.
  // `options` may include settings like httpOnly,
  //-secure, maxAge, etc., which control the behavior and security of the cookie.

  const options = {
    httpOnly: true, // these options bcoz that cookies sever only can modify. but client or frontend can't //
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    await req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    // why here in this code getting false @ POSTMAN //
    httpOnly: true, // these options bcoz that cookies sever only can modify. but client or frontend can't //
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options) // here options bcoz in same security user should logged out //
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out!"));
});

// endpoint for `refresh` access token :
const refreshAccessToken = asyncHandler(async (req, res) => {
  // refrsh accessing from cookies (cookies enpoint):
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unathorized request!");
  }

  // now verifying the jwt : user getting the token is token encrypter ex: ehjjfefebdedede (for security)
  // and @ database storing token is decoded token like username: althaf etc..
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // already we defined the id of the user @ usermodel.js and generating the refreshToken method
    // that id will help to get the user info for refresh token:

    // here we will get the decoded user info :
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token!");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefereshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw ApiError(401, error?.message || "Invalid refresh token!");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
