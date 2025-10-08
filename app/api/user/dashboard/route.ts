import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
        balance: true,
        currency: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    const userId = decoded.userId;

    // Get deposit statistics from transactions
    const depositStats = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: 'deposit',
        status: 'completed'
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const pendingDeposits = await prisma.transaction.count({
      where: { 
        userId,
        type: 'deposit',
        status: 'pending'
      },
    });

    const pendingDepositAmount = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: 'deposit',
        status: 'pending'
      },
      _sum: { amount: true },
    });

    // Get withdrawal statistics from transactions
    const withdrawalStats = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: 'withdrawal',
        status: 'completed'
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const pendingWithdrawals = await prisma.transaction.count({
      where: { 
        userId,
        type: 'withdrawal',
        status: 'pending'
      },
    });

    const pendingWithdrawalAmount = await prisma.transaction.aggregate({
      where: { 
        userId,
        type: 'withdrawal',
        status: 'pending'
      },
      _sum: { amount: true },
    });

    // Get recent deposits (last 5)
    


    return NextResponse.json({
      stats: {
        totalDeposits: Number(depositStats._sum.amount || 0),
        totalWithdrawals: Number(withdrawalStats._sum.amount || 0),
        pendingDeposits: pendingDeposits,
        pendingWithdrawals: pendingWithdrawals,
        pendingDepositAmount: Number(pendingDepositAmount._sum.amount || 0),
        pendingWithdrawalAmount: Number(pendingWithdrawalAmount._sum.amount || 0),
        balance: Number(user.balance || 0),
        currency: user.currency || 'USD',
        currency_symbol: user.currency === 'INR' ? '₹' : '$',
      },
      
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}