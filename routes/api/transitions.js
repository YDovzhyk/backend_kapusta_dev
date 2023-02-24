const express = require("express");
const { ctrlWrapper } = require("../../helpers");
const { isValidId, authenticate } = require("../../middlewares");

const ctrl = require("../../controllers/transitionsController");

const router = express.Router();

// Add new transitions
router.post("/", authenticate, ctrlWrapper(ctrl.addNewTransition));
// Get all data by transitions for period + total balance + userinfo + monthly data
router.post("/timeLine", authenticate, ctrlWrapper(ctrl.getTimeLineData));
// Get data by income + sum income monthly
router.post("/income/data", authenticate, ctrlWrapper(ctrl.getIncomeByDate));
// Get data by expenses + sum income monthly
router.post("/expenses/data", authenticate, ctrlWrapper(ctrl.getExpensesByDate));
// Delete transition by Id
router.delete("/delete/:transitionId", authenticate, isValidId, ctrlWrapper(ctrl.deleteTransition));
// Get data by category income/expenses for period
router.post("/report/category", authenticate, ctrlWrapper(ctrl.getDataByName));
// Get data income/expenses for period by category name
router.post("/report/category/data", authenticate, ctrlWrapper(ctrl.getDataByCategory));
// Get data by category name for period detail
router.post("/report/category/detail", authenticate, ctrlWrapper(ctrl.getDataByCategoryDetail));

module.exports = router;
