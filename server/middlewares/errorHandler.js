function errorHandler(err, req, res, next) {
    console.error(err);
  
    if (err.name === "SequelizeValidationError") {
      return res.status(400).send({
        msg: "Error de validación",
        errors: err.errors.map((e) => e.message),
      });
    }
  
    if (err.name === "SequelizeForeignKeyConstraintError") {
      // Al eliminar: el registro tiene dependientes (errno 1451)
      if (err.parent?.errno === 1451) {
        return res.status(409).send({
          message: "No se puede eliminar porque tiene registros asociados en el sistema.",
        });
      }
      // Al crear/editar: la FK referenciada no existe (errno 1452)
      return res.status(400).send({
        message: "El registro relacionado no existe en la base de datos.",
      });
    }
  
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).send({
        msg: "Ya existe un registro con esos datos.",
        errors: err.errors.map((e) => e.message),
      });
    }
  
    return res.status(err.status || 500).send({
      msg: err.message || "Error interno del servidor",
    });
  }
  
  module.exports = errorHandler;