const { body, param } = require("express-validator");
const ProfessionalCard = require("../models/professionalCard");

const validateCreateCard = [
  body("idMatricula")
    .notEmpty().withMessage("El número de matrícula es obligatorio.")
    .isInt().withMessage("El número de matrícula debe ser un valor numérico.")
    .custom(async (value) => {
        const exists = await ProfessionalCard.findByPk(value);
        if (exists) throw new Error("Ya existe una matrícula con este número.");
        return true;
    }),
  body("fechaExpedicion")
    .notEmpty().withMessage("La fecha de expedición es obligatoria.")
    .isDate().withMessage("Formato de fecha de expedición inválido (YYYY-MM-DD)."),
  body("fechaVencimiento")
    .notEmpty().withMessage("La fecha de vencimiento es obligatoria.")
    .isDate().withMessage("Formato de fecha de vencimiento inválido (YYYY-MM-DD).")
];

const validateUpdateCard = [
  body("fechaExpedicion")
    .optional()
    .isDate().withMessage("Formato de fecha de expedición inválido."),
  body("fechaVencimiento")
    .optional()
    .isDate().withMessage("Formato de fecha de vencimiento inválido.")
];

const validateId = [
  param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreateCard, validateUpdateCard, validateId };