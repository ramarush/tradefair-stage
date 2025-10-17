import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, hashPassword, validateEmail, validatePhone } from '@/lib/auth';
import { Prisma, PrismaClient } from '@prisma/client';

// GET - List all users with pagination

const prisma = new PrismaClient();
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    console.log('client', decoded)

    // Use Prisma instead of pool.connect() to avoid ECONNREFUSED
    try {
      // Check if user is admin or staff
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isAdmin: true, isStaff: true }
      });

      if (!user || (!user.isAdmin && !user.isStaff)) {
        return NextResponse.json(
          { error: 'Access denied. Admin or staff privileges required.' },
          { status: 403 }
        );
      }

      // Get query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || 'all';

      const offset = (page - 1) * limit;

      // Build where conditions
      const where: Prisma.UserWhereInput = {};
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } }
        ];
      }
      if (status !== 'all') {
        where.isActive = status === 'active';
      }

      // Get total count
      const total = await prisma.user.count({ where });

      // Get users
      const users = await prisma.user.findMany({
        where:{
          isAdmin:false,
       
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          balance: true,
          currency: true,
          createdAt: true,
          updatedAt: true,
          isAdmin:true,
          isStaff:true,
          tradingPlatformAccountId:true

        },

        
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });
      return NextResponse.json({
        users: users.map(u => ({
          ...u,
          is_admin: u.isAdmin,
          is_staff: u.isStaff,
          is_active: u.isActive,
          created_at:u.createdAt,
          first_name:u.firstName,
          last_name:u.lastName
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, { status: 200 });

      

    } catch (prismaError: unknown) {
      console.error('Prisma error:', prismaError);
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, phone, first_name, last_name, password, is_admin, is_staff, is_active } = body;

    // Validation
    if (!email || !first_name || !last_name || !password) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and password are required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Check if requesting user is admin
      const userResult = await client.query(
        'SELECT is_admin FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_admin) {
        return NextResponse.json(
          { error: 'Access denied. Admin privileges required.' },
          { status: 403 }
        );
      }

      // Check if email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Insert new user
      const result = await client.query(
        `INSERT INTO users (email, phone, first_name, last_name, password, is_active, is_admin, is_staff) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, email, phone, first_name, last_name, is_active, is_admin, is_staff, created_at`,
        [email, phone || null, first_name, last_name, hashedPassword, is_active ?? true, is_admin ?? false, is_staff ?? false]
      );

      const newUser = result.rows[0];

      return NextResponse.json({
        message: 'User created successfully',
        user: newUser
      }, { status: 201 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
