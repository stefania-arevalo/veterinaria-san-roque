const express = require("express");
const PermissionController = require("../controllers/userPermission");
const md_auth = require("../middlewares/authenticated");
const validate = require("../middlewares/validate");
const { validatePermission } = require("../validators/userPermission"); 

const api = express.Router();

// GET: Obtener permisos de un usuario específico - Solo Admin
api.get("/user-permission/:idUsuario", [md_auth.asureAuth, md_auth.hasRole([1])], PermissionController.getPermissionsByUser);

// POST: Crear o Actualizar permiso - Solo Admin
api.post("/user-permission", [md_auth.asureAuth, md_auth.hasRole([1]), validatePermission, validate], PermissionController.setPermission);

module.exports = api;