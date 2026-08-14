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
        if (category && category !== 'all') whereClause.idCategoria = category;
        if (soloVenta === 'true') whereClause.esUsoInterno = 0;

        const hoyISO = new Date().toISOString().slice(0, 10); 

        const products = await Product.findAll({
            where: whereClause,
            include: [
                { model: Category, as: 'Categoria', attributes: ['descripcion'] },
                { model: Brand, as: 'Marca' },
                { model: Medication, as: 'Medicamento' },
                { model: Vaccine, as: 'Vacuna' },
                {
                    model: ProductPresentation,
                    as: 'Presentaciones',
                    where: { activo: true },
                    required: false,
                    attributes: ['idProdPres', 'precio'],
                    include: [{ model: Presentation, as: 'Presentacion', attributes: ['tipo', 'formato', 'cantidad'] }]
                },
                {
                    model: Batch,
                    as: 'Lotes',
                    attributes: ['idLote', 'cantidadDisponible', 'codigoLote', 'fechaVencimiento'],
                    required: false
                }
            ]
        });

        const formattedProducts = products.map(p => {
            const pJSON = p.toJSON();

            const firstPres = pJSON.Presentaciones?.[0];
            const presData = firstPres?.Presentation;

            // ── Lotes activos: con stock > 0 y NO vencidos ──
            const lotesActivos = (pJSON.Lotes || []).filter(
                b => b.cantidadDisponible > 0 && b.fechaVencimiento >= hoyISO
            );

            // FEFO: el que vence antes primero
            const loteFEFO = [...lotesActivos].sort(
                (a, b) => a.fechaVencimiento.localeCompare(b.fechaVencimiento)
            )[0] || null;

            return {
                ...pJSON,
                categoria: pJSON.Categoria?.descripcion || "General",
                precio: firstPres ? parseFloat(firstPres.precio) : 0,
                idProdPres: firstPres ? firstPres.idProdPres : null,
                presentacion: presData ? `${presData.tipo} ${presData.formato} x ${presData.cantidad}` : null,
                stock: lotesActivos.reduce((acc, b) => acc + b.cantidadDisponible, 0), // ✅ solo vigentes
                idLote: loteFEFO?.idLote ?? null // ✅ además, ahora manda el lote correcto (FEFO), no Lotes[0]
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

        // Validación de "No cambios"
        // Comparamos lo que llega en el body contra lo que tenemos en la instancia
        let hasChanges = false;
        const fields = ['nombre', 'descripcion', 'idCategoria', 'idMarca', 'activo', 'esUsoInterno'];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                // Normalizamos strings para comparar (evitar espacios)
                const newVal = typeof req.body[field] === 'string' ? req.body[field].trim() : req.body[field];
                const oldVal = product[field];
                
                if (newVal != oldVal) {
                    hasChanges = true;
                }
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
        // Soft delete
        const updated = await Product.update({ activo: false }, { where: { idProducto: id } });
        
        if (updated[0] === 0) return res.status(404).send({ msg: "Producto no encontrado." });
        
        return res.status(200).send({ msg: "Producto desactivado correctamente." });
    } catch (error) { next(error); }
}

module.exports = {
    createProduct,
    getProducts,
    getProduct,
    updateProduct,
    deleteProduct
};