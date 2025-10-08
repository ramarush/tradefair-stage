import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Get single news article by slug for public consumption
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  try {
    const client = await pool.connect();
    
    try {
      // Get published news article by slug with author information
      const result = await client.query(
        `SELECT 
          n.id, n.title, n.slug, n.content, n.excerpt, n.featured_image, n.published_at,
          u.first_name, u.last_name
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         WHERE n.slug = $1 AND n.status = 'published'`,
        [slug]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'News article not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ news: result.rows[0] }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Get public news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
