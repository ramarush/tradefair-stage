import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - List published blogs for public consumption
export async function GET(request: NextRequest) {
  try {
    const client = await pool.connect();
    
    try {
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const tag = searchParams.get('tag');

      const offset = (page - 1) * limit;

      // Build query conditions
      let whereClause = 'WHERE b.status = $1';
      const queryParams: unknown[] = ['published'];

      if (tag) {
        whereClause += ' AND $2 = ANY(b.tags)';
        queryParams.push(tag);
      }

      // Get total count of published blogs
      const countQuery = `SELECT COUNT(*) as total FROM blogs b ${whereClause}`;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Add pagination parameters
      queryParams.push(limit, offset);
      const limitOffset = `$${queryParams.length - 1} OFFSET $${queryParams.length}`;

      // Get published blogs with author information
      const blogsQuery = `
        SELECT 
          b.id, b.title, b.slug, b.excerpt, b.featured_image, b.tags, b.published_at,
          u.first_name, u.last_name
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        ${whereClause}
        ORDER BY b.published_at DESC
        LIMIT ${limitOffset}
      `;

      const blogsResult = await client.query(blogsQuery, queryParams);

      return NextResponse.json({
        blogs: blogsResult.rows,
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
    console.error('Public blogs list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
