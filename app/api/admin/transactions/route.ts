import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch all transactions for admin
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user || (!authResult.user.isAdmin && !authResult.user.isStaff)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'deposit', 'withdrawal', or null for all
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const whereClause: any = {};

    if (type) {
      whereClause.type = type;
    }

    if (status) {
      whereClause.status = status;
    }

    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            currency: true,
          },
        },
        bankAccount: true,
        media: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    const total = await prisma.transaction.count({
      where: whereClause,
    });

    return NextResponse.json({
      transactions: transactions.map(transaction => ({
        id: transaction.id,
        type: transaction.type,
        amount: Number(transaction.amount),
        currency: transaction.currency,
        currency_symbol: transaction.currency === 'INR' ? '₹' : '$',
        status: transaction.status,
        notes: transaction.notes,
        mtrNumber: transaction.mtrNumber,
        user: {
          id: transaction.user.id,
          email: transaction.user.email,
          name: `${transaction.user.firstName} ${transaction.user.lastName}`,
          currency: transaction.user.currency,
        },
        bankAccount: transaction.bankAccount ? {
          id: transaction.bankAccount.id,
          bankName: transaction.bankAccount.bankName,
          accountNumber: transaction.bankAccount.accountNumber,
          accountHolder: transaction.bankAccount.accountHolder,
          ifscCode: transaction.bankAccount.ifscCode,
          routingNumber: transaction.bankAccount.routingNumber,
          swiftCode: transaction.bankAccount.swiftCode,
          accountType: transaction.bankAccount.accountType,
        } : null,
        media: transaction.media ? {
          id: transaction.media.id,
          url: transaction.media.url,
          originalName: transaction.media.originalName,
          mimeType: transaction.media.mimeType,
          fileSize: transaction.media.fileSize,
        } : null,
        adminNotes: transaction.adminNotes,
        approvedAt: transaction.approvedAt?.toISOString(),
        createdAt: transaction.createdAt.toISOString(),
        updatedAt: transaction.updatedAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
