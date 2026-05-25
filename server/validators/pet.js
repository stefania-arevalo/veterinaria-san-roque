const { body, param } = require("express-validator");
const Client = require("../models/client");
const Breed = require("../models/breed");
const AnimalSize = require("../models/animalSize");
const Pet = require("../models/pet"); // IMPORTANTE: Importar el modelo Pet

const validateCreatePet = [
    body("nombre")
        .notEmpty().withMessage("El nombre es obligatorio.")
        .custom(async (value, { req }) => {
            const { idCliente } = req.body;
            // Buscamos si existe una mascota con este nombre para este cliente
            const existing = await Pet.findOne({ 
                where: { nombre: value, idCliente: idCliente } 
            });
            if (existing) {
                throw new Error("Ya tienes una mascota registrada con este nombre.");
            }
            return true;
        }),
    body("sexo").notEmpty().withMessage("El sexo es obligatorio."),
    
    // Validación de Cliente
    body("idCliente")
        .isInt().withMessage("El ID del cliente debe ser un entero.")
        .custom(async (value) => {
            const client = await Client.findByPk(value);
            if (!client) throw new Error("El cliente seleccionado no existe.");
            return true;
        }),

    // Validación de Raza
    body("idRaza")
        .isInt().withMessage("El ID de la raza debe ser un entero.")
        .custom(async (value) => {
            const breed = await Breed.findByPk(value);
            if (!breed) throw new Error("La raza seleccionada no existe.");
            return true;
        }),

    // Validación de Tamaño
    body("idTamaño")
        .isInt().withMessage("El ID del tamaño debe ser un entero.")
        .custom(async (value) => {
            const size = await AnimalSize.findByPk(value);
            if (!size) throw new Error("El tamaño seleccionado no existe.");
            return true;
        })
];

const validateUpdatePet = [
    body("nombre")
        .notEmpty().withMessage("El nombre es obligatorio.")
        .custom(async (value, { req }) => {
            const { idCliente } = req.body;
            const idMascota = req.params.id; // viene de la URL /pet/:id
            const { Op } = require("sequelize");
            const existing = await Pet.findOne({
            where: {
                nombre: value,
                idCliente,
                idMascota: { [Op.ne]: idMascota } // excluir la actual
            }
            });
            if (existing) throw new Error("Ya tienes una mascota registrada con este nombre.");
            return true;
        }),
    body("sexo").optional(),
    
    body("idCliente")
        .optional()
        .isInt()
        .custom(async (value) => {
            if (!value) return true;
            const client = await Client.findByPk(value);
            if (!client) throw new Error("El cliente seleccionado no existe.");
            return true;
        }),

    body("idRaza")
        .optional()
        .isInt()
        .custom(async (value) => {
            if (!value) return true;
            const breed = await Breed.findByPk(value);
            if (!breed) throw new Error("La raza seleccionada no existe.");
            return true;
        }),

    body("idTamaño")
        .optional()
        .isInt()
        .custom(async (value) => {
            if (!value) return true;
            const size = await AnimalSize.findByPk(value);
            if (!size) throw new Error("El tamaño seleccionado no existe.");
            return true;
        })
];

const validateId = [
    param("id").isInt().withMessage("El ID debe ser un número entero.")
];

module.exports = { validateCreatePet, validateUpdatePet, validateId };