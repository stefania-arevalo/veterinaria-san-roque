const { body, param } = require("express-validator");
const Staff = require("../models/staff");
const ProfessionalCard = require("../models/professionalCard");

const validateCreateVet = [
  body("idPersonal")
    .notEmpty().withMessage("El ID de personal es obligatorio.")
    .isInt().withMessage("El ID de personal debe ser un número entero.")
    .custom(async (value) => {
        const staff = await Staff.findByPk(value);
        if (!staff) throw new Error("El personal seleccionado no existe.");
        return true;
    }),
  body("especialidad")
    .notEmpty().withMessage("La especialidad es obligatoria.")
    .isLength({ min: 3, max: 100 }).withMessage("La especialidad debe tener entre 3 y 100 caracteres."),
  body("idMatricula")
    .notEmpty().withMessage("La matrícula es obligatoria.")
    .isInt().withMessage("La matrícula debe ser un entero.")
    .custom(async (value) => {
        const card = await ProfessionalCard.findByPk(value);
        if (!card) throw new Error("La matrícula seleccionada no existe.");
        return true;
    })
];

const validateUpdateVet = [
  body("especialidad")
    .optional()
    .isLength({ min: 3, max: 100 }).withMessage("La especialidad debe tener entre 3 y 100 caracteres.")
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateVet, validateUpdateVet, validateId };