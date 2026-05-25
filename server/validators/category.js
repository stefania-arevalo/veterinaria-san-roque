const { body, param } = require("express-validator");
const Category = require("../models/category");
const { Op } = require("sequelize");

const validateCreate = [
    body("descripcion")
        .notEmpty().withMessage("La descripción es obligatoria.")
        .isLength({ min: 3, max: 100 }).withMessage("Debe tener entre 3 y 100 caracteres.")
        .custom(async (value) => {
            const existing = await Category.findOne({ where: { descripcion: value } });
            if (existing) throw new Error("Ya existe una categoría con esta descripción.");
            return true;
        })
];

const validateUpdate = [
    body("descripcion")
        .optional()
        .isLength({ min: 3, max: 100 }).withMessage("Debe tener entre 3 y 100 caracteres.")
        .custom(async (value, { req }) => {
            const { id } = req.params;
            const existing = await Category.findOne({ 
                where: { 
                    descripcion: value,
                    idCategoria: { [Op.ne]: id } 
                } 
            });
            if (existing) throw new Error("Ya existe otra categoría con esta descripción.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };