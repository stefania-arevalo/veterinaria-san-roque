const express = require("express");
const DetailController = require("../controllers/purchaseDetail");
const md_auth = require("../middlewares/authenticated");
const { validateCreatePurchaseDetail, validateUpdatePurchaseDetail, validateId } = require("../validators/purchaseDetail");
const validate = require("../middlewares/validate");

const api = express.Router();

api.post("/purchase-detail",       [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]),   validateCreatePurchaseDetail,   validate], DetailController.createPurchaseDetail);
api.get("/purchase-details",       [md_auth.asureAuth, md_auth.hasRole([1, 3, 4])],                                             DetailController.getAllDetails);
api.get("/purchase-detail/:id",    [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]),   validateId,                     validate], DetailController.getDetail);
api.patch("/purchase-detail/:id",  [md_auth.asureAuth, md_auth.hasRole([1, 3, 4]),   validateUpdatePurchaseDetail,   validate], DetailController.updatePurchaseDetail);
api.delete("/purchase-detail/:id", [md_auth.asureAuth, md_auth.hasRole([1]),        validateId,                     validate], DetailController.deletePurchaseDetail);

module.exports = api;