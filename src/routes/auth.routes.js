import express from "express";
import {
    loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    deleteProfile
} from "../controllers/auth.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", verifyJWT, logoutUser);
router.post("/refresh-token",verifyJWT ,refreshAccessToken);
router.delete("/delete-profile", verifyJWT, deleteProfile);

export default router;