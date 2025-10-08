import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken, hashPassword, validateEmail, validatePhone } from '@/lib/auth';

// GET - Get single user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

      // Get user by ID
      const result = await client.query(
        'SELECT id, email, phone, first_name, last_name, is_active, is_admin, is_staff, created_at, updated_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ user: result.rows[0] }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Email, first name, and last name are required' },
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

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (existingUser.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if email is already taken by another user
      const emailCheck = await client.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return NextResponse.json(
          { error: 'Email is already taken by another user' },
          { status: 409 }
        );
      }

      // Build update query
      let updateQuery = `
        UPDATE users 
        SET email = $1, phone = $2, first_name = $3, last_name = $4, is_active = $5, is_admin = $6, is_staff = $7
      `;
      const queryParams = [email, phone || null, first_name, last_name, is_active ?? true, is_admin ?? false, is_staff ?? false];

      // Add password update if provided
      if (password) {
        const hashedPassword = await hashPassword(password);
        updateQuery += `, password = $8`;
        queryParams.push(hashedPassword);
      }

      updateQuery += ` WHERE id = $${queryParams.length + 1} RETURNING id, email, phone, first_name, last_name, is_active, is_admin, is_staff, updated_at`;
      queryParams.push(id);

      const result = await client.query(updateQuery, queryParams);
      const updatedUser = result.rows[0];

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

      // Prevent self-deletion
      if (decoded.userId.toString() === id) {
        return NextResponse.json(
          { error: 'Cannot delete your own account' },
          { status: 400 }
        );
      }

      // Check if user exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE id = $1',
        [id]
      );

      if (existingUser.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Delete user
      await client.query('DELETE FROM users WHERE id = $1', [id]);

      return NextResponse.json({
        message: 'User deleted successfully'
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
