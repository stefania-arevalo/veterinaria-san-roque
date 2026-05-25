const UserPermission = require("../models/userPermission");

const getPermissionsByUser = async (req, res) => {
  try {
    const { idUsuario } = req.params; // Usamos destructuring para que sea más limpio

    const permissions = await UserPermission.findAll({
      where: { idUsuario },
    });

    // Validamos si el array está vacío
    if (permissions.length === 0) {
      return res.status(404).json({ 
        message: `No se encontraron permisos registrados para el usuario con ID: ${idUsuario}` 
      });
    }

    res.json(permissions);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener permisos", error: error.message });
  }
};

const setPermission = async (req, res) => {
  try {
    const { idUsuario, pagina, habilitado } = req.body;

    // 1. Buscamos si ya existe una configuración previa para este usuario y esta página
    let record = await UserPermission.findOne({
      where: { 
        idUsuario: idUsuario, 
        pagina: pagina 
      }
    });

    if (record) {
      // 2. Si ya existe en la base de datos, simplemente actualizamos su estado
      await record.update({ habilitado });
      return res.status(200).json({ 
        message: "Permiso actualizado correctamente", 
        record 
      });
    } else {
      // 3. Si no existe, creamos el registro desde cero
      record = await UserPermission.create({
        idUsuario,
        pagina,
        habilitado
      });
      return res.status(201).json({ 
        message: "Permiso creado correctamente", 
        record 
      });
    }
  } catch (error) {

    console.error("🔥 Error interno en setPermission:", error); 
    res.status(500).json({ message: "Error al guardar permiso", error: error.message });
  }
};

module.exports = { getPermissionsByUser, setPermission };