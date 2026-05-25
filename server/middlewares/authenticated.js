const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../constants");

function asureAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send({ msg: "La petición no tiene la cabecera de autenticación" });
  }

  const token = req.headers.authorization.replace("Bearer ", "");

  try {
    // verify() comprueba la firma Y la expiración automáticamente
    const payload = jwt.verify(token, JWT_SECRET_KEY);

    req.user = payload;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).send({ msg: "El token ha expirado" });
    }
    return res.status(401).send({ msg: "Token inválido" });
  }
}

function hasRole(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user || !req.user.idRol) {
      return res
        .status(403)
        .send({ msg: "El token no contiene el rol del usuario" });
    }

    if (!rolesPermitidos.includes(req.user.idRol)) {
      return res
        .status(403)
        .send({ msg: "No tienes los permisos necesarios para esta acción" });
    }

    next();
  };
}

module.exports = {
  asureAuth,
  hasRole,
};