const { Transition } = require("../models/transition");
const { Balance } = require("../models/balance");
const {
  RequestError,
  monthlyData,
  convertDate,
  reportData,
  readParameters
} = require("../helpers");
const { schemas } = require("../models/transition");

const addNewTransition = async (req, res) => {
  const { error } = schemas.addTransitionSchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }
  const { _id: owner } = req.user;

  const result = await Transition.create({
    ...req.body,
    owner,
    reportDate: convertDate(req.body.transitionDate),
  });

  const getBalance = await Balance.findOne({ owner });
  if (req.body.transitionName === "income") {
    await Balance.findOneAndUpdate(
      { owner },
      { balance: getBalance.balance + req.body.transitionValue },
      { new: true }
    );
  } else {
    await Balance.findOneAndUpdate(
      { owner },
      { balance: getBalance.balance - req.body.transitionValue },
      { new: true }
    );
  }
  res.status(201).json(result);
};

const deleteTransition = async (req, res) => {
  const { transitionId } = req.params;
  const { _id: owner } = req.user;
  const result = await Transition.findOneAndRemove({
    _id: transitionId,
    owner,
  });

  if (!result) {
    throw RequestError(404);
  }

  const getBalance = await Balance.findOne({ owner });
  if (result.transitionName === "income") {
    await Balance.findOneAndUpdate(
      { owner },
      { balance: getBalance.balance - result.transitionValue },
      { new: true }
    );
  } else {
    await Balance.findOneAndUpdate(
      { owner },
      { balance: getBalance.balance + result.transitionValue },
      { new: true }
    );
  }

  res.status(200).json({ message: "Transition deleted" });
};

const getIncomeByDate = async (req, res) => {
  const { error } = schemas.reqDateSchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }
  const { _id: owner } = req.user;
  const result = await Transition.find(
    { transitionName: "income", transitionDate: req.body.reqDate, owner },
    "-createdAt -updatedAt"
  );
  const balance = await Balance.findOne({owner});

  const monthlyTransition = await Transition.find({owner, transitionName: "income"});
  const monthlySum = monthlyData(monthlyTransition).monthlySum;

  if (!result || !balance || !monthlyTransition) {
    throw RequestError(404, "Not found");
  }
  res.json({transitionByDate: result, balance: balance.balance, monthlySum});
};

const getExpensesByDate = async (req, res) => {
  const { error } = schemas.reqDateSchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }

  const { _id: owner } = req.user;
  const result = await Transition.find(
    { transitionName: "expenses", transitionDate: req.body.reqDate, owner },
    "-createdAt -updatedAt"
  );
  const balance = await Balance.findOne({owner});

  const monthlyTransition = await Transition.find({owner, transitionName: "expenses"});
  const monthlySum = monthlyData(monthlyTransition).monthlySum;

  if (!result || !balance || !monthlyTransition) {
    throw RequestError(404, "Not found");
  }
  res.json({transitionByDate: result, balance: balance.balance, monthlySum});
};

const getDataByName = async (req, res) => {
  const { error } = schemas.reqDateSchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }
  const { _id: owner } = req.user;
  const result = await Transition.find(
    { reportDate: `${convertDate(req.body.reqDate)}`, owner },
    "-createdAt -updatedAt"
  );
  if (!result) {
    throw RequestError(404, "Not found");
  }

  const reqDateResult = reportData(result);
  res.json(reqDateResult.sumByName);
};

const getDataByCategory = async (req, res) => {
  const { error } = schemas.reqDateSchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }
  const { _id: owner } = req.user;
  const resultIncome = await Transition.find(
    {
      reportDate: `${convertDate(req.body.reqDate)}`,
      owner,
      transitionName: "income",
    },
    "-createdAt -updatedAt"
  );

  const resultExpenses = await Transition.find(
    {
      reportDate: `${convertDate(req.body.reqDate)}`,
      owner,
      transitionName: "expenses",
    },
    "-createdAt -updatedAt"
  );

  if (!resultIncome || !resultExpenses) {
    throw RequestError(404, "Not found");
  }

  const reqDataIncome = reportData(resultIncome);
  const reqDataExpenses = reportData(resultExpenses);
  res.json([{income: reqDataIncome.sumByCategory}, {expenses: reqDataExpenses.sumByCategory}]);
};

const getDataByCategoryDetail = async (req, res) => {
  const { error } = schemas.reqDateAndCategorySchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }
  const { _id: owner } = req.user;

  const result = await Transition.find(
    {
      reportDate: `${convertDate(req.body.reqDate)}`,
      owner,
      transitionCategory: req.body.transitionCategory,
    },
    "-createdAt -updatedAt"
  );
  if (!result) {
    throw RequestError(404, "Not found");
  }

  const reqDateResult = reportData(result);
  res.json(reqDateResult.sumByDescription);
};

const getTimeLineData = async (req, res) => {
  const { error } = schemas.reqDateSchema.validate(req.body);
  if (error) {
    throw RequestError(400, error.message);
  }
  const { _id: owner } = req.user;
  const userTransitions = await Transition.find(
    { reportDate: `${convertDate(req.body.reqDate)}`, owner },
    "-createdAt -updatedAt"
  );
  const userBalance = await Balance.find({ owner });

  const userAllTransitions = await Transition.find(
    { owner },
    "-createdAt -updatedAt"
  );
  const data = monthlyData(userAllTransitions);

  if (!userTransitions || !userBalance || !data) {
    throw RequestError(404, "Not found");
  }

  const result = {
    balance: userBalance[0].balance,
    monthlySum: data.monthlySum,
    transitions: userTransitions,
  };
  res.json(result);
};

module.exports = {
  addNewTransition,
  deleteTransition,
  getIncomeByDate,
  getExpensesByDate,
  getDataByName,
  getDataByCategory,
  getDataByCategoryDetail,
  getTimeLineData,
};
