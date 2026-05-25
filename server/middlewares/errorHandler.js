function errorHandler(err, req, res, next) {
    console.error(err);
  
    if (err.name === "SequelizeValidationError") {
      return res.status(400).send({
        msg: "Error de validación",
        errors: err.errors.map((e) => e.message),
      });
    }
  
    if (err.name === "SequelizeForeignKeyConstraintError") {
      return res.status(400).send({
        msg: "El registro relacionado no existe en la base de datos.",
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