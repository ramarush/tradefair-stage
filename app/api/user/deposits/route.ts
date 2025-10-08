import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

// POST - Create deposit request
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

    const { amount, bank_id, notes } = await request.json();

    // Validate input
    if (!amount || amount < 1) {
      return NextResponse.json(
        { error: 'Amount must be at least $1.00' },
        { status: 400 }
      );
    }

    if (!bank_id) {
      return NextResponse.json(
        { error: 'Bank ID is required' },
        { status: 400 }
      );
    }

    try {
      // Check if user is active and get trading platform user ID
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { 
          id: true, 
          isActive: true, 
          currency: true,
          tradingPlatformUserId: true 
        },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Account not found or deactivated' },
          { status: 403 }
        );
      }

      if (!user.tradingPlatformUserId) {
        return NextResponse.json(
          { error: 'Trading platform account not found. Please contact support.' },
          { status: 400 }
        );
      }

      // Create deposit request on trading platform first
      const tradingPlatformResult = await tradingPlatformApi.createDepositRequest({
        amount: amount,
        bankId: bank_id,
        comment: notes || `Deposit request for $${amount}`,
        tradingPlatformUserId: user.tradingPlatformUserId,
      });

      if (!tradingPlatformResult.success) {
        return NextResponse.json(
          { error: `Trading platform error: ${tradingPlatformResult.message}` },
          { status: 400 }
        );
      }

      // Only create transaction if trading platform request was successful
      const transaction = await prisma.transaction.create({
        data: {
          userId: decoded.userId,
          type: 'deposit',
          amount: amount,
          currency: user.currency || 'USD',
          status: 'pending',
          notes: notes,
          bankId: bank_id,
          tradingPlatformRequestId: tradingPlatformResult.requestId,
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          notes: true,
          tradingPlatformRequestId: true,
          createdAt: true,
        },
      });

      return NextResponse.json({
        message: 'Deposit request created successfully',
        deposit: {
          id: transaction.id,
          amount: Number(transaction.amount),
          currency: transaction.currency,
          status: transaction.status,
          notes: transaction.notes,
          trading_platform_request_id: transaction.tradingPlatformRequestId,
          created_at: transaction.createdAt,
        },
        trading_platform: {
          success: true,
          request_id: tradingPlatformResult.requestId,
          message: tradingPlatformResult.message,
        }
      }, { status: 201 });

    } catch (dbError) {
      console.error('Create deposit request error:', dbError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Create deposit request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - List user's deposit requests
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

    try {
      // Check if user is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true },
      });

      if (!user || !user.isActive) {
        return NextResponse.json(
          { error: 'Account not found or deactivated' },
          { status: 403 }
        );
      }

      // Build where clause for filtering
      const whereClause: any = {
        userId: decoded.userId,
        type: 'deposit',
      };

      // Add status filter if provided
      if (status) {
        whereClause.status = status;
      }

      // Get total count for pagination
      const total = await prisma.transaction.count({
        where: whereClause,
      });

      // Get user's deposit transactions with pagination
      const deposits = await prisma.transaction.findMany({
        where: whereClause,
        select: {
          id: true,
          amount: true,
          currency: true,
          notes: true,
          status: true,
          adminNotes: true,
          tradingPlatformRequestId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      });

      // Map Prisma field names to API response format
      const depositsResponse = deposits.map((deposit: any) => ({
        id: deposit.id,
        amount: Number(deposit.amount),
        currency: deposit.currency,
        notes: deposit.notes,
        status: deposit.status,
        admin_notes: deposit.adminNotes,
        trading_platform_request_id: deposit.tradingPlatformRequestId,
        created_at: deposit.createdAt,
        updated_at: deposit.updatedAt,
      }));

      return NextResponse.json({
        deposits: depositsResponse,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }, { status: 200 });

    } catch (dbError) {
      console.error('Get deposits error:', dbError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Get deposits error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}