const jwt = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../constants");

function createAccessToken(user) {

    const expToken = new Date();
    expToken.setHours(expToken.getHours() + 3);

    const payload = {
        token_type: "access",

        user_id: user.idUsuario,
        idRol: user.idRol,

        usuario: user.usuario || null,
        nombres: user.nombres || null,
        apellidos: user.apellidos || null,

        idPersonal: user.idPersonal || null,
        idCliente: user.idCliente || null,

        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expToken.getTime() / 1000),
    };

    return jwt.sign(payload, JWT_SECRET_KEY);
}

function createRefreshToken(user) {

    const expToken = new Date();
    expToken.setMonth(expToken.getMonth() + 1);

    const payload = {
        token_type: "refresh",
        user_id: user.idUsuario,
        idRol: user.idRol,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(expToken.getTime() / 1000),
    };

    return jwt.sign(payload, JWT_SECRET_KEY);
}

function decoded(token) {
    return jwt.verify(token, JWT_SECRET_KEY);
}

module.exports = {
    createAccessToken,
    createRefreshToken,
    decoded,
};