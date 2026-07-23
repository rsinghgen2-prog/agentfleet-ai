import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';
import { logger } from '../utils/logger';
import { SUPER_ADMIN } from '../config/constants';

interface LoginRequest {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface JWTPayload {
  userId: string;
  email: string;
  tenantId?: string;
  role: string;
  permissions: string[];
  isSuperAdmin: boolean;
}

export class AuthController {
  /**
   * User Login
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, tenantSlug }: LoginRequest = req.body;

      // 1. Check if Super Admin
      if (email.toLowerCase() === SUPER_ADMIN.email.toLowerCase()) {
        return await AuthController.loginSuperAdmin(email, password, res);
      }

      // 2. Validate tenant exists
      if (!tenantSlug) {
        return res.status(400).json({
          success: false,
          message: 'Tenant slug is required'
        });
      }

      const tenantQuery = await pool.query(
        'SELECT id, schema_name, subscription_status, is_active FROM public.tenants WHERE slug = $1',
        [tenantSlug]
      );

      if (tenantQuery.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }

      const tenant = tenantQuery.rows[0];

      if (!tenant.is_active || tenant.subscription_status === 'suspended') {
        return res.status(403).json({
          success: false,
          message: 'Organization account is suspended'
        });
      }

      // 3. Query user from tenant schema
      const userQuery = await pool.query(
        `SELECT id, email, password_hash, full_name, role, permissions, is_active 
         FROM ${tenant.schema_name}.users 
         WHERE email = $1`,
        [email]
      );

      if (userQuery.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = userQuery.rows[0];

      if (!user.is_active) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // 4. Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        // Increment failed attempts
        await pool.query(
          `UPDATE ${tenant.schema_name}.users 
           SET failed_login_attempts = failed_login_attempts + 1 
           WHERE id = $1`,
          [user.id]
        );

        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // 5. Update last login
      await pool.query(
        `UPDATE ${tenant.schema_name}.users 
         SET last_login_at = NOW(), last_login_ip = $1, failed_login_attempts = 0 
         WHERE id = $2`,
        [req.ip, user.id]
      );

      // 6. Generate JWT tokens
      const accessToken = AuthController.generateAccessToken({
        userId: user.id,
        email: user.email,
        tenantId: tenant.id,
        role: user.role,
        permissions: user.permissions || [],
        isSuperAdmin: false
      });

      const refreshToken = AuthController.generateRefreshToken(user.id);

      // 7. Determine dashboard route based on role
      const dashboardRoute = AuthController.getDashboardRoute(user.role, tenant.schema_name);

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            permissions: user.permissions
          },
          tenant: {
            id: tenant.id,
            slug: tenantSlug
          },
          tokens: {
            accessToken,
            refreshToken
          },
          dashboardRoute
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  }

  /**
   * Super Admin Login
   */
  private static async loginSuperAdmin(email: string, password: string, res: Response) {
    const superAdminQuery = await pool.query(
      'SELECT id, email, password_hash, full_name, is_active FROM public.super_admins WHERE email = $1',
      [email]
    );

    if (superAdminQuery.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const superAdmin = superAdminQuery.rows[0];

    const isValidPassword = await bcrypt.compare(password, superAdmin.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await pool.query(
      'UPDATE public.super_admins SET last_login_at = NOW() WHERE id = $1',
      [superAdmin.id]
    );

    const accessToken = AuthController.generateAccessToken({
      userId: superAdmin.id,
      email: superAdmin.email,
      role: 'super_admin',
      permissions: ['*'], // All permissions
      isSuperAdmin: true
    });

    const refreshToken = AuthController.generateRefreshToken(superAdmin.id);

    return res.json({
      success: true,
      message: 'Super Admin login successful',
      data: {
        user: {
          id: superAdmin.id,
          email: superAdmin.email,
          fullName: superAdmin.full_name,
          role: 'super_admin',
          permissions: ['*']
        },
        tokens: {
          accessToken,
          refreshToken
        },
        dashboardRoute: '/super-admin-dashboard'
      }
    });
  }

  /**
   * Generate Access Token (15 minutes)
   */
  private static generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate Refresh Token (7 days)
   */
  private static generateRefreshToken(userId: string): string {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );
  }

  /**
   * Determine dashboard route based on role
   */
  private static getDashboardRoute(role: string, schemaName: string): string {
    switch (role) {
      case 'admin':
        return '/admin-dashboard';
      case 'semi_admin':
        return '/semi-admin-dashboard';
      case 'doctor':
      case 'dentist':
        return '/dental-dashboard';
      case 'teacher':
        return '/school-dashboard';
      default:
        return '/dashboard';
    }
  }

  /**
   * Refresh Token
   * POST /api/v1/auth/refresh
   */
  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
      ) as { userId: string; type: string };

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token type'
        });
      }

      // TODO: Get user details and generate new access token
      // For now, return success
      return res.json({
        success: true,
        message: 'Token refreshed successfully'
      });

    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
  }

  /**
   * Logout
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response) {
    // In production, implement token blacklisting with Redis
    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  }
}

export default new AuthController();
