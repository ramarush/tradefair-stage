/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Create withdrawal request
export async function POST(request: NextRequest) {
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

    const { amount, withdrawal_method, account_details, notes } = await request.json();

    // Validate input
    if (!amount || amount < 10) {
      return NextResponse.json(
        { error: 'Amount must be at least $10.00' },
        { status: 400 }
      );
    }

    if (!withdrawal_method) {
      return NextResponse.json(
        { error: 'Withdrawal method is required' },
        { status: 400 }
      );
    }

    if (!account_details) {
      return NextResponse.json(
        { error: 'Account details are required' },
        { status: 400 }
      );
    }

    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Account not found or deactivated' },
        { status: 403 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        userId: decoded.userId,
        amount: parseFloat(amount.toString()),
        withdrawalMethod: withdrawal_method,
        accountDetails: account_details,
        notes: notes || null,
        status: 'pending'
      },
      select: {
        id: true,
        amount: true,
        withdrawalMethod: true,
        status: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal
    }, { status: 201 });

  } catch (error) {
    console.error('Create withdrawal request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List user's withdrawal requests
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Check if user is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true }
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Account not found or deactivated' },
        { status: 403 }
      );
    }

    // Build query conditions
    const whereCondition: any = {
      userId: decoded.userId
    };

    if (status && status !== 'all') {
      whereCondition.status = status;
    }

    // Get total count
    const total = await prisma.withdrawalRequest.count({
      where: whereCondition
    });

    // Get withdrawal requests with pagination
    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: whereCondition,
      select: {
        id: true,
        amount: true,
        withdrawalMethod: true,
        accountDetails: true,
        status: true,
        notes: true,
        adminNotes: true,
        mtrNumber: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Map field names back to snake_case for API response consistency
    const mappedWithdrawals = withdrawals.map(withdrawal => ({
      id: withdrawal.id,
      amount: withdrawal.amount,
      withdrawal_method: withdrawal.withdrawalMethod,
      account_details: withdrawal.accountDetails,
      status: withdrawal.status,
      notes: withdrawal.notes,
      admin_notes: withdrawal.adminNotes,
      mtr_number: withdrawal.mtrNumber,
      created_at: withdrawal.createdAt,
      updated_at: withdrawal.updatedAt
    }));

    return NextResponse.json({
      withdrawals: mappedWithdrawals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
