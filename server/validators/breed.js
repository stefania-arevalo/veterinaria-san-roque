const { body, param } = require("express-validator");
const Species = require("../models/species");

const validateCreateBreed = [
    body("nombre").notEmpty().withMessage("El nombre es obligatorio."),
    body("idEspecie")
        .notEmpty().withMessage("La especie es obligatoria.")
        .isInt().withMessage("La especie debe ser un entero.")
        .custom(async (value) => {
            const species = await Species.findByPk(value);
            if (!species) throw new Error("La especie seleccionada no existe.");
            return true;
        })
];

const validateUpdateBreed = [
    body("nombre").optional(),
    body("idEspecie")
        .optional()
        .isInt().withMessage("La especie debe ser un entero.")
        .custom(async (value) => {
            if (!value) return true;
            const species = await Species.findByPk(value);
            if (!species) throw new Error("La especie seleccionada no existe.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateBreed, validateUpdateBreed, validateId };