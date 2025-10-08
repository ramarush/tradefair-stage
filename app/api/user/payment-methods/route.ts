import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get available payment methods for user based on amount and transaction count
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

    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Account not found or deactivated' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const type = searchParams.get('type'); // 'bank' or 'upi' or null for all

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Get user's approved transaction count
    const approvedTransactionCount = await prisma.transaction.count({
      where: {
        userId: decoded.userId,
        status: 'approved',
        type:'deposit',
      }
    });

    // Build where clause
    const whereClause: any = {
      isActive: true,
      minAmount: { lte: amount },
      maxAmount: { gte: amount },
      minTransactionsRequired: { lte: approvedTransactionCount }
    };

    if (type && ['bank', 'upi'].includes(type)) {
      whereClause.type = type;
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: whereClause,
      select: {
        id: true,
        type: true,
        accountHolderName: true,
        minAmount: true,
        maxAmount: true,
        expirationTimeMinutes: true,
        // Bank fields
        accountNumber: true,
        ifscCode: true,
        bankName: true,
        // UPI fields
        vpaAddress: true
      },
      orderBy: { type: 'asc' }
    });

    return NextResponse.json({
      paymentMethods: paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        account_holder_name: method.accountHolderName,
        min_amount: Number(method.minAmount),
        max_amount: Number(method.maxAmount),
        expiration_time_minutes: method.expirationTimeMinutes,
        // Bank fields (masked for security)
        account_number: method.accountNumber ? `${method.accountNumber}` : null,
        ifsc_code: method.ifscCode,
        bank_name: method.bankName,
        // UPI fields
        vpa_address: method.vpaAddress
      })),
      user_approved_transactions: approvedTransactionCount
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}