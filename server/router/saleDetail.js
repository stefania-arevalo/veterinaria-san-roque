const express = require("express");
const DetailController = require("../controllers/saleDetail");
const md_auth = require("../middlewares/authenticated");
const { validateCreateSaleDetail, validateUpdateSaleDetail, validateId } = require("../validators/saleDetail");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/sale-detail",       [md_auth.asureAuth, md_auth.hasRole([1,4]),   validateCreateSaleDetail,  validate], DetailController.createSaleDetail);
api.get("/sale-details",       [md_auth.asureAuth, md_auth.hasRole([1,3,4])],                                      DetailController.getAllDetails);
api.get("/sale-detail/:id",    [md_auth.asureAuth, md_auth.hasRole([1,3,4]), validateId,                 validate], DetailController.getDetail);
api.patch("/sale-detail/:id",  [md_auth.asureAuth, md_auth.hasRole([1,3,4]), validateUpdateSaleDetail,   validate], DetailController.updateSaleDetail);
api.delete("/sale-detail/:id", [md_auth.asureAuth, md_auth.hasRole([1]),      validateId,                 validate], DetailController.deleteSaleDetail);

module.exports = api;