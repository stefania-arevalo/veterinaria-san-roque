const express = require ("express");
const bodyParser = require ("body-parser");
const cors = require("cors");
const { API_VERSION } = require ("./constants");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Import routings
const authRoutes = require("./router/auth");
const userRoutes = require("./router/user");
const roleRoutes = require("./router/role"); 
const localityRoutes = require("./router/locality"); 
const salaryRoutes = require("./router/salary"); 
const staffRoutes = require("./router/staff"); 
const cardRoutes = require("./router/professionalCard"); 
const veterinarianRoutes = require("./router/veterinarian"); 
const assistantRoutes = require("./router/assistant"); 
const sellerRoutes = require("./router/seller"); 
const adminRoutes = require("./router/admin"); 
const clientRoutes = require("./router/client"); 
const animalSizeRoutes = require("./router/animalSize"); 
const speciesRoutes = require("./router/species"); 
const breedRoutes = require("./router/breed"); 
const petRoutes = require("./router/pet"); 
const scheduleRoutes = require("./router/schedule"); 
const vetScheduleRoutes = require("./router/vetSchedule"); 
const appointmentTypeRoutes = require("./router/appointmentType"); 
const appointmentStateRoutes = require("./router/appointmentState"); 
const serviceTypeRoutes = require("./router/serviceType"); 
const serviceRoutes = require("./router/service"); 
const servicePriceRoutes = require("./router/servicePrice"); 
const serviceAppointmentStateRoutes = require("./router/serviceAppointmentState"); 
const appointmentRoutes = require("./router/appointment"); 
const appointmentDetailRoutes = require("./router/appointmentDetail"); 
const petStateRoutes = require("./router/petState"); 
const treatmentTypeRoutes = require("./router/treatmentType"); 
const treatmentStateRoutes = require("./router/treatmentState"); 
const categoryRoutes = require("./router/category"); 
const brandRoutes = require("./router/brand"); 
const medicationTypeRoutes = require("./router/medicationType"); 
const presentationRoutes = require("./router/presentation"); 
const providerRoutes = require("./router/provider"); 
const productRoutes = require("./router/product"); 
const medicationRoutes = require("./router/medication"); 
const vaccineRoutes = require("./router/vaccine"); 
const productPresentationRoutes = require("./router/productPresentation"); 
const visitorRoutes = require("./router/visitor"); 
const batchRoutes = require("./router/batch"); 
const clinicalHistoryRoutes = require("./router/clinicalHistory"); 
const appliedVaccineRoutes = require("./router/appliedVaccine"); 
const treatmentRoutes = require("./router/treatment"); 
const treatmentMedicationRoutes = require("./router/treatmentMedication"); 
const paymentTypeRoutes = require("./router/paymentType"); 
const receiptTypeRoutes = require("./router/receiptType"); 
const saleStateRoutes = require("./router/saleState"); 
const purchaseRoutes = require("./router/purchase"); 
const purchaseDetailRoutes = require("./router/purchaseDetail"); 
const saleRoutes = require("./router/sale"); 
const saleDetailRoutes = require("./router/saleDetail"); 
const userPermissionRoutes = require("./router/userPermission"); 
const reportsRouter = require("./router/reports");

// Configure Body Parse
app.use(bodyParser.urlencoded( {extended: true}));
app.use(bodyParser.json());

// Configure Static Folder
app.use(express.static("uploads"));
app.use("/uploads", express.static("uploads"));

//Configure Header HTTP - CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://veterinaria-san-roque.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors()); 

// Configure routings
app.use(`/api/${API_VERSION}`, authRoutes);
app.use(`/api/${API_VERSION}`, userRoutes);
app.use(`/api/${API_VERSION}`, roleRoutes); 
app.use(`/api/${API_VERSION}`, localityRoutes); 
app.use(`/api/${API_VERSION}`, salaryRoutes); 
app.use(`/api/${API_VERSION}`, staffRoutes); 
app.use(`/api/${API_VERSION}`, cardRoutes); 
app.use(`/api/${API_VERSION}`, veterinarianRoutes); 
app.use(`/api/${API_VERSION}`, assistantRoutes); 
app.use(`/api/${API_VERSION}`, sellerRoutes); 
app.use(`/api/${API_VERSION}`, adminRoutes); 
app.use(`/api/${API_VERSION}`, clientRoutes); 
app.use(`/api/${API_VERSION}`, animalSizeRoutes);
app.use(`/api/${API_VERSION}`, speciesRoutes); 
app.use(`/api/${API_VERSION}`, breedRoutes); 
app.use(`/api/${API_VERSION}`, petRoutes); 
app.use(`/api/${API_VERSION}`, scheduleRoutes); 
app.use(`/api/${API_VERSION}`, vetScheduleRoutes); 
app.use(`/api/${API_VERSION}`, appointmentTypeRoutes); 
app.use(`/api/${API_VERSION}`, appointmentStateRoutes);
app.use(`/api/${API_VERSION}`, serviceTypeRoutes);
app.use(`/api/${API_VERSION}`, serviceRoutes);
app.use(`/api/${API_VERSION}`, servicePriceRoutes);
app.use(`/api/${API_VERSION}`, serviceAppointmentStateRoutes);
app.use(`/api/${API_VERSION}`, appointmentRoutes);
app.use(`/api/${API_VERSION}`, appointmentDetailRoutes);
app.use(`/api/${API_VERSION}`, petStateRoutes);
app.use(`/api/${API_VERSION}`, treatmentTypeRoutes);
app.use(`/api/${API_VERSION}`, treatmentStateRoutes);
app.use(`/api/${API_VERSION}`, categoryRoutes);
app.use(`/api/${API_VERSION}`, brandRoutes);
app.use(`/api/${API_VERSION}`, medicationTypeRoutes);
app.use(`/api/${API_VERSION}`, presentationRoutes);
app.use(`/api/${API_VERSION}`, providerRoutes);
app.use(`/api/${API_VERSION}`, productRoutes);
app.use(`/api/${API_VERSION}`, medicationRoutes);
app.use(`/api/${API_VERSION}`, vaccineRoutes);
app.use(`/api/${API_VERSION}`, productPresentationRoutes);
app.use(`/api/${API_VERSION}`, visitorRoutes);
app.use(`/api/${API_VERSION}`, batchRoutes);
app.use(`/api/${API_VERSION}`, clinicalHistoryRoutes);
app.use(`/api/${API_VERSION}`, appliedVaccineRoutes);
app.use(`/api/${API_VERSION}`, treatmentRoutes);
app.use(`/api/${API_VERSION}`, treatmentMedicationRoutes);
app.use(`/api/${API_VERSION}`, paymentTypeRoutes);
app.use(`/api/${API_VERSION}`, receiptTypeRoutes);
app.use(`/api/${API_VERSION}`, saleStateRoutes);
app.use(`/api/${API_VERSION}`, purchaseRoutes);
app.use(`/api/${API_VERSION}`, purchaseDetailRoutes);
app.use(`/api/${API_VERSION}`, saleRoutes);
app.use(`/api/${API_VERSION}`, saleDetailRoutes);
app.use(`/api/${API_VERSION}`, userPermissionRoutes);
app.use(`/api/${API_VERSION}`, reportsRouter);

app.use(errorHandler);

module.exports = app;