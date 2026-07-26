import { Request, Response } from 'express';
import { pool } from '../config/database';

export class PatientController {
  /**
   * Get complete dashboard data
   * GET /api/v1/patients/dashboard
   */
  static async getDashboardData(req: Request, res: Response) {
    try {
      const tenantSchema = (req as any).tenantSchema;
      
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get today's appointments with patient details
      const todaysAppointments = await pool.query(`
        SELECT 
          a.id,
          a.appointment_date,
          a.appointment_time,
          a.duration,
          a.appointment_type,
          a.status,
          a.reason,
          a.notes,
          p.id as patient_id,
          p.first_name,
          p.last_name,
          p.phone,
          p.email,
          p.gender
        FROM ${tenantSchema}.appointments a
        JOIN ${tenantSchema}.patients p ON a.patient_id = p.id
        WHERE a.appointment_date = $1
        ORDER BY a.appointment_time
      `, [today]);
      
      // Get calendar appointments for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const firstDay = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
      
      const calendarAppointments = await pool.query(`
        SELECT 
          appointment_date,
          COUNT(*) as count
        FROM ${tenantSchema}.appointments
        WHERE appointment_date BETWEEN $1 AND $2
        GROUP BY appointment_date
        ORDER BY appointment_date
      `, [firstDay, lastDay]);
      
      // Get visit statistics
      const visitsStats = await pool.query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN a.appointment_date = $1 THEN a.patient_id END) as today_visits,
          COUNT(DISTINCT CASE WHEN p.created_at >= $1 THEN p.id END) as new_patients_today,
          COUNT(DISTINCT CASE WHEN a.appointment_date = $1 AND a.status != 'cancelled' THEN a.id END) as total_appointments_today
        FROM ${tenantSchema}.patients p
        LEFT JOIN ${tenantSchema}.appointments a ON p.id = a.patient_id
      `, [today]);
      
      // Get total patients
      const totalPatients = await pool.query(`
        SELECT COUNT(*) as count FROM ${tenantSchema}.patients
      `);
      
      res.json({
        success: true,
        data: {
          todaysAppointments: todaysAppointments.rows,
          calendarData: calendarAppointments.rows,
          stats: {
            todayVisits: parseInt(visitsStats.rows[0].today_visits) || 0,
            newPatientsToday: parseInt(visitsStats.rows[0].new_patients_today) || 0,
            totalAppointmentsToday: parseInt(visitsStats.rows[0].total_appointments_today) || 0,
            totalPatients: parseInt(totalPatients.rows[0].count) || 0
          },
          currentDate: {
            month: currentMonth,
            year: currentYear,
            today: today
          }
        }
      });
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message
      });
    }
  }

  /**
   * Get all patients
   * GET /api/v1/patients/patients
   */
  static async getPatients(req: Request, res: Response) {
    try {
      const tenantSchema = (req as any).tenantSchema;
      const { limit = 50, offset = 0, search } = req.query;
      
      let query = `
        SELECT 
          id, first_name, last_name, date_of_birth, gender, 
          phone, email, address_line1, city, state,
          dental_history, last_cleaning_date, created_at
        FROM ${tenantSchema}.patients
      `;
      
      const params: any[] = [];
      
      if (search) {
        query += ` WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1`;
        params.push(`%${search}%`);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      
      res.json({
        success: true,
        data: result.rows,
        meta: {
          total: result.rowCount,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch patients',
        error: error.message
      });
    }
  }

  /**
   * Get today's appointments
   * GET /api/v1/patients/appointments/today
   */
  static async getTodaysAppointments(req: Request, res: Response) {
    try {
      const tenantSchema = (req as any).tenantSchema;
      const today = new Date().toISOString().split('T')[0];
      
      const result = await pool.query(`
        SELECT 
          a.*,
          p.first_name,
          p.last_name,
          p.phone,
          p.email,
          p.gender,
          p.date_of_birth
        FROM ${tenantSchema}.appointments a
        JOIN ${tenantSchema}.patients p ON a.patient_id = p.id
        WHERE a.appointment_date = $1
        ORDER BY a.appointment_time
      `, [today]);
      
      res.json({
        success: true,
        data: result.rows
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch today\'s appointments',
        error: error.message
      });
    }
  }

  // Placeholder methods (to be implemented)
  static async getPatientById(req: Request, res: Response) { res.json({ success: true }); }
  static async createPatient(req: Request, res: Response) { res.json({ success: true }); }
  static async updatePatient(req: Request, res: Response) { res.json({ success: true }); }
  static async deletePatient(req: Request, res: Response) { res.json({ success: true }); }
  static async getAppointments(req: Request, res: Response) { res.json({ success: true }); }
  static async getCalendarAppointments(req: Request, res: Response) { res.json({ success: true }); }
  static async getAppointmentById(req: Request, res: Response) { res.json({ success: true }); }
  static async createAppointment(req: Request, res: Response) { res.json({ success: true }); }
  static async updateAppointment(req: Request, res: Response) { res.json({ success: true }); }
  static async deleteAppointment(req: Request, res: Response) { res.json({ success: true }); }
  static async getStatsSummary(req: Request, res: Response) { res.json({ success: true }); }
  static async getVisitsStats(req: Request, res: Response) { res.json({ success: true }); }
}
