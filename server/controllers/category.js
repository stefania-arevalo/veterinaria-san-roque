const Category = require("../models/category");

async function createCategory(req, res, next) {
    try {
        const category = await Category.create(req.body);
        return res.status(201).send(category);
    } catch (error) {
        next(error);
    }
}

async function getCategories(req, res, next) {
    try {
        const categories = await Category.findAll({ order: [['descripcion', 'ASC']] });
        return res.status(200).send(categories);
    } catch (error) {
        next(error);
    }
}

async function getCategory(req, res, next) {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).send({ msg: "Categoría no encontrada." });
        return res.status(200).send(category);
    } catch (error) {
        next(error);
    }
}

async function updateCategory(req, res, next) {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) return res.status(404).send({ msg: "La categoría no existe." });

        await category.update(req.body);
        return res.status(200).send({ msg: "Categoría actualizada correctamente.", category });
    } catch (error) {
        next(error);
    }
}

async function deleteCategory(req, res, next) {
    try {
        const deleted = await Category.destroy({ where: { idCategoria: req.params.id } });
        if (deleted === 0) return res.status(404).send({ msg: "Categoría no encontrada." });
        return res.status(200).send({ msg: "Categoría eliminada correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCategory,
    getCategories,
    getCategory,
    updateCategory,
    deleteCategory
};