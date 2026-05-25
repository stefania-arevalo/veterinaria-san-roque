const sequelize = require("../db");
const TreatmentMedication = require("../models/treatmentMedication");
const ProductPresentation = require("../models/productPresentation");
const Batch = require("../models/batch");
const Product = require("../models/product");
const Presentation = require("../models/presentation");

async function createTreatmentMed(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const {
      idTratamiento,
      idProd_Pres,
      cantidad,
      precioAplicado,
      notas,
      instrucciones,
      aplicadoEnClinica,
    } = req.body;

    const presentacion = await ProductPresentation.findByPk(idProd_Pres, {
      include: [
        { model: Product, attributes: ["idProducto", "nombre"] },
        { model: Presentation, as: "Presentacion", attributes: ["idPresentacion", "nombre"] },
      ],
      transaction: t,
    });

    if (!presentacion) {
      await t.rollback();
      return res.status(404).json({ msg: "La presentación seleccionada no existe." });
    }

    if (Number(aplicadoEnClinica) === 1) {
      const lote = await Batch.findOne({
        where: {
          idProducto: presentacion.idProducto,
          activo: true,
        },
        order: [["fechaVencimiento", "ASC"]],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!lote) {
        await t.rollback();
        return res.status(400).json({ msg: "Sin stock disponible para este medicamento." });
      }

      if (Number(lote.stock) < Number(cantidad)) {
        await t.rollback();
        return res.status(400).json({ msg: "Stock insuficiente." });
      }

      await lote.update(
        { stock: Number(lote.stock) - Number(cantidad) },
        { transaction: t }
      );
    }

    const record = await TreatmentMedication.create(
      {
        idTratamiento,
        idProd_Pres,
        cantidad,
        precioAplicado,
        notas,
        instrucciones,
        aplicadoEnClinica: Number(aplicadoEnClinica) ? 1 : 0,
      },
      { transaction: t }
    );

    await t.commit();
    return res.status(201).send(record);
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

async function getMedsByTreatment(req, res, next) {
    try {
      const { idTratamiento } = req.params;
  
      const meds = await TreatmentMedication.findAll({
        where: { idTratamiento },
        include: [
          {
            model: ProductPresentation,
            as: "PresentacionProducto",
            include: [
              { model: Product, attributes: ["idProducto", "nombre"] },
              {
                model: Presentation,
                as: "Presentacion",
                attributes: ["idPresentacion", "tipo", "formato"],  // ← corregido
              },
            ],
          },
        ],
        order: [["idTratMed", "DESC"]],
      });
  
      return res.status(200).send(meds);
    } catch (error) {
      next(error);
    }
  }
  
  async function getTreatmentMed(req, res, next) {
    try {
      const { id } = req.params;
  
      const record = await TreatmentMedication.findByPk(id, {
        include: [
          {
            model: ProductPresentation,
            as: "PresentacionProducto",
            include: [
              { model: Product, as: "Producto", attributes: ["idProducto", "nombre"] },
              {
                model: Presentation,
                as: "Presentacion",
                attributes: ["idPresentacion", "tipo", "formato"],  // ← corregido
              },
            ],
          },
        ],
      });
  
      if (!record) return res.status(404).send({ msg: "Registro no encontrado." });
      return res.status(200).send(record);
    } catch (error) {
      next(error);
    }
  }

async function updateTreatmentMed(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const record = await TreatmentMedication.findByPk(id, { transaction: t });
    if (!record) {
      await t.rollback();
      return res.status(404).send({ msg: "Registro no encontrado." });
    }

    const oldApplied = Number(record.aplicadoEnClinica) === 1;
    const newApplied = req.body.aplicadoEnClinica !== undefined
      ? Number(req.body.aplicadoEnClinica) === 1
      : oldApplied;

    const oldQty = Number(record.cantidad);
    const newQty = req.body.cantidad !== undefined ? Number(req.body.cantidad) : oldQty;

    const oldPP = await ProductPresentation.findByPk(record.idProd_Pres, { transaction: t });
    if (!oldPP) {
      await t.rollback();
      return res.status(404).send({ msg: "La presentación original no existe." });
    }

    const newIdProdPres = req.body.idProd_Pres !== undefined ? Number(req.body.idProd_Pres) : Number(record.idProd_Pres);
    const newPP = await ProductPresentation.findByPk(newIdProdPres, { transaction: t });
    if (!newPP) {
      await t.rollback();
      return res.status(404).send({ msg: "La nueva presentación no existe." });
    }

    const stockEffects = [];

    if (oldApplied) {
      stockEffects.push({
        idProducto: oldPP.idProducto,
        delta: oldQty,
      });
    }

    if (newApplied) {
      stockEffects.push({
        idProducto: newPP.idProducto,
        delta: -newQty,
      });
    }

    for (const eff of stockEffects) {
      const lote = await Batch.findOne({
        where: { idProducto: eff.idProducto, activo: true },
        order: [["fechaVencimiento", "ASC"]],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!lote) {
        await t.rollback();
        return res.status(400).send({ msg: "No hay lote disponible para ajustar stock." });
      }

      const nextStock = Number(lote.stock) + Number(eff.delta);
      if (nextStock < 0) {
        await t.rollback();
        return res.status(400).send({ msg: "Stock insuficiente para actualizar el medicamento." });
      }

      await lote.update({ stock: nextStock }, { transaction: t });
    }

    const fields = ["idTratamiento", "idProd_Pres", "cantidad", "precioAplicado", "notas", "instrucciones", "aplicadoEnClinica"];
    const data = {};
    for (const f of fields) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }
    if (data.aplicadoEnClinica !== undefined) data.aplicadoEnClinica = Number(data.aplicadoEnClinica) ? 1 : 0;

    await record.update(data, { transaction: t });

    await t.commit();
    return res.status(200).send({ msg: "Medicamento actualizado correctamente.", record });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

async function deleteTreatmentMed(req, res, next) {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const record = await TreatmentMedication.findByPk(id, { transaction: t });

    if (!record) {
      await t.rollback();
      return res.status(404).send({ msg: "No se encontro el registro a eliminar." });
    }

    if (Number(record.aplicadoEnClinica) === 1) {
      const pp = await ProductPresentation.findByPk(record.idProd_Pres, { transaction: t });
      if (pp) {
        const lote = await Batch.findOne({
          where: { idProducto: pp.idProducto, activo: true },
          order: [["fechaVencimiento", "ASC"]],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (lote) {
          await lote.update(
            { stock: Number(lote.stock) + Number(record.cantidad) },
            { transaction: t }
          );
        }
      }
    }

    await record.destroy({ transaction: t });

    await t.commit();
    return res.status(200).send({ msg: "Medicamento removido del tratamiento." });
  } catch (error) {
    await t.rollback();
    next(error);
  }
}

module.exports = {
  createTreatmentMed,
  getMedsByTreatment,
  getTreatmentMed,
  updateTreatmentMed,
  deleteTreatmentMed,
};