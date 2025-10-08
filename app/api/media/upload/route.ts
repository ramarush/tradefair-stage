import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type (images only for payment proofs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 5MB.' 
      }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomString}.${fileExtension}`;

    // Create media directory if it doesn't exist (outside public folder for security)
    const mediaDir = join(process.cwd(), 'media');
    try {
      await mkdir(mediaDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }

    // Save file to secure media directory
    const filePath = join(mediaDir, fileName);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // Create media record in database
    const media = await prisma.media.create({
      data: {
        fileName: fileName,
        originalName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        url: `/media/${fileName}`,
        uploadedBy: authResult.user.id,
      },
    });

    return NextResponse.json({
      message: 'File uploaded successfully',
      media: {
        id: media.id,
        fileName: media.fileName,
        originalName: media.originalName,
        url: media.url,
        fileSize: media.fileSize,
        mimeType: media.mimeType,
        createdAt: media.createdAt,
      },
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
