import asyncHandler from "../utils/asyncHandler.util.js";
import apiError from "../utils/apiError.util.js";
import apiResponse from "../utils/apiResponse.util.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createExpense = asyncHandler(async (req, res, next) => {
    const { amount, description, paidAs, category } = req.body;

    if(!amount || !category) {
        throw new apiError(400, "Amount and category are required");
    }

    const expense = await prisma.expense.create({
        data: { 
            reason: description || undefined,
            amount: parseFloat(amount),
            category,
            paidAs: paidAs || undefined,    
            userId: req.user.id,
            status: "PENDING"
        }
    })

    res.status(201).json(new apiResponse(201, expense, "Expense created successfully"));
})


// get all expenses by user
export const getExpenses = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const expenses = await prisma.expense.findMany({
        where: { userId },
        orderBy: { date: "desc" }   // latest expenses first
    });

    res.status(200).json(new apiResponse(200, expenses, "Expenses fetched successfully"));
});


// update expense
export const updateExpense = asyncHandler(async (req, res, next) => {
    const { expenseId } = req.params;
    const { amount, description, paidAs, category } = req.body;

    const existingExpense = await prisma.expense.findUnique({
        where: { id: expenseId },
    })

    if(!existingExpense || existing.userId !== req.user.id) {
        throw new apiError(404, "Expense not found or unauthorized");
    }

    // Build only the fields that are defined
    const dataToUpdate = {};
    if (amount !== undefined) dataToUpdate.amount = parseFloat(amount);
    if (description !== undefined) dataToUpdate.reason = description;
    if (category !== undefined) dataToUpdate.category = category;
    if (paidAs !== undefined) dataToUpdate.paidAs = paidAs;

    const updated = await prisma.expense.update({
        where: { id: expenseId },
        data: dataToUpdate, // it will patch the data
    });

    res.status(200).json(new apiResponse(200, updated, "Expense updated successfully"));
});


// delete expense
export const deleteExpense = asyncHandler(async (req, res, next) => {
    const { expenseId } = req.params;
    if(!expenseId) {
        throw new apiError(400, "Expense ID is required");
    }

    const existingExpense = await prisma.expense.findUnique({
        where: { id: expenseId },
    })

    if (!existingExpense || existingExpense.userId !== req.user.id) {
    throw new apiError(404, "Expense not found or unauthorized");
  }

    await prisma.expense.delete({
        where: { id: expenseId },
    })

    res.status(200).json(new apiResponse(200, {}, "Expense deleted successfully"));
});


// total expenses spent
export const getTotalExpenses = asyncHandler(async (req, res, next) => {
    const userId = req.user.id;
    const total = await prisma.expense.aggregate({  // get sum of all expenses
        where: { userId },
        _sum: { amount: true },
      });
      
      res.status(200).json(new apiResponse(200, total, "Total expenses fetched successfully"));
});


// spend per category
export const getSpendByCategory = asyncHandler(async (req, res) => {
  const categories = await prisma.expense.groupBy({
    by: ['category'],                                   // { category: "Food", _sum: { amount: 250 } },
    where: { userId: req.user.id },                     // { category: "Travel", _sum: { amount: 500 } },
    _sum: { amount: true },                             // { category: "Bills", _sum: { amount: 50 } }
  });

  const formatted = categories.map(item => ({
    category: item.category,
    total: item._sum.amount,       // { category: "Food", _sum: { amount: 250 } } into { category: "Food", total: 250 }
  }));

  res.status(200).json(new apiResponse(200, formatted, "Spend per category fetched"));
});


// filter by Date range
export const getExpensesByMonth = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { year, month } = req.query;

    const numericYear = parseInt(year);
    const numericMonth = parseInt(month);
    if (!numericYear || !numericMonth || numericMonth < 1 || numericMonth > 12) {
        throw new apiError(400, "Please provide valid year and month");
    }

    const startDate = new Date(numericYear, numericMonth - 1, 1); // First day of month
    const endDate = new Date(numericYear, numericMonth, 0, 23, 59, 59); // Last day of month


    const expenses = await prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate, 
            lte: endDate
          },
        },
        orderBy: { date: "desc" }
      });
      
      res.status(200).json(new apiResponse(200, expenses, `Expenses for ${month}/${year} fetched successfully`));
})


// total expense user spent this month
export const getCurrentMonthTotal = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const total = await prisma.expense.aggregate({
    _sum: { amount: true },
    where: {
      userId: req.user.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  });

  res.status(200).json(
    new apiResponse(200, { 
      totalSpent: total._sum.amount || 0,
      month: now.toLocaleString('default', { month: 'long' }),
      year: now.getFullYear()
    }, "Live total for this month")
  );
});