const express = require("express");
const VisitorController = require("../controllers/visitor");
const md_auth = require("../middlewares/authenticated");
const api = express.Router();

// Escritura
api.post("/visitor", [md_auth.asureAuth, md_auth.hasRole([1, 3, 4])], VisitorController.createVisitor);
api.patch("/visitor/:id", [md_auth.asureAuth, md_auth.hasRole([1])], VisitorController.updateVisitor);
api.delete("/visitor/:id", [md_auth.asureAuth, md_auth.hasRole([1])], VisitorController.deleteVisitor);

// Lectura 
api.get("/visitors", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], VisitorController.getVisitors);
api.get("/visitor/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4])], VisitorController.getVisitor);

module.exports = api;
