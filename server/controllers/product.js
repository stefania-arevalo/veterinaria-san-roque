const ProductPresentation = require("../models/productPresentation");
const Product = require("../models/product");
const Category = require("../models/category");
const Presentation = require("../models/presentation");
const Batch = require("../models/batch");
const Brand = require("../models/brand");
const Medication = require("../models/medication");
const Vaccine = require("../models/vaccine");
const { Op } = require("sequelize");

async function createProduct(req, res, next) {
    try {
        const product = await Product.create(req.body);
        return res.status(201).send(product);
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError" || error.name === "SequelizeValidationError") {
            return res.status(400).send({ msg: error.errors[0].message });
        }
        next(error);
    }
}

const getProducts = async (req, res) => {
    try {
        const { search, category, soloVenta } = req.query;
        const whereClause = { activo: true };
        if (search) whereClause.nombre = { [Op.like]: `%${search}%` };
        if (category && category !== "all") whereClause.idCategoria = category;
        if (soloVenta === "true") whereClause.esUsoInterno = 0;

        const products = await Product.findAll({
            where: whereClause,
            include: [
                {
                    model: Category,
                    as: "Categoria",
                    attributes: ["idCategoria", "descripcion"],
                },
                {
                    model: Brand,
                    as: "Marca",
                    // ⚠️ Brand usa "nombre", no "descripcion"
                    attributes: ["idMarca", "nombre"],
                },
                { model: Medication, as: "Medicamento", required: false },
                { model: Vaccine,    as: "Vacuna",      required: false },
                {
                    model: ProductPresentation,
                    as: "Presentaciones",
                    where: { activo: true },
                    required: false,        // LEFT JOIN — productos sin presentaciones también aparecen
                    attributes: ["idProdPres", "precio"],
                    include: [{
                        model: Presentation,
                        as: "Presentacion",
                        attributes: ["tipo", "formato", "cantidad"],
                    }],
                },
                {
                    model: Batch,
                    as: "Lotes",
                    attributes: ["idLote", "cantidadDisponible", "codigoLote", "fechaVencimiento"],
                    // ⚠️ NO filtrar por fechaVencimiento aquí — necesitamos todos los lotes
                    // para el cálculo de stock total (incluyendo vencidos con cantidad > 0)
                    required: false,
                },
            ],
        });

        // Mapeo normalizado: lee siempre los alias exactos del backend
        const formattedProducts = products.map(p => {
            const pJSON = p.toJSON();
            const firstPres  = pJSON.Presentaciones?.[0];
            const firstBatch = pJSON.Lotes?.[0];

            return {
                ...pJSON,
                // Normalizar campos de display para el frontend
                // El frontend ya lee p.Categoria?.descripcion y p.Marca?.nombre
                stock:     pJSON.Lotes?.reduce((acc, b) => acc + (b.cantidadDisponible || 0), 0) || 0,
                precio:    firstPres ? parseFloat(firstPres.precio) : 0,
                idProdPres: firstPres ? firstPres.idProdPres : null,
                presentacion: firstPres?.Presentacion
                    ? `${firstPres.Presentacion.tipo} ${firstPres.Presentacion.formato} x ${firstPres.Presentacion.cantidad}`
                    : null,
                idLote: firstBatch?.idLote ?? null,
            };
        });

        res.json(formattedProducts);
    } catch (error) {
        console.error("Error en GET products:", error);
        res.status(500).json({ msg: "Error al obtener productos" });
    }
};

async function getProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ where: { idProducto: id, activo: true } });
        if (!product) return res.status(404).send({ msg: "Producto no encontrado o desactivado." });
        return res.status(200).send(product);
    } catch (error) {
        next(error);
    }
}

async function updateProduct(req, res, next) {
    try {
        const { id } = req.params;
        const product = await Product.findOne({ where: { idProducto: id, activo: true } });
        if (!product) return res.status(404).send({ msg: "El producto no existe o está desactivado." });

        // Detectar cambios — también incluir esUsoInterno y activo
        let hasChanges = false;
        const fields = ["nombre", "descripcion", "idCategoria", "idMarca", "esUsoInterno", "activo"];
        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                const newVal = typeof req.body[field] === "string" ? req.body[field].trim() : req.body[field];
                // Usar == para comparar número vs string (ej: idCategoria)
                if (newVal != product[field]) hasChanges = true;
            }
        });

        if (!hasChanges) {
            return res.status(400).send({ msg: "No se detectaron cambios en el producto." });
        }

        await product.update(req.body);
        return res.status(200).send({ msg: "Producto actualizado correctamente.", product });
    } catch (error) {
        next(error);
    }
}

async function deleteProduct(req, res, next) {
    try {
        const { id } = req.params;
        const updated = await Product.update({ activo: false }, { where: { idProducto: id } });
        if (updated[0] === 0) return res.status(404).send({ msg: "Producto no encontrado." });
        return res.status(200).send({ msg: "Producto desactivado correctamente." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct,
};