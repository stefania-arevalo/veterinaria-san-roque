const { body } = require("express-validator");

const pages = [
  "ventas", 
  "compras", 
  "clientes", 
  "citas", 
  "pacientes", 
  "inventario", 
  "tratamientos",
  "historial_clinico", 
  "productos",         
  "configuracion",     
  "reportes"           
];

const validatePermission = [
  body("idUsuario")
    .isInt()
    .withMessage("El ID de usuario debe ser un número entero."),
    
  body("pagina")
    .isIn(pages)
    .withMessage(`La página debe ser una de las siguientes: ${pages.join(", ")}`),
    
  // NOTA: isBoolean acepta true/false. Si en algún momento falla por formato, 
  // express-validator lo procesará correctamente si viene de Axios.
  body("habilitado")
    .isBoolean()
    .withMessage("El campo habilitado debe ser booleano.")
];

module.exports = { validatePermission };