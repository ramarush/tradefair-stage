import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Get single payment method
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const paymentMethodId = parseInt(id);
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
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
    });

  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update payment method
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const paymentMethodId = parseInt(id);
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      account_holder_name,
      min_amount,
      max_amount,
      min_transactions_required,
      expiration_time_minutes,
      is_active,
      // Bank fields
      account_number,
      ifsc_code,
      bank_name,
      // UPI fields
      vpa_address
    } = body;

    // Check if payment method exists
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Validation
    if (min_amount && max_amount && (min_amount <= 0 || max_amount <= min_amount)) {
      return NextResponse.json(
        { error: 'Valid min and max amounts are required (max > min > 0)' },
        { status: 400 }
      );
    }

    // Type-specific validation
    if (existingMethod.type === 'bank') {
      if (account_number !== undefined && !account_number) {
        return NextResponse.json(
          { error: 'Account number is required for bank payment methods' },
          { status: 400 }
        );
      }
      if (ifsc_code !== undefined && !ifsc_code) {
        return NextResponse.json(
          { error: 'IFSC code is required for bank payment methods' },
          { status: 400 }
        );
      }
      if (bank_name !== undefined && !bank_name) {
        return NextResponse.json(
          { error: 'Bank name is required for bank payment methods' },
          { status: 400 }
        );
      }
    } else if (existingMethod.type === 'upi') {
      if (vpa_address !== undefined && !vpa_address) {
        return NextResponse.json(
          { error: 'VPA address is required for UPI payment methods' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (account_holder_name !== undefined) updateData.accountHolderName = account_holder_name;
    if (min_amount !== undefined) updateData.minAmount = min_amount;
    if (max_amount !== undefined) updateData.maxAmount = max_amount;
    if (min_transactions_required !== undefined) updateData.minTransactionsRequired = min_transactions_required;
    if (expiration_time_minutes !== undefined) updateData.expirationTimeMinutes = expiration_time_minutes;
    if (is_active !== undefined) updateData.isActive = is_active;

    // Type-specific updates
    if (existingMethod.type === 'bank') {
      if (account_number !== undefined) updateData.accountNumber = account_number;
      if (ifsc_code !== undefined) updateData.ifscCode = ifsc_code;
      if (bank_name !== undefined) updateData.bankName = bank_name;
    } else if (existingMethod.type === 'upi') {
      if (vpa_address !== undefined) updateData.vpaAddress = vpa_address;
    }

    const paymentMethod = await prisma.paymentMethod.update({
      where: { id: paymentMethodId },
      data: updateData
    });

    return NextResponse.json({
      message: 'Payment method updated successfully',
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
    });

  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete payment method
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

    const paymentMethodId = parseInt(id);
    if (isNaN(paymentMethodId)) {
      return NextResponse.json(
        { error: 'Invalid payment method ID' },
        { status: 400 }
      );
    }

    // Check if payment method exists
    const existingMethod = await prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId }
    });

    if (!existingMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }

    // Check if there are any transactions using this payment method
    const transactionCount = await prisma.transaction.count({
      where: { paymentMethodId: paymentMethodId }
    });

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete payment method that has been used in transactions. Consider deactivating instead.' },
        { status: 400 }
      );
    }

    await prisma.paymentMethod.delete({
      where: { id: paymentMethodId }
    });

    return NextResponse.json({
      message: 'Payment method deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}