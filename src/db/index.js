import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
  } catch (error) {
    console.log("MONGOOSE connection FAILED", error);
    process.exit(1) // exit 0 means code success and exit(1) or non-zero code indicating the error //
  }
}

export default connectDB;