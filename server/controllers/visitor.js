const Visitor = require("../models/visitor");

async function createVisitor(req, res, next) {
    try {
        const visitor = await Visitor.create(req.body);
        return res.status(201).send(visitor);
    } catch (error) {
        next(error);
    }
}

async function getVisitors(req, res, next) {
    try {
        const visitors = await Visitor.findAll({ order: [['apellido', 'ASC']] });
        return res.status(200).send(visitors);
    } catch (error) {
        next(error);
    }
}

async function getVisitor(req, res, next) {
    try {
        const { id } = req.params;
        const visitor = await Visitor.findByPk(id);
        if (!visitor) return res.status(404).send({ msg: "Visitador no encontrado." });
        return res.status(200).send(visitor);
    } catch (error) {
        next(error);
    }
}

async function updateVisitor(req, res, next) {
    try {
        const { id } = req.params;
        const visitor = await Visitor.findByPk(id);
        if (!visitor) return res.status(404).send({ msg: "No existe el registro." });

        // Detección de cambios
        let hasChanges = false;
        const fields = ['nombre', 'apellido', 'telefono', 'correo', 'idProveedor'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                const newVal = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
                const oldVal = visitor[field];
                if (newVal != oldVal) hasChanges = true;
            }
        });

        if (!hasChanges) {
            return res.status(400).send({ msg: "No se detectaron cambios para actualizar." });
        }

        await visitor.update(req.body);
        return res.status(200).send({ msg: "Visitador actualizado.", visitor });

    } catch (error) {
        next(error);
    }
}

async function deleteVisitor(req, res, next) {
    try {
        const { id } = req.params;
        const deleted = await Visitor.destroy({ where: { idVisitador: id } });
        if (deleted === 0) return res.status(404).send({ msg: "No encontrado." });
        return res.status(200).send({ msg: "Visitador eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createVisitor,
    getVisitors,
    getVisitor,
    updateVisitor,
    deleteVisitor
};