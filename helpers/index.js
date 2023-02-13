const RequestError = require("./RequestError");
const ctrlWrapper = require("./ctrlWrapper");
const handleSaveErrors = require("./handleSaveErrors");
const monthlyData = require("./monhlyData");
const convertDate = require("./convertDate");
const reportData = require("./reportData");
const checkData = require("./checkData");
const readParameters = require("./readParameters");
const { updateNewAvatar, deleteNewAvatar } = require("./updateNewAvatar")

module.exports = {
    RequestError,
    ctrlWrapper,
    handleSaveErrors,
    monthlyData,
    convertDate,
    reportData,
    checkData,
    readParameters,
    updateNewAvatar,
    deleteNewAvatar,
}