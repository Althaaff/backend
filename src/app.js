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
app.use(express.urlencoded({ extended: true, limit: "16kb" })); // extract the data from the request body make it available to the req.body Object //

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use(express.static("public"));
app.use(cookieParser());

// user routes import :
import userRouter from "./routes/user.routes.js";

// video routes import :
import videoRouter from "./routes/video.routes.js";

// routes declaration:
app.use("/api/v1/users", userRouter);

app.use("/api/v1/videos", videoRouter);

export { app };
