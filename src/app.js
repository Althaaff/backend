import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// The express.json() middleware is added to the middleware stack using app.use(). This means it will be applied
// to all incoming requests before they reach route handlers.
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import :
import userRouter from "./routes/user.routes.js";

// routes declaration:
app.use("/api/v1/users", userRouter);

export { app };
