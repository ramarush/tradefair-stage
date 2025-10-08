import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Get single news article
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

      // Get news article with author information
      const result = await client.query(
        `SELECT 
          n.id, n.title, n.slug, n.content, n.excerpt, n.featured_image, n.status, n.published_at, n.created_at, n.updated_at,
          u.first_name, u.last_name
         FROM news n
         LEFT JOIN users u ON n.author_id = u.id
         WHERE n.id = $1`,
        [id]
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
    console.error('Get news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update news article
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
    const { title, content, excerpt, featured_image, status } = body;

    // Validation
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
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

      // Check if news exists
      const existingNews = await client.query(
        'SELECT id, status FROM news WHERE id = $1',
        [id]
      );

      if (existingNews.rows.length === 0) {
        return NextResponse.json(
          { error: 'News article not found' },
          { status: 404 }
        );
      }

      // Update published_at if status changes to published
      const currentStatus = existingNews.rows[0].status;
      const publishedAt = (status === 'published' && currentStatus !== 'published') ? new Date() : undefined;

      // Build update query
      let updateQuery = `
        UPDATE news 
        SET title = $1, content = $2, excerpt = $3, featured_image = $4, status = $5
      `;
      const queryParams = [title, content, excerpt || null, featured_image || null, status || 'draft'];

      if (publishedAt) {
        updateQuery += `, published_at = $6`;
        queryParams.push(publishedAt);
      }

      updateQuery += ` WHERE id = $${queryParams.length + 1} RETURNING id, title, slug, excerpt, featured_image, status, published_at, updated_at`;
      queryParams.push(id);

      const result = await client.query(updateQuery, queryParams);
      const updatedNews = result.rows[0];

      return NextResponse.json({
        message: 'News article updated successfully',
        news: updatedNews
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete news article
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
      // Check if user is admin
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

      // Check if news exists
      const existingNews = await client.query(
        'SELECT id FROM news WHERE id = $1',
        [id]
      );

      if (existingNews.rows.length === 0) {
        return NextResponse.json(
          { error: 'News article not found' },
          { status: 404 }
        );
      }

      // Delete news
      await client.query('DELETE FROM news WHERE id = $1', [id]);

      return NextResponse.json({
        message: 'News article deleted successfully'
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
