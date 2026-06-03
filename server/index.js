const sequelize = require("./db");
const app = require("./app");
const { IP_SERVER, API_VERSION } = require("./constants");

// Carga de modelos
require("./models/role");
require("./models/user");
require("./models/locality");
require("./models/salary");
require("./models/staff");
require("./models/professionalCard"); 
require("./models/veterinarian");
require("./models/assistant");
require("./models/seller");
require("./models/admin");
require("./models/client");
require("./models/animalSize");
require("./models/species");
require("./models/breed");
require("./models/pet");
require("./models/schedule");
require("./models/vetSchedule");
require("./models/appointmentType");
require("./models/appointmentState");
require("./models/serviceType");
require("./models/service");
require("./models/servicePrice");
require("./models/serviceAppointmentState");
require("./models/appointment");
require("./models/appointmentDetail");
require("./models/petState");
require("./models/treatmentType");
require("./models/treatmentState");
require("./models/category");
require("./models/brand");  
require("./models/medicationType");
require("./models/presentation");
require("./models/provider");
require("./models/product");
require("./models/medication");
require("./models/vaccine");
require("./models/productPresentation");
require("./models/visitor");
require("./models/batch");
require("./models/clinicalHistory");
require("./models/appliedVaccine");
require("./models/treatment");
require("./models/treatmentMedication");
require("./models/paymentType");
require("./models/receiptType");
require("./models/saleState");
require("./models/purchase");
require("./models/purchaseDetail");
require("./models/sale");
require("./models/saleDetail");
require("./models/userPermission");

const models = sequelize.models;
// Ejecutar associate() de cada modelo
Object.values(models).forEach((model) => {
    if (typeof model.associate === "function") {
      model.associate(models);
    }
});

const PORT = process.env.PORT || 3977;

async function startServer() {
   try {
       await sequelize.authenticate();
       console.log("########################");
       console.log("### CONECTADO A MYSQL ##");
       console.log("########################");

       await sequelize.sync({ force: false });
       console.log("Tablas sincronizadas correctamente.");

       app.listen(PORT, () => {
           console.log(`Servidor: http://${IP_SERVER}:${PORT}/api/${API_VERSION}/`);
       });
   } catch (error) {
       console.error("Error al conectar a la base de datos:", error);
   }
}

startServer();