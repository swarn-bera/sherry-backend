import jwt from "jsonwebtoken";
import apiError from "../utils/apiError.util.js";
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../utils/asyncHandler.util.js";

const prisma = new PrismaClient();

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if(!token){
            throw new apiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        if(decodedToken){
            throw new apiError(401, "Invalid or expired access token");
        }

        const user = await prisma.user.findUnique({
            where: { id: decodedToken.userId }, 
        });
        if(!user){
            throw new apiError(401, "User not found for access token");
        }

        req.user = { id: user.id };
        next();
    }
    catch (error) {
        throw new apiError(500, error?.message || "Invalid access token");
    }
});

export default verifyJWT;