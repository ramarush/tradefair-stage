import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    try {
      // Get user profile (excluding password)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isAdmin: true,
          isStaff: true,
          createdAt: true,
          currency: true,
          tradingPlatformUserId: true,
          tradingPlatformAccountId: true
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      // Check if user is active
      if (!user.isActive) {
        return NextResponse.json(
          { error: 'Account is deactivated' },
          { status: 403 }
        );
      }

      // Map Prisma field names to API response format
      const userResponse = {
        id: user.id,
        email: user.email,
        phone: user.phone,
        first_name: user.firstName,
        last_name: user.lastName,
        is_active: user.isActive,
        is_admin: user.isAdmin,
        is_staff: user.isStaff,
        created_at: user.createdAt,
        currency: user.currency,
        trading_platform_user_id: user.tradingPlatformUserId,
        trading_platform_account_id: user.tradingPlatformAccountId,
      };

      return NextResponse.json({ user: userResponse }, { status: 200 });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const { first_name, last_name, phone } = await request.json();

    // Validate input
    if (!first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    try {
      // Check if user exists and is active
      const existingUser = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (!existingUser || !existingUser.isActive) {
        return NextResponse.json(
          { error: 'User not found or account deactivated' },
          { status: 404 }
        );
      }

      // Update user profile
      const updatedUser = await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          firstName: first_name,
          lastName: last_name,
          phone: phone,
        },
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isAdmin: true,
          isStaff: true,
          createdAt: true,
        },
      });

      // Map Prisma field names to API response format
      const userResponse = {
        id: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        first_name: updatedUser.firstName,
        last_name: updatedUser.lastName,
        is_active: updatedUser.isActive,
        is_admin: updatedUser.isAdmin,
        is_staff: updatedUser.isStaff,
        created_at: updatedUser.createdAt,
      };

      return NextResponse.json({ 
        message: 'Profile updated successfully',
        user: userResponse 
      }, { status: 200 });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
