import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET - List all withdrawal requests with pagination
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
      type: 'withdrawal',
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

    // Get withdrawal transactions with user information
    const withdrawals = await prisma.transaction.findMany({
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
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            accountHolder: true
          }
        },
        media: {
          select: {
            fileName: true,
            originalName: true,
            url: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Transform data to match expected format
    const transformedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      amount: withdrawal.amount,
      withdrawal_method: withdrawal.bankAccount?.bankName || 'N/A',
      account_details: withdrawal.bankAccount ? 
        `${withdrawal.bankAccount.bankName} - ${withdrawal.bankAccount.accountNumber} (${withdrawal.bankAccount.accountHolder})` : 
        'N/A',
      mtr_number: withdrawal.mtrNumber,
      status: withdrawal.status,
      admin_notes: withdrawal.adminNotes,
      notes: withdrawal.notes,
      created_at: withdrawal.createdAt,
      updated_at: withdrawal.updatedAt,
      approved_at: withdrawal.approvedAt,
      first_name: withdrawal.user.firstName,
      last_name: withdrawal.user.lastName,
      email: withdrawal.user.email,
      currency: withdrawal.user.currency,
      currency_symbol: withdrawal.user.currency === 'INR' ? '₹' : '$',
    }));

    return NextResponse.json({
      withdrawals: transformedWithdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Withdrawals list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
