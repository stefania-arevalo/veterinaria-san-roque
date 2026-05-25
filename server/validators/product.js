const { body, param } = require("express-validator");
const Product = require("../models/product");
const { Op } = require("sequelize");
const Category = require("../models/category");
const Brand = require("../models/brand");

const validateCreate = [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio."),
    body("descripcion").notEmpty().withMessage("La descripcion es obligatoria."),
    body("idCategoria")
        .isInt().withMessage("La categoría debe ser un entero.")
        .custom(async (value) => {
            const exists = await Category.findByPk(value);
            if (!exists) throw new Error("La categoria no existe.");
            return true;
        }),
    body("idMarca")
        .isInt().withMessage("La marca debe ser un entero.")
        .custom(async (value) => {
            const exists = await Category.findByPk(value);
            if (!exists) throw new Error("La marca no existe.");
            return true;
        }),
    body().custom(async (body) => {
        const { nombre, idMarca } = body;
        const existing = await Product.findOne({ where: { nombre, idMarca } });
        if (existing) throw new Error("Ya existe un producto con este nombre para esa marca.");
        return true;
    })
];

const validateUpdate = [
    body("nombre").optional(),
    body("descripcion").notEmpty().withMessage("La descripcion es obligatoria."),
    body("idCategoria")
        .isInt().withMessage("La categoría debe ser un entero.")
        .custom(async (value) => {
            const exists = await Category.findByPk(value);
            if (!exists) throw new Error("La categoria no existe.");
            return true;
        }),
    body("idMarca")
        .isInt().withMessage("La marca debe ser un entero.")
        .custom(async (value) => {
            const exists = await Category.findByPk(value);
            if (!exists) throw new Error("La marca no existe.");
            return true;
        }),
    body().custom(async (body, { req }) => {
        const { id } = req.params;
        const { nombre, idMarca } = body;
        // Solo validamos unicidad si alguno de los campos fue enviado en el body
        if (nombre || idMarca) {
            // Buscamos si existe otro producto con esa combinación
            const existing = await Product.findOne({
                where: {
                    nombre: nombre || (await Product.findByPk(id)).nombre,
                    idMarca: idMarca || (await Product.findByPk(id)).idMarca,
                    idProducto: { [Op.ne]: id }
                }
            });
            if (existing) throw new Error("Ya existe otro producto con esa combinación de nombre y marca.");
        }
        return true;
    })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };