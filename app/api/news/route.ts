import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - List published news for public consumption
export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    
    try {
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');

      const offset = (page - 1) * limit;

      // Get total count of published news
      const countResult = await client.query(
        'SELECT COUNT(*) as total FROM news WHERE status = $1',
        ['published']
      );
      const total = parseInt(countResult.rows[0].total);

      // Get published news with author information
      const newsResult = await client.query(
        `SELECT 
          n.id, n.title, n.slug, n.excerpt, n.featured_image, n.published_at,
          u.first_name, u.last_name
        FROM news n
        LEFT JOIN users u ON n.author_id = u.id
        WHERE n.status = $1
        ORDER BY n.published_at DESC
        LIMIT $2 OFFSET $3`,
        ['published', limit, offset]
      );

      return NextResponse.json({
        news: newsResult.rows,
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
    console.error('Public news list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
