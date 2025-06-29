import verifyJWT from "../middlewares/auth.middleware.js";
import { createExpense, getExpenses, updateExpense, deleteExpense, getTotalExpenses, getSpendByCategory, getExpensesByMonth, getCurrentMonthTotal } from "../controllers/expense.controller.js";
import express from "express";

const router = express.Router();

router.get("/", verifyJWT, getExpenses);
router.post("/create", verifyJWT, createExpense);
router.put("/:expenseId", verifyJWT, updateExpense);
router.delete("/:expenseId", verifyJWT, deleteExpense);
router.get("/total", verifyJWT, getTotalExpenses);
router.get("/category-summary", verifyJWT, getSpendByCategory);
router.get("/by-month", verifyJWT, getExpensesByMonth);                 // GET /expenses/by-month?year=2025&month=6
router.get("/current-month-total", verifyJWT, getCurrentMonthTotal);

export default router;