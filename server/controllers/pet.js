const { Op } = require("sequelize");
const Pet = require("../models/pet");
const Breed = require("../models/breed");
const Species = require("../models/species");
const Client = require("../models/client");
const AnimalSize = require("../models/animalSize");

async function createPet(req, res, next) {
    const { idRaza, idEspecie } = req.body;
    try {
      
        const razaInfo = await Breed.findByPk(idRaza);
        
        // Regla de negocio: la raza debe pertenecer a la especie enviada
        if (razaInfo.idEspecie !== parseInt(idEspecie)) {
            return res.status(400).send({ msg: "Error: La raza no pertenece a esa especie." });
        }

        const pet = await Pet.create(req.body);
        return res.status(201).send(pet);
    } catch (error) {
        next(error);
    }
}

async function getPets(req, res, next) {
    const { search } = req.query;
    const { idRol, user_id } = req.user; 
    let wherePet = {};

    try {
        // Si es cliente, primero buscamos SU id de cliente usando su user_id
        if (idRol === 5) {
            const client = await Client.findOne({ where: { idUsuario: user_id } });
            // Si no encontramos el cliente, devolvemos lista vacía
            if (!client) return res.status(200).send([]);
            wherePet.idCliente = client.idCliente;
        }

        if (search) {
            wherePet[Op.or] = [
                { nombre: { [Op.like]: `%${search}%` } },
                { '$Dueño.nombres$': { [Op.like]: `%${search}%` } },
                { '$Dueño.apellidos$': { [Op.like]: `%${search}%` } }
            ];
        }

        const pets = await Pet.findAll({
            where: wherePet,
            include: [
                { 
                    model: Breed, 
                    as: 'Raza', 
                    include: [{ model: Species, as: 'Especie' }] 
                },
                { model: Client, as: 'Dueño', attributes: ['nombres', 'apellidos'] },
                { model: AnimalSize, as: 'AnimalSize' }
            ]
        });

        return res.status(200).send(pets);
    } catch (error) {
        next(error);
    }
}

async function getPet(req, res, next) {
    const { id } = req.params;
    const { idRol, user_id } = req.user;
    try {
        const pet = await Pet.findByPk(id, { include: [{ model: Breed, as: 'Raza' }, { model: Client, as: 'Dueño' }] });
        
        if (!pet) return res.status(404).send({ msg: "No existe la mascota." });

        // CORRECCIÓN: Si es cliente, validar contra su idCliente, no contra user_id
        if (idRol === 5) {
            const client = await Client.findOne({ where: { idUsuario: user_id } });
            if (!client || pet.idCliente !== client.idCliente) {
                return res.status(403).send({ msg: "No tienes permiso para ver esta mascota." });
            }
        }

        return res.status(200).send(pet);
    } catch (error) {
        next(error);
    }
}

async function updatePet(req, res, next) {
    const { id } = req.params;
    const { idRaza, idEspecie } = req.body;
    const { idRol, user_id } = req.user;

    try {
        const pet = await Pet.findByPk(id);
        if (!pet) return res.status(404).send({ msg: "Mascota no encontrada." });

        // Seguridad de acceso
        if (idRol === 5 && pet.idCliente !== user_id) {
            return res.status(403).send({ msg: "No puedes editar mascotas de otros." });
        }

        // Mantenemos la validación de coherencia si se intenta actualizar raza y especie
        if (idRaza && idEspecie) {
            const razaInfo = await Breed.findByPk(idRaza);
            if (razaInfo.idEspecie !== parseInt(idEspecie)) {
                return res.status(400).send({ msg: "Error de coherencia Raza/Especie." });
            }
        }

        await pet.update(req.body);
        return res.status(200).send({ msg: "Mascota actualizada." });
    } catch (error) {
        next(error);
    }
}

async function deletePet(req, res, next) {
    const { id } = req.params;
    try {
        const deleted = await Pet.destroy({ where: { idMascota: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Mascota no encontrada." });
        return res.status(200).send({ msg: "Mascota eliminada." });
    } catch (error) {
        next(error);
    }
}

module.exports = { createPet, getPets, getPet, updatePet, deletePet };