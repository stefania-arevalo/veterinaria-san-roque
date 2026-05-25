const { body, param } = require("express-validator");
const Service = require("../models/service");
const AnimalSize = require("../models/animalSize");

const validateCreate = [
    body("idServicio")
        .notEmpty().withMessage("El ID del servicio es obligatorio.")
        .custom(async (value) => {
            const exists = await Service.findByPk(value);
            if (!exists) throw new Error("El servicio seleccionado no existe.");
            return true;
        }),
    body("idTamaño")
        .notEmpty().withMessage("El ID del tamaño es obligatorio.")
        .custom(async (value) => {
            const exists = await AnimalSize.findByPk(value);
            if (!exists) throw new Error("El tamaño de animal seleccionado no existe.");
            return true;
        }),
    body("precio")
        .notEmpty().withMessage("El precio es obligatorio.")
        .isDecimal().withMessage("El precio debe ser un número decimal.")
        .custom((value) => {
            if (parseFloat(value) <= 0) throw new Error("El precio debe ser mayor a 0.");
            return true;
        }),
    body("duracionEstimada")
        .optional()
        .isInt({ min: 1 }).withMessage("La duración debe ser un número entero mayor a 0.")
];

const validateUpdate = [
    body("idServicio")
        .optional()
        .custom(async (value) => {
            const exists = await Service.findByPk(value);
            if (!exists) throw new Error("El servicio seleccionado no existe.");
            return true;
        }),
    body("idTamaño")
        .optional()
        .custom(async (value) => {
            const exists = await AnimalSize.findByPk(value);
            if (!exists) throw new Error("El tamaño de animal seleccionado no existe.");
            return true;
        }),
    body("precio")
        .optional()
        .isDecimal().withMessage("El precio debe ser un número decimal.")
        .custom((value) => {
            if (parseFloat(value) <= 0) throw new Error("El precio debe ser mayor a 0.");
            return true;
        }),
    body("duracionEstimada")
        .optional()
        .isInt({ min: 1 }).withMessage("La duración debe ser un número entero mayor a 0.")
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreate, validateUpdate, validateId };