import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - List all payment methods
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
    const type = searchParams.get('type'); // 'bank' or 'upi'
    const isActive = searchParams.get('active');

    // Build where clause
    const whereClause: any = {};
    if (type) {
      whereClause.type = type;
    }
    if (isActive !== null) {
      whereClause.isActive = isActive === 'true';
    }

    const paymentMethods = await prisma.paymentMethod.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      paymentMethods: paymentMethods.map(method => ({
        id: method.id,
        type: method.type,
        account_holder_name: method.accountHolderName,
        min_amount: Number(method.minAmount),
        max_amount: Number(method.maxAmount),
        min_transactions_required: method.minTransactionsRequired,
        expiration_time_minutes: method.expirationTimeMinutes,
        is_active: method.isActive,
        // Bank-specific fields
        account_number: method.accountNumber,
        ifsc_code: method.ifscCode,
        bank_name: method.bankName,
        // UPI-specific fields
        vpa_address: method.vpaAddress,
        created_at: method.createdAt,
        updated_at: method.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new payment method
export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isAdmin: true }
    });

    if (!user || !user.isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin privileges required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      account_holder_name,
      min_amount,
      max_amount,
      min_transactions_required = 0,
      expiration_time_minutes = 30,
      // Bank fields
      account_number,
      ifsc_code,
      bank_name,
      // UPI fields
      vpa_address
    } = body;

    // Validation
    if (!type || !['bank', 'upi'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "bank" or "upi"' },
        { status: 400 }
      );
    }

    if (!account_holder_name) {
      return NextResponse.json(
        { error: 'Account holder name is required' },
        { status: 400 }
      );
    }

    if (!min_amount || !max_amount || min_amount <= 0 || max_amount <= min_amount) {
      return NextResponse.json(
        { error: 'Valid min and max amounts are required (max > min > 0)' },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (type === 'bank') {
      if (!account_number || !ifsc_code || !bank_name) {
        return NextResponse.json(
          { error: 'Account number, IFSC code, and bank name are required for bank payment methods' },
          { status: 400 }
        );
      }
    } else if (type === 'upi') {
      if (!vpa_address) {
        return NextResponse.json(
          { error: 'VPA address is required for UPI payment methods' },
          { status: 400 }
        );
      }
    }

    const paymentMethod = await prisma.paymentMethod.create({
      data: {
        type,
        accountHolderName: account_holder_name,
        minAmount: min_amount,
        maxAmount: max_amount,
        minTransactionsRequired: min_transactions_required,
        expirationTimeMinutes: expiration_time_minutes,
        // Bank fields
        accountNumber: type === 'bank' ? account_number : null,
        ifscCode: type === 'bank' ? ifsc_code : null,
        bankName: type === 'bank' ? bank_name : null,
        // UPI fields
        vpaAddress: type === 'upi' ? vpa_address : null,
      }
    });

    return NextResponse.json({
      message: 'Payment method created successfully',
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        account_holder_name: paymentMethod.accountHolderName,
        min_amount: Number(paymentMethod.minAmount),
        max_amount: Number(paymentMethod.maxAmount),
        min_transactions_required: paymentMethod.minTransactionsRequired,
        expiration_time_minutes: paymentMethod.expirationTimeMinutes,
        is_active: paymentMethod.isActive,
        account_number: paymentMethod.accountNumber,
        ifsc_code: paymentMethod.ifscCode,
        bank_name: paymentMethod.bankName,
        vpa_address: paymentMethod.vpaAddress,
        created_at: paymentMethod.createdAt,
        updated_at: paymentMethod.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}