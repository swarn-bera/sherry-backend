import express from "express";
import errorHandler from "./middlewares/globalErrorHandler.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000", 
    credentials: true, // this is required to allow cookies (tells to accept cookies from the client)
}));

app.use(express.json());
app.use(cookieParser());

// Routes for Auth
app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

export default app;