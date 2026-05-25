const Batch = require("../models/batch");
const Product = require("../models/product");

const UMBRAL_STOCK_MINIMO = 5;

async function checkAndAlertStock(idProducto, transaction) {
    const totalStock = await Batch.sum('cantidadDisponible', {
        where: { idProducto },
        transaction
    }) || 0;

    if (totalStock <= UMBRAL_STOCK_MINIMO) {
        console.warn(`⚠️ ALERTA: El producto ID ${idProducto} tiene stock bajo: ${totalStock} unidades.`);
    }
}

module.exports = { checkAndAlertStock };