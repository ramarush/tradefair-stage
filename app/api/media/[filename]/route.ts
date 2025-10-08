import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { authenticateUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  try {
    // For image requests, try multiple authentication methods
    // since browsers can't send custom headers when loading images via <img> tags
    let isAuthenticated = false;
    
    // Method 1: Try Authorization header (for API calls)
    const authResult = await authenticateUser(request);
    if (authResult.success && authResult.user) {
      isAuthenticated = true;
    } else {
      // Method 2: Try token from query parameter (for image loading)
      const { searchParams } = new URL(request.url);
      const tokenFromQuery = searchParams.get('token');
      
      if (tokenFromQuery) {
        const { verifyToken } = await import('@/lib/auth');
        const decoded = verifyToken(tokenFromQuery);
        if (decoded) {
          isAuthenticated = true;
        }
      }
    }
    
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    
    // Security: Validate filename to prevent directory traversal attacks
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    // Read file from secure media directory
    const filePath = join(process.cwd(), 'media', filename);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on file extension
      const ext = filename.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'webp':
          contentType = 'image/webp';
          break;
      }

      // Return file with appropriate headers
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'private, max-age=3600', // Cache for 1 hour but only for authenticated user
          'Content-Disposition': 'inline', // Display in browser instead of downloading
        },
      });
    } catch (fileError) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error serving media file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
