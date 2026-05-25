const { body, param } = require("express-validator");
const Presentation = require("../models/presentation"); 
const { Op } = require("sequelize");

const validateCreate = [
    body("tipo")
        .notEmpty().withMessage("El tipo de envase es obligatorio.")
        .isLength({ min: 1, max: 50 }).withMessage("El tipo debe tener máximo 50 caracteres."),
    body("formato")
        .notEmpty().withMessage("El formato es obligatorio.")
        .isLength({ min: 1, max: 50 }).withMessage("El formato debe tener máximo 50 caracteres."),
    body("cantidad")
        .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),
    body("concentracion")
        .optional()
        .isLength({ max: 50 }).withMessage("La concentración debe tener máximo 50 caracteres."),
    
    // Validación de unicidad compuesta
    body().custom(async (body) => {
        const { tipo, concentracion, formato, cantidad } = body;
        const existing = await Presentation.findOne({
            where: { tipo, concentracion, formato, cantidad }
        });
        if (existing) {
            throw new Error("Ya existe una presentación con esta combinación exacta de datos.");
        }
        return true;
    })
];

const validateUpdate = [
    body("tipo")
        .optional()
        .isLength({ min: 1, max: 50 }).withMessage("El tipo debe tener máximo 50 caracteres."),
    body("formato")
        .optional()
        .isLength({ min: 1, max: 50 }).withMessage("El formato debe tener máximo 50 caracteres."),
    body("cantidad")
        .optional()
        .isInt({ min: 1 }).withMessage("La cantidad debe ser un número entero mayor a 0."),
    body("concentracion")
        .optional()
        .isLength({ max: 50 }).withMessage("La concentración debe tener máximo 50 caracteres."),
        body().custom(async (body, { req }) => {
        const { id } = req.params;
        const { tipo, concentracion, formato, cantidad } = body;
        
        // Buscamos si existe OTRA (Op.ne) presentación con estos mismos datos
        const existing = await Presentation.findOne({
            where: {
                tipo,
                concentracion,
                formato,
                cantidad,
                idPresentacion: { [Op.ne]: id } // Excluimos el registro actual
            }
        });
        if (existing) {
            throw new Error("Ya existe otra presentación con esta combinación exacta de datos.");
        }
        return true;
    })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };