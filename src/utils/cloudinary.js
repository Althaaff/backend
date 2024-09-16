import { v2 as cloudinary } from "cloudinary";
import { fs } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null; // here if u want any error message u can pass //
    // upload the file on to the cloudinary:
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // resource type means file type video audio image document etc ..
    });

    //file has been uploaded successfull:
    console.log("File is uploaded on Cloudinary!", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // this line code remove the locally saved
    // temprary file from the cloudinary as the upload operation got failed
    return null;
  }
};

export { uploadOnCloudinary };
