import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production-2024';

export interface User {
  id: number;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_admin: boolean;
  is_staff: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserRegistration {
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  password: string;
  currency?: string;
  // UTM tracking fields for marketing attribution
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  campaign_id?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (userId: number): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
};

export const verifyToken = (token: string): { userId: number } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    console.log("decoded",decoded);
    return decoded;
  } catch (error) {
    console.log("error",error);
    return null;
  }
};

// Secure authentication and authorization utility
export const authenticateAndAuthorize = async (request: Request, requiredRoles?: ('admin' | 'staff')[]): Promise<{
  success: boolean;
  user?: User;
  error?: string;
}> => {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'Unauthorized - No token provided' };
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return { success: false, error: 'Unauthorized - Invalid token' };
    }

    // Import Prisma here to avoid circular dependencies
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Fetch user from database to get current roles and status
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isAdmin: true,
          isStaff: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      if (!user.isActive) {
        return { success: false, error: 'Account is inactive' };
      }

      // Check role requirements if specified
      if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => {
          if (role === 'admin') return user.isAdmin;
          if (role === 'staff') return user.isStaff;
          return false;
        });

        if (!hasRequiredRole) {
          return { success: false, error: 'Insufficient permissions' };
        }
      }

      // Map to expected interface
      const mappedUser: User = {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        is_active: user.isActive,
        is_admin: user.isAdmin,
        is_staff: user.isStaff,
        created_at: user.createdAt,
        updated_at: user.updatedAt
      };

      return { success: true, user: mappedUser };
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Internal authentication error' };
  }
};

export const verifyTokenLegacy = (token: string): { id: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === 'object' && decoded !== null && 'id' in decoded && 'email' in decoded) {
      return decoded as { id: string; email: string };
    }
    return null;
  } catch (error) {
    return null;
  }
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

export const validatePassword = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' };
  }
  return { isValid: true, message: 'Password is valid' };
};

// ===== CENTRALIZED AUTH UTILITY =====

// 🎯 ONE-LINE AUTHENTICATION for API routes!
// Usage: const auth = await authenticateUser(request, ['admin', 'staff']);
export const authenticateUser = async (request: NextRequest | Request, requiredRoles: string[] = ['user']) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    
    console.log('authHeader', authHeader?.startsWith('Bearer '))
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Authentication required - No token provided',
        user: null
      };
    }

    // Extract and verify token
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return {
        success: false,
        error: 'Authentication failed - Invalid token',
        user: null
      };
    }

    // Fetch user from database with current roles
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isAdmin: true,
          isStaff: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'User not found',
          user: null
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Account is not active',
          user: null
        };
      }

      // Check role permissions
      const hasPermission = requiredRoles.some(role => {
        switch (role) {
          case 'admin':
            return user.isAdmin;
          case 'staff':
            return user.isStaff;
          case 'user':
            return true; // Any authenticated user
          default:
            return false;
        }
      });

      if (!hasPermission) {
        return {
          success: false,
          error: 'Insufficient permissions',
          user: null
        };
      }

      return {
        success: true,
        error: null,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
          isStaff: user.isStaff,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      user: null
    };
  }
};

// Alias for backward compatibility
export const requireAuth = authenticateUser;
