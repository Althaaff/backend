import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

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
    // console.log("File is uploaded on Cloudinary! :", response.url);

    // if file is successfully uploaded then also it will remove from the localfilepath //
    // Check if the file exists before unlinking
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    } else {
      console.warn("File does not exist, skipping deletion:", filePath);
    }
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // this line code remove the locally saved
    // temprary file from the cloudinary as the upload operation got failed
    return null;
  }
};

const deleteOnCloudinary = async (public_id, resource_type = "image") => {
  try {
    if (!public_id) return null;

    //delete file from cloudinary
    const result = await cloudinary.uploader.destroy(public_id, {
      resource_type: `${resource_type}`,
    });
  } catch (error) {
    console.log("delete on cloudinary failed", error);
    return error;
  }
};

export { uploadOnCloudinary, deleteOnCloudinary };
