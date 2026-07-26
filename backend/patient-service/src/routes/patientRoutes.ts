import express from 'express';
import { PatientController } from '../controllers/patientController';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = express.Router();

// All routes require authentication and tenant context
router.use(authMiddleware);
router.use(tenantMiddleware);

// Get dashboard data (patients, appointments, stats)
router.get('/dashboard', PatientController.getDashboardData);

// Create new booking (patient + appointment)
router.post('/bookings', PatientController.createBooking);

// Patient routes
router.get('/patients', PatientController.getPatients);
router.get('/patients/:id', PatientController.getPatientById);
router.post('/patients', PatientController.createPatient);
router.put('/patients/:id', PatientController.updatePatient);
router.delete('/patients/:id', PatientController.deletePatient);

// Appointment routes
router.get('/appointments', PatientController.getAppointments);
router.get('/appointments/today', PatientController.getTodaysAppointments);
router.get('/appointments/calendar', PatientController.getCalendarAppointments);
router.get('/appointments/:id', PatientController.getAppointmentById);
router.post('/appointments', PatientController.createAppointment);
router.put('/appointments/:id', PatientController.updateAppointment);
router.delete('/appointments/:id', PatientController.deleteAppointment);

// Statistics
router.get('/stats/summary', PatientController.getStatsSummary);
router.get('/stats/visits', PatientController.getVisitsStats);

export default router;
