import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import asyncHandler from "../utils/asyncHandler.util.js";
import apiError from "../utils/apiError.util.js";
import apiResponse from "../utils/apiResponse.util.js";
import dotenv from "dotenv";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.util.js";

dotenv.config();
const prisma = new PrismaClient();

// Common cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // only true in production
  sameSite: "Lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// Registering a user
export const registerUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password) {
        throw new apiError(400, "Please provide email and password");
    }

    const existingUser = await prisma.user.findUnique({where: { email } });
    if(existingUser) {
        throw new apiError(409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({data: { email, password: hashedPassword }})

    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    await prisma.user.update({
        where: { id: newUser.id },
        data: { refreshToken },
    })

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);


    return res.status(201).json(new apiResponse(201, { accessToken, refreshToken }, "User registered successfully"));
});


// Login a user
export const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password) {
        throw new apiError(400, "Please provide email and password");
    }

    const user = await prisma.user.findUnique({where: { email } });
    if(!user) {
        throw new apiError(404, "User not found");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid) {
        throw new apiError(401, "Invalid credentials");
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken },
    })

    // Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, cookieOptions);

    res.status(200).json(new apiResponse(200, { accessToken, refreshToken }, "User logged in successfully"));
});


// Logout a user
export const logoutUser = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Logged out (no token found)"));
  }

  const user = await prisma.user.findUnique({
    where: { refreshToken },
  });

  if(user){
    await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: null },
    });
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
  })

  return res.status(200).json(new apiResponse(200, {}, "Logged out successfully"));
});


// refresing an access token 
export const refreshAccessToken = asyncHandler(async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken;
    if(!refreshToken) {
        throw new apiError(401, "Refresh token missing. Please login again.");
    }

    // Verify refresh token
    let decoded;
    try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
        throw new ApiError(401, "Invalid or expired refresh token.");
    }

    const user = await prisma.user.findUnique({where: { refreshToken } });
    if(!user || user.refreshToken !== refreshToken) {
        throw new apiError(401, "Invalid refresh token. Re-login required.");
    }

    // issue new access token
    const newAccessToken = generateAccessToken(user.id);
    res.status(200).json(new apiResponse(200, { accessToken: newAccessToken }, "Access token refreshed successfully"));
});

// delete a user profile
export const deleteProfile = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    if(!userId) {
        throw new apiError(401, "Unauthorized request");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new apiError(404, "User not found");
    
    await prisma.user.update({
        where: { id: userId },
        data: { refreshToken: null },
    });

    await prisma.expense.deleteMany({
        where: { userId: userId },
    })


    await prisma.user.delete({
        where: { id: userId}
    })

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Lax",
    });

    return res.status(200).json(new apiResponse(200, {}, "Profile deleted successfully"));
});


// get user by id
export const getUserById = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    if(!userId) {
        throw new apiError(401, "Unauthorized request");
    }

    const user = await prisma.user.findUnique({ 
        where: {id: userId},
        include: {                  // include returns all the scalar fields of the related model (like everything including the expenses)
            expenses: true,
        }
    })

    if(!user){
        throw new apiError(404, "User not found");
    }

    res.status(200).json(new apiResponse(200, user, "User found successfully"));
})