import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    // Verify token
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

      // Get dashboard statistics
      const [
        totalUsersResult,
        activeUsersResult,
        pendingDepositsResult,
        pendingWithdrawalsResult,
        publishedNewsResult,
        publishedBlogsResult
      ] = await Promise.all([
        client.query('SELECT COUNT(*) as count FROM users'),
        client.query('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
        client.query('SELECT COUNT(*) as count FROM transactions WHERE type = \'deposit\' AND status IN (\'pending\', \'verification\')'),
        client.query('SELECT COUNT(*) as count FROM transactions WHERE type = \'withdrawal\' AND status IN (\'pending\', \'in_progress\')'),
        client.query('SELECT COUNT(*) as count FROM news WHERE status = \'published\''),
        client.query('SELECT COUNT(*) as count FROM blogs WHERE status = \'published\'')
      ]);

      const stats = {
        totalUsers: parseInt(totalUsersResult.rows[0].count),
        activeUsers: parseInt(activeUsersResult.rows[0].count),
        pendingDeposits: parseInt(pendingDepositsResult.rows[0].count),
        pendingWithdrawals: parseInt(pendingWithdrawalsResult.rows[0].count),
        publishedNews: parseInt(publishedNewsResult.rows[0].count),
        publishedBlogs: parseInt(publishedBlogsResult.rows[0].count)
      };

      return NextResponse.json(stats, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
