const bcrypt = require("bcryptjs");
const User = require("../models/user");
const Staff = require("../models/staff");
const jwt = require("../utils/jwt");

async function register(req, res, next) {
    const { usuario, contraseña, idRol } = req.body;

    try {
        const salt = bcrypt.genSaltSync(10);
        const hashPassword = bcrypt.hashSync(contraseña, salt);

        const userStorage = await User.create({
            usuario: usuario.toLowerCase(),
            contraseña: hashPassword,
            idRol: idRol || 2, 
            estado: false,     
        });

        res.status(200).send(userStorage);
    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
  const { usuario, contraseña } = req.body;
  try {
    const userStore = await User.findOne({ where: { usuario: usuario.toLowerCase() } });
    if (!userStore) return res.status(404).send({ msg: "Usuario no encontrado" });

    const check = await bcrypt.compare(contraseña, userStore.contraseña);
    if (!check) return res.status(400).send({ msg: "Contraseña incorrecta" });
    if (!userStore.estado) return res.status(401).send({ msg: "Usuario no autorizado o no activo" });

    // Buscamos el staff
    const staffData = await Staff.findOne({ where: { idUsuario: userStore.idUsuario } });
    
    const Client = require("../models/client");
    let clientData = null;
    if (userStore.idRol === 5) {
      clientData = await Client.findOne({ where: { idUsuario: userStore.idUsuario } });
    }

    let permisos = {};
    if ([2, 3, 4].includes(userStore.idRol)) {
      const UserPermission = require("../models/userPermission");
      const permisosDB = await UserPermission.findAll({
        where: { idUsuario: userStore.idUsuario, habilitado: true }
      });
      permisosDB.forEach(p => { permisos[p.pagina] = true; });
    }

    return res.status(200).send({
      access: jwt.createAccessToken({
        idUsuario: userStore.idUsuario,
        idRol: userStore.idRol,
    
        usuario: userStore.usuario,
    
        nombres: staffData?.nombres || clientData?.nombres || null,
        apellidos: staffData?.apellidos || clientData?.apellidos || null,
    
        idPersonal: staffData?.idPersonal || null,
        idCliente: clientData?.idCliente || null
      }),
      refresh: jwt.createRefreshToken(userStore),
      permisos, 
    });
  } catch (error) {
    next(error);
  }
}

async function refreshAccessToken(req, res, next) {
    const { token } = req.body;

    try {
        const { user_id } = jwt.decoded(token);

        const userStorage = await User.findByPk(user_id);
        if (!userStorage) {
            return res.status(404).send({ msg: "Usuario no encontrado" });
        }

        // SOLUCIÓN 1: Recuperar también los datos de Staff/Client al hacer el refresh del token
        const staffData = await Staff.findOne({ where: { idUsuario: user_id } });
        
        const Client = require("../models/client");
        let clientData = null;
        if (userStorage.idRol === 5) {
            clientData = await Client.findOne({ where: { idUsuario: user_id } });
        }

        // Construimos el objeto tal cual como lo espera createAccessToken
        const payloadData = {
            idUsuario: userStorage.idUsuario,
            idRol: userStorage.idRol,
            usuario:    userStorage.usuario,
            nombres:    staffData?.nombres   || clientData?.nombres   || null,
            apellidos:  staffData?.apellidos || clientData?.apellidos || null,
            idPersonal: staffData ? (staffData.idPersonal || staffData.id) : null,
            idCliente: clientData ? (clientData.idCliente || clientData.id) : null
        };

        res.status(200).send({
          access: jwt.createAccessToken(payloadData)
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login,
    refreshAccessToken,
};