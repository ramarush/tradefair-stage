import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Use centralized authentication
    const auth = await requireAuth(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const user = auth.user; // User is now available and verified

    // Get total counts from unified transactions table
    const totalDeposits = await prisma.transaction.count({
      where: { type: 'deposit' }
    });
    const totalWithdrawals = await prisma.transaction.count({
      where: { type: 'withdrawal' }
    });

    // Get pending counts
    const pendingDeposits = await prisma.transaction.count({
      where: { type: 'deposit', status: 'pending' }
    });
    const pendingWithdrawals = await prisma.transaction.count({
      where: { type: 'withdrawal', status: 'pending' }
    });

    // Get last deposit and withdrawal IDs for change detection
    const lastDeposit = await prisma.transaction.findFirst({
      where: { type: 'deposit' },
      orderBy: { id: 'desc' },
      select: { id: true }
    });
    const lastWithdrawal = await prisma.transaction.findFirst({
      where: { type: 'withdrawal' },
      orderBy: { id: 'desc' },
      select: { id: true }
    });

    const stats = {
      totalDeposits,
      totalWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      lastDepositId: lastDeposit?.id,
      lastWithdrawalId: lastWithdrawal?.id,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Real-time stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
