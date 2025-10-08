import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isAdmin: true, isStaff: true }
    });

    if (!user || (!user.isAdmin && !user.isStaff)) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchId = searchParams.get('searchId');

    // Build where clause
    const where: any = {};
    
    if (searchId) {
      const searchIdNum = parseInt(searchId);
      if (!isNaN(searchIdNum)) {
        where.OR = [
          { id: searchIdNum },
          { userId: searchIdNum }
        ];
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    const [bankAccounts, totalCount] = await Promise.all([
      prisma.bankAccount.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              currency: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.bankAccount.count({ where })
    ]);

    const bankAccountData = bankAccounts.map(account => ({
      id: account.id,
      userId: account.userId,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolder,
      ifscCode: account.ifscCode,
      routingNumber: account.routingNumber,
      swiftCode: account.swiftCode,
      accountType: account.accountType,
      isActive: account.isActive,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      user: {
        id: account.user.id,
        firstName: account.user.firstName,
        lastName: account.user.lastName,
        email: account.user.email,
        currency: account.user.currency || 'USD'
      }
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      bankAccounts: bankAccountData,
      pagination: {
        current: page,
        totalPages,
        total: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in bank accounts API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
