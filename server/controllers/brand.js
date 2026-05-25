const Brand = require("../models/brand");

async function createBrand(req, res) {
    try {
        const brand = await Brand.create(req.body);
        return res.status(201).send(brand);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError" || error.name === "SequelizeValidationError") {
            return res.status(400).send({ msg: error.errors[0].message });
        }
        return res.status(500).send({ msg: "Error al crear la marca." });
    }
}

async function getBrands(req, res) {
    try {
        const brands = await Brand.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(brands);
    } catch (error) {
        return res.status(500).send({ msg: "Error al obtener las marcas." });
    }
}

async function getBrand(req, res) {
    try {
        const { id } = req.params;
        const brand = await Brand.findByPk(id);
        if (!brand) return res.status(404).send({ msg: "Marca no encontrada." });
        return res.status(200).send(brand);
    } catch (error) {
        return res.status(500).send({ msg: "Error interno del servidor." });
    }
}

async function updateBrand(req, res) {
    try {
        const { id } = req.params;
        const { descripcion } = req.body;

        const brand = await Brand.findByPk(id);
        if (!brand) return res.status(404).send({ msg: "La marca no existe." });

        // 1. Normalizamos la entrada igual que lo hace el hook del modelo
        // para poder comparar peras con peras.
        const cleanDesc = descripcion.trim().charAt(0).toUpperCase() + descripcion.trim().slice(1).toLowerCase();

        // 2. Comparamos el dato nuevo con el actual
        if (brand.descripcion === cleanDesc) {
            return res.status(400).send({ 
                msg: "No se realizaron cambios: la descripción es igual a la actual." 
            });
        }

        // 3. Si es diferente, procedemos
        await brand.update({ descripcion });
        
        return res.status(200).send({ 
            msg: "Marca actualizada correctamente.", 
            brand 
        });

    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError" || error.name === "SequelizeValidationError") {
            return res.status(400).send({ msg: error.errors[0].message });
        }
        return res.status(500).send({ msg: "Error al actualizar la marca." });
    }
}

async function deleteBrand(req, res) {
    try {
        const { id } = req.params;
        const deleted = await Brand.destroy({ where: { idMarca: id } });
        if (deleted === 0) return res.status(404).send({ msg: "Marca no encontrada." });
        return res.status(200).send({ msg: "Marca eliminada correctamente." });
    } catch (error) {
        // Error de integridad si la marca ya está siendo usada por un producto
        return res.status(500).send({ msg: "No se puede eliminar la marca porque tiene productos asociados." });
    }
}

module.exports = {
    createBrand,
    getBrands,
    getBrand,
    updateBrand,
    deleteBrand
};