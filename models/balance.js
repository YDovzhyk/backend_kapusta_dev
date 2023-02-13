const Joi = require("joi");
const { Schema, model } = require("mongoose");

const { handleSaveErrors } = require("../helpers");

const balanceSchema = new Schema(
  {
    balance: {
      type: Number,
      default: 0.0,
      required: [true, "Set balance sum"],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

balanceSchema.post("save", handleSaveErrors);

const addBalanceSchema = Joi.object({
  newBalance: Joi.number().required(),
});

const schemas = {
  addBalanceSchema,
};

const Balance = model("balance", balanceSchema);

module.exports = {
  Balance,
  schemas,
};
