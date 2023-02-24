const express = require("express");
const { ctrlWrapper } = require("../../helpers");
const {authenticate} = require("../../middlewares")

const ctrl = require("../../controllers/balancesController")

const router = express.Router();

// Update balance
router.post("/update", authenticate, ctrlWrapper(ctrl.addNewBalance))
// Get balance
router.get("/", authenticate, ctrlWrapper(ctrl.getBalance))

module.exports = router;