import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Get single blog post by slug for public consumption
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const client = await pool.connect();
    
    try {
      // Get published blog post by slug with author information
      const result = await client.query(
        `SELECT 
          b.id, b.title, b.slug, b.content, b.excerpt, b.featured_image, b.tags, b.published_at,
          u.first_name, u.last_name
         FROM blogs b
         LEFT JOIN users u ON b.author_id = u.id
         WHERE b.slug = $1 AND b.status = 'published'`,
        [slug]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ blog: result.rows[0] }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get public blog error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
