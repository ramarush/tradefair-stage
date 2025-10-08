import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET - List all blogs with pagination
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
      const status = searchParams.get('status') || 'all';

      const offset = (page - 1) * limit;

      // Build query conditions
      let whereClause = '';
      const queryParams: unknown[] = [];

      if (status !== 'all') {
        whereClause = ' WHERE b.status = $1';
        queryParams.push(status);
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) as total FROM blogs b${whereClause}`;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Add pagination parameters
      queryParams.push(limit, offset);
      const limitOffset = queryParams.length === 3 ? '$2 OFFSET $3' : '$1 OFFSET $2';

      // Get blogs with author information
      const blogsQuery = `
        SELECT 
          b.id, b.title, b.slug, b.excerpt, b.featured_image, b.tags, b.status, b.published_at, b.created_at, b.updated_at,
          u.first_name, u.last_name
        FROM blogs b
        LEFT JOIN users u ON b.author_id = u.id
        ${whereClause}
        ORDER BY b.created_at DESC
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
    console.error('Blogs list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new blog
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

      // Generate slug from title
      const slug = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-') + '-' + Date.now();

      // Check if slug already exists
      const existingBlog = await client.query(
        'SELECT id FROM blogs WHERE slug = $1',
        [slug]
      );

      if (existingBlog.rows.length > 0) {
        return NextResponse.json(
          { error: 'Blog with similar title already exists' },
          { status: 409 }
        );
      }

      // Process tags
      const processedTags = tags ? tags.filter((tag: string) => tag.trim()).map((tag: string) => tag.trim()) : [];

      // Insert new blog
      const publishedAt = status === 'published' ? new Date() : null;
      
      const result = await client.query(
        `INSERT INTO blogs (title, slug, content, excerpt, featured_image, tags, status, author_id, published_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
         RETURNING id, title, slug, excerpt, featured_image, tags, status, published_at, created_at`,
        [title, slug, content, excerpt || null, featured_image || null, processedTags, status || 'draft', decoded.userId, publishedAt]
      );

      const newBlog = result.rows[0];

      return NextResponse.json({
        message: 'Blog created successfully',
        blog: newBlog
      }, { status: 201 });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Create blog error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
