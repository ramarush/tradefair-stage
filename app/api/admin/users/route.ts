import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, hashPassword, validateEmail, validatePhone } from '@/lib/auth';

// GET - List all users with pagination
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

    const client = await pool.connect();
    
    try {
      // Check if user is admin or staff
      const userResult = await client.query(
        'SELECT is_admin, is_staff FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0 || (!userResult.rows[0].is_admin && !userResult.rows[0].is_staff)) {
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

      // Build query conditions
      let whereClause = '';
      const queryParams: unknown[] = [];
      let paramCount = 0;

      if (search) {
        paramCount++;
        whereClause += ` WHERE (first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
        queryParams.push(`%${search}%`);
      }

      if (status !== 'all') {
        const statusCondition = status === 'active' ? 'is_active = true' : 'is_active = false';
        if (whereClause) {
          whereClause += ` AND ${statusCondition}`;
        } else {
          whereClause += ` WHERE ${statusCondition}`;
        }
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM users${whereClause}`;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get users
      paramCount++;
      queryParams.push(limit);
      paramCount++;
      queryParams.push(offset);

      const usersQuery = `
        SELECT id, email, phone, first_name, last_name, is_active, is_admin, is_staff, balance, currency, created_at, updated_at
        FROM users
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramCount - 1} OFFSET $${paramCount}
      `;

      const usersResult = await client.query(usersQuery, queryParams);

      return NextResponse.json({
        users: usersResult.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, { status: 200 });

    } finally {
      client.release();
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
