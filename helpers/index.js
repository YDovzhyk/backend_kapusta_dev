const RequestError = require("./RequestError");
const ctrlWrapper = require("./ctrlWrapper");
const handleSaveErrors = require("./handleSaveErrors");
const monthlyData = require("./monhlyData");
const convertDate = require("./convertDate");
const reportData = require("./reportData");
const readParameters = require("./readParameters");
const { updateNewAvatar, deleteNewAvatar } = require("./updateNewAvatar")

module.exports = {
    RequestError,
    ctrlWrapper,
    handleSaveErrors,
    monthlyData,
    convertDate,
    reportData,
    readParameters,
    updateNewAvatar,
    deleteNewAvatar,
}