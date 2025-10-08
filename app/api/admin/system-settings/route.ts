import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch system settings
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      settings: settings?.settings || {}
    });

  } catch (error: any) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// POST - Create or update system settings
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Get existing settings or create new one
    const existingSettings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    let result;
    if (existingSettings) {
      // Update existing settings
      result = await prisma.systemSettings.update({
        where: { id: existingSettings.id },
        data: { settings }
      });
    } else {
      // Create new settings
      result = await prisma.systemSettings.create({
        data: { settings }
      });
    }

    return NextResponse.json({
      message: 'System settings updated successfully',
      settings: result.settings
    });

  } catch (error: any) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}
