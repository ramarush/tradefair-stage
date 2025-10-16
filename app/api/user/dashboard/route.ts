import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

// GET - Get user dashboard data
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

    const userId = decoded.userId;

    // Fire all independent queries concurrently
    const [
      user,
      depositStats,
      withdrawalStats,
      pendingDeposits,
      pendingWithdrawals,
      pendingDepositAmount,
      pendingWithdrawalAmount,
    ] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          balance: true,
          currency: true,
          tradingPlatformUserId: true,
          tradingPlatformAccountId: true,
        },
      }),

      // Deposit stats
      prisma.transaction.aggregate({
        where: { userId, type: 'deposit', status: 'completed' },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Withdrawal stats
      prisma.transaction.aggregate({
        where: { userId, type: 'withdrawal', status: 'completed' },
        _sum: { amount: true },
        _count: { id: true },
      }),

      // Pending deposits count
      prisma.transaction.count({
        where: { userId, type: 'deposit', status: 'pending' },
      }),

      // Pending withdrawals count
      prisma.transaction.count({
        where: { userId, type: 'withdrawal', status: 'pending' },
      }),

      // Pending deposit amount
      prisma.transaction.aggregate({
        where: { userId, type: 'deposit', status: 'pending' },
        _sum: { amount: true },
      }),

      // Pending withdrawal amount
      prisma.transaction.aggregate({
        where: { userId, type: 'withdrawal', status: 'pending' },
        _sum: { amount: true },
      }),
    ]);

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Fetch real-time balance in parallel with response preparation
    const tradingPlatformUserId = user.tradingPlatformUserId || 0;
    const balancePromise = tradingPlatformApi
      .getCurrentBalance(tradingPlatformUserId)
      .then((res) => (res.success ? res.balances?.[tradingPlatformUserId] || 0 : 0))
      .catch(() => 0);

    // Prepare stats object while balance is being fetched
    const stats = {
      totalDeposits: Number(depositStats._sum.amount || 0),
      totalWithdrawals: Number(withdrawalStats._sum.amount || 0),
      pendingDeposits,
      pendingWithdrawals,
      pendingDepositAmount: Number(pendingDepositAmount._sum.amount || 0),
      pendingWithdrawalAmount: Number(pendingWithdrawalAmount._sum.amount || 0),
      balance: Number(user.balance || 0), // fallback to DB balance
      currency: user.currency || 'USD',
      currency_symbol: user.currency === 'INR' ? '₹' : '$',
    };

    // Await real-time balance
    const currentBalance = await balancePromise;

    // Update balance in stats
    stats.balance = Number(currentBalance);

    // Fire-and-forget DB update (no await)
    prisma.user
      .update({ where: { id: userId }, data: { balance: currentBalance } })
      .catch(() => {}); // silent fail

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}