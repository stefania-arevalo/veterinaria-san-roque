const express = require("express");
const BrandController = require("../controllers/brand");
const md_auth = require("../middlewares/authenticated");
const api = express.Router();

// Rutas administrativas (Rol 1)
api.post("/brand", [md_auth.asureAuth, md_auth.hasRole([1])], BrandController.createBrand);
api.patch("/brand/:id", [md_auth.asureAuth, md_auth.hasRole([1])], BrandController.updateBrand);
api.delete("/brand/:id", [md_auth.asureAuth, md_auth.hasRole([1])], BrandController.deleteBrand);

// Rutas de consulta (Todos los roles del 1 al 5)
api.get("/brands", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], BrandController.getBrands);
api.get("/brand/:id", [md_auth.asureAuth, md_auth.hasRole([1, 2, 3, 4, 5])], BrandController.getBrand);

module.exports = api;