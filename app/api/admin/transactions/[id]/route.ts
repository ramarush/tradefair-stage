import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch specific transaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user || (!authResult.user.isAdmin && !authResult.user.isStaff)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            currency: true,
            balance: true,
          },
        },
        bankAccount: true,
        media: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({
      transaction: {
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
          balance: Number(transaction.user.balance),
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
      },
    });

  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update transaction status (approve/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user || (!authResult.user.isAdmin && !authResult.user.isStaff)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, adminNotes, mtrNumber } = body;

    // Validation
    if (!status || !['approved', 'rejected', 'completed'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "approved", "rejected", or "completed".' 
      }, { status: 400 });
    }

    // Check if MTR number is unique (if provided)
    if (mtrNumber) {
      const existingTransaction = await prisma.transaction.findFirst({
        where: {
          mtrNumber,
          id: { not: parseInt(id) },
        },
      });

      if (existingTransaction) {
        return NextResponse.json({ 
          error: 'MTR number already exists. Please use a unique MTR number.' 
        }, { status: 400 });
      }
    }

    // Get current transaction
    const currentTransaction = await prisma.transaction.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            balance: true,
          },
        },
      },
    });

    if (!currentTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (currentTransaction.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Only pending transactions can be updated.' 
      }, { status: 400 });
    }

    // Handle balance updates based on transaction type and status
    const result = await prisma.$transaction(async (tx) => {
      let balanceUpdate = {};
      let newClosingBalance = currentTransaction.closingBalance || 0;

      if (status === 'approved' || status === 'completed') {
        if (currentTransaction.type === 'deposit') {
          // For deposits: Add to balance when approved
          balanceUpdate = {
            balance: {
              increment: Number(currentTransaction.amount),
            },
          };
          // Update closing balance to reflect the new balance after deposit
          const currentUser = await tx.user.findUnique({
            where: { id: currentTransaction.userId },
            select: { balance: true },
          });
          if (currentUser) {
            newClosingBalance = Number(currentUser.balance) + Number(currentTransaction.amount);
          }
        }
        // For withdrawals: Balance was already deducted when created, no change needed
      } else if (status === 'rejected') {
        if (currentTransaction.type === 'withdrawal') {
          // For rejected withdrawals: Restore the balance
          balanceUpdate = {
            balance: {
              increment: Number(currentTransaction.amount),
            },
          };
          // Update closing balance to reflect the restored balance
          const currentUser = await tx.user.findUnique({
            where: { id: currentTransaction.userId },
            select: { balance: true },
          });
          if (currentUser) {
            newClosingBalance = Number(currentUser.balance) + Number(currentTransaction.amount);
          }
        }
        // For rejected deposits: closing balance remains the same (original balance before deposit attempt)
      }

      // Update user balance if needed
      if (Object.keys(balanceUpdate).length > 0) {
        await tx.user.update({
          where: { id: currentTransaction.userId },
          data: balanceUpdate,
        });
      }

      // Update transaction with new closing balance
      const updatedTransaction = await tx.transaction.update({
        where: { id: parseInt(id) },
        data: {
          status,
          adminNotes,
          mtrNumber,
          closingBalance: newClosingBalance,
          approvedAt: (status === 'approved' || status === 'completed') ? new Date() : null,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              currency: true,
              balance: true,
            },
          },
          bankAccount: true,
          media: true,
        },
      });

      return updatedTransaction;
    });

    return NextResponse.json({
      message: 'Transaction updated successfully',
      transaction: {
        id: result.id,
        type: result.type,
        amount: Number(result.amount),
        currency: result.currency,
        currency_symbol: result.currency === 'INR' ? '₹' : '$',
        status: result.status,
        notes: result.notes,
        mtrNumber: result.mtrNumber,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: `${result.user.firstName} ${result.user.lastName}`,
          currency: result.user.currency,
          balance: Number(result.user.balance),
        },
        bankAccount: result.bankAccount ? {
          id: result.bankAccount.id,
          bankName: result.bankAccount.bankName,
          accountNumber: result.bankAccount.accountNumber,
          accountHolder: result.bankAccount.accountHolder,
          ifscCode: result.bankAccount.ifscCode,
          routingNumber: result.bankAccount.routingNumber,
          swiftCode: result.bankAccount.swiftCode,
          accountType: result.bankAccount.accountType,
        } : null,
        media: result.media ? {
          id: result.media.id,
          url: result.media.url,
          originalName: result.media.originalName,
          mimeType: result.media.mimeType,
          fileSize: result.media.fileSize,
        } : null,
        adminNotes: result.adminNotes,
        approvedAt: result.approvedAt?.toISOString(),
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
