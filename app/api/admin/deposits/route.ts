import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List all deposit requests with pagination
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

    // Check if user is admin or staff
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isAdmin: true, isStaff: true }
    });

    if (!user || (!user.isAdmin && !user.isStaff)) {
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
    const search = searchParams.get('search') || '';

    const skip = (page - 1) * limit;

    // Build where clause for transactions table
    const where: any = {
      type: 'deposit',
      ...(status !== 'all' ? { status } : {})
    };

    // Add search functionality
    if (search.trim()) {
      where.OR = [
        {
          mtrNumber: {
            contains: search.trim(),
            mode: 'insensitive'
          }
        },
        {
          user: {
            OR: [
              {
                firstName: {
                  contains: search.trim(),
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: search.trim(),
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: search.trim(),
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ];
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get deposit transactions with user information
    const deposits = await prisma.transaction.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            currency: true
          }
        },
        media: {
          select: {
            fileName: true,
            originalName: true,
            url: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Transform data to match expected format
    const transformedDeposits = deposits.map(deposit => ({
      id: deposit.id,
      amount: deposit.amount,
      payment_method: deposit.media?.originalName ? 'File Upload' : 'Manual',
      mtr_number: deposit.mtrNumber,
      status: deposit.status,
      notes: deposit.notes,
      admin_notes: deposit.adminNotes,
      created_at: deposit.createdAt,
      updated_at: deposit.updatedAt,
      approved_at: deposit.approvedAt,
      first_name: deposit.user.firstName,
      last_name: deposit.user.lastName,
      email: deposit.user.email,
      currency: deposit.user.currency,
      currency_symbol: deposit.user.currency === 'INR' ? '₹' : '$',
      media_url: deposit.media?.url,
      media_filename: deposit.media?.fileName,
    }));

    return NextResponse.json({
      deposits: transformedDeposits,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Deposits list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}