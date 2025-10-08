import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - Get single blog post
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

      // Get blog post with author information
      const result = await client.query(
        `SELECT 
          b.id, b.title, b.slug, b.content, b.excerpt, b.featured_image, b.tags, b.status, b.published_at, b.created_at, b.updated_at,
          u.first_name, u.last_name
         FROM blogs b
         LEFT JOIN users u ON b.author_id = u.id
         WHERE b.id = $1`,
        [id]
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
    console.error('Get blog error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update blog post
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
    const { title, content, excerpt, featured_image, tags, status } = body;

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

      // Check if blog exists
      const existingBlog = await client.query(
        'SELECT id, status FROM blogs WHERE id = $1',
        [id]
      );

      if (existingBlog.rows.length === 0) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      // Process tags
      const processedTags = tags ? tags.filter((tag: string) => tag.trim()).map((tag: string) => tag.trim()) : [];

      // Update published_at if status changes to published
      const currentStatus = existingBlog.rows[0].status;
      const publishedAt = (status === 'published' && currentStatus !== 'published') ? new Date() : undefined;

      // Build update query
      let updateQuery = `
        UPDATE blogs 
        SET title = $1, content = $2, excerpt = $3, featured_image = $4, tags = $5, status = $6
      `;
      const queryParams = [title, content, excerpt || null, featured_image || null, processedTags, status || 'draft'];

      if (publishedAt) {
        updateQuery += `, published_at = $7`;
        queryParams.push(publishedAt);
      }

      updateQuery += ` WHERE id = $${queryParams.length + 1} RETURNING id, title, slug, excerpt, featured_image, tags, status, published_at, updated_at`;
      queryParams.push(id);

      const result = await client.query(updateQuery, queryParams);
      const updatedBlog = result.rows[0];

      return NextResponse.json({
        message: 'Blog post updated successfully',
        blog: updatedBlog
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Update blog error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post
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

      // Check if blog exists
      const existingBlog = await client.query(
        'SELECT id FROM blogs WHERE id = $1',
        [id]
      );

      if (existingBlog.rows.length === 0) {
        return NextResponse.json(
          { error: 'Blog post not found' },
          { status: 404 }
        );
      }

      // Delete blog
      await client.query('DELETE FROM blogs WHERE id = $1', [id]);

      return NextResponse.json({
        message: 'Blog post deleted successfully'
      }, { status: 200 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Delete blog error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
