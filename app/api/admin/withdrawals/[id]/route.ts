import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';
import { emailService } from '@/lib/emailService';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

const prisma = new PrismaClient();

// PUT - Update withdrawal request status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const resolvedParams = await params;
    const body = await request.json();
    const { status, mtr_number, admin_notes } = body;

    // Validation
    const validStatuses = ['pending', 'verification', 'completed', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, verification, completed, rejected' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      status,
      mtrNumber: mtr_number || null,
      adminNotes: admin_notes || null
    };

    // Set approvedAt timestamp when status is 'completed' (client requirement)
    if (status === 'completed') {
      updateData.approvedAt = new Date();
    }

    // Get withdrawal details first to check for trading platform integration
    const withdrawalForTradingPlatform = await prisma.transaction.findUnique({
      where: { 
        id: parseInt(resolvedParams.id),
        type: 'withdrawal'
      },
      select: {
        tradingPlatformRequestId: true,
        status: true,
        amount: true,
        currency: true,
        user: {
          select: {
            tradingPlatformAccountId: true,
            tradingPlatformUserId: true,
            currency: true
          }
        }
      }
    });

    // Call trading platform API for completed (approved) status - use transfer money API
    if (status === 'completed' && withdrawalForTradingPlatform?.user.tradingPlatformAccountId && withdrawalForTradingPlatform?.user.tradingPlatformUserId) {
      try {
        const transferResult = await tradingPlatformApi.transferMoney({
          receiverAccountId: withdrawalForTradingPlatform.user.tradingPlatformAccountId, // Will be overridden by main account ID
          senderUserId: withdrawalForTradingPlatform.user.tradingPlatformUserId,
          amount: Number(withdrawalForTradingPlatform.amount),
          currency: withdrawalForTradingPlatform.user.currency || 'USD',
          isWithdrawal: true // Flag to indicate this is a withdrawal (user to main account)
        });

        if (!transferResult.success) {
          return NextResponse.json(
            { error: `Money transfer failed: ${transferResult.message}` },
            { status: 400 }
          );
        }

        console.log('Trading platform money transfer successful (withdrawal):', transferResult.message);
      } catch (error) {
        console.error('Trading platform money transfer failed:', error);
        return NextResponse.json(
          { error: 'Failed to process withdrawal on trading platform' },
          { status: 500 }
        );
      }
    }

    // Handle balance reversal for rejected withdrawals
    let updatedWithdrawal;
    if (status === 'rejected') {
      // Use transaction to ensure atomicity
      updatedWithdrawal = await prisma.$transaction(async (tx) => {
        // First, get the withdrawal transaction to get the amount and user
        const withdrawal = await tx.transaction.findUnique({
          where: { 
            id: parseInt(resolvedParams.id),
            type: 'withdrawal'
          },
          include: {
            user: true
          }
        });

        if (!withdrawal) {
          throw new Error('Withdrawal transaction not found');
        }

        // Check if withdrawal is already rejected to prevent double reversal
        if (withdrawal.status === 'rejected') {
          throw new Error('Withdrawal is already rejected');
        }

        // Update the withdrawal status to rejected
        const updated = await tx.transaction.update({
          where: { 
            id: parseInt(resolvedParams.id),
            type: 'withdrawal'
          },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                currency: true,
                balance: true
              }
            },
            bankAccount: {
              select: {
                bankName: true,
                accountNumber: true,
                accountHolder: true,
                ifscCode: true
              }
            }
          }
        });

        // Credit the user's balance back
        const newBalance = parseFloat(withdrawal.user.balance.toString()) + parseFloat(withdrawal.amount.toString());
        await tx.user.update({
          where: { id: withdrawal.userId },
          data: { balance: newBalance }
        });

        // Create a reversal transaction record
        await tx.transaction.create({
          data: {
            userId: withdrawal.userId,
            type: 'deposit', // Credit transaction
            amount: withdrawal.amount,
            currency: withdrawal.currency,
            status: 'completed',
            notes: `Amount reverted due to withdrawal rejection (Original withdrawal ID: ${withdrawal.id})`,
            adminNotes: `Automatic reversal for rejected withdrawal #${withdrawal.id}`,
            approvedAt: new Date(),
            closingBalance: newBalance
          }
        });

        return updated;
      });
    } else {
      // Normal update for non-rejected status
      updatedWithdrawal = await prisma.transaction.update({
        where: { 
          id: parseInt(resolvedParams.id),
          type: 'withdrawal' // Ensure we're only updating withdrawal transactions
        },
        data: updateData,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
              currency: true
            }
          },
          bankAccount: {
            select: {
              bankName: true,
              accountNumber: true,
              accountHolder: true,
              ifscCode: true
            }
          }
        }
      });
    }

    // Send email notification if withdrawal was approved
    if (status === 'completed' && updatedWithdrawal.user) {
      try {
        await emailService.sendWithdrawalApprovalEmail(
          updatedWithdrawal.user.email,
          updatedWithdrawal.user.firstName,
          Number(updatedWithdrawal.amount),
          updatedWithdrawal.user.currency || 'USD',
          updatedWithdrawal.id,
          updatedWithdrawal.mtrNumber || undefined
        );
        console.log('Withdrawal approval email sent successfully');
      } catch (emailError) {
        console.error('Failed to send withdrawal approval email:', emailError);
        // Don't fail the transaction if email fails
      }
    }

    // Map field names back to snake_case for API response consistency
    const responseWithdrawal = {
      id: updatedWithdrawal.id,
      amount: updatedWithdrawal.amount,
      withdrawal_method: updatedWithdrawal.bankAccount?.bankName || 'N/A',
      account_details: updatedWithdrawal.bankAccount ? 
        `${updatedWithdrawal.bankAccount.bankName} - ${updatedWithdrawal.bankAccount.accountNumber} (${updatedWithdrawal.bankAccount.accountHolder})` : 
        'N/A',
      bank_details: updatedWithdrawal.bankAccount ? {
        bankName: updatedWithdrawal.bankAccount.bankName,
        accountNumber: updatedWithdrawal.bankAccount.accountNumber,
        accountHolder: updatedWithdrawal.bankAccount.accountHolder,
        ifscCode: updatedWithdrawal.bankAccount.ifscCode || 'N/A'
      } : null,
      status: updatedWithdrawal.status,
      mtr_number: updatedWithdrawal.mtrNumber,
      admin_notes: updatedWithdrawal.adminNotes,
      approved_at: updatedWithdrawal.approvedAt,
      created_at: updatedWithdrawal.createdAt,
      updated_at: updatedWithdrawal.updatedAt,
      first_name: updatedWithdrawal.user.firstName,
      last_name: updatedWithdrawal.user.lastName,
      email: updatedWithdrawal.user.email,
      currency: updatedWithdrawal.user.currency,
      currency_symbol: updatedWithdrawal.user.currency === 'INR' ? '₹' : '$'
    };

    return NextResponse.json({
      message: 'Withdrawal request updated successfully',
      withdrawal: responseWithdrawal
    }, { status: 200 });

  } catch (error) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Get single withdrawal request
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Use centralized authentication
    const auth = await authenticateUser(request, ['admin', 'staff']);
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    const resolvedParams = await params;
    const withdrawal = await prisma.transaction.findUnique({
      where: { 
        id: parseInt(resolvedParams.id),
        type: 'withdrawal' // Ensure we're only getting withdrawal transactions
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            currency: true
          }
        },
        bankAccount: {
          select: {
            bankName: true,
            accountNumber: true,
            accountHolder: true,
            ifscCode: true
          }
        },
        media: {
          select: {
            fileName: true,
            originalName: true,
            url: true
          }
        }
      }
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: 'Withdrawal request not found' },
        { status: 404 }
      );
    }

    // Map field names back to snake_case for API response consistency
    const responseWithdrawal = {
      id: withdrawal.id,
      amount: withdrawal.amount,
      withdrawal_method: withdrawal.bankAccount?.bankName || 'N/A',
      account_details: withdrawal.bankAccount ? 
        `${withdrawal.bankAccount.bankName} - ${withdrawal.bankAccount.accountNumber} (${withdrawal.bankAccount.accountHolder})` : 
        'N/A',
      bank_details: withdrawal.bankAccount ? {
        bankName: withdrawal.bankAccount.bankName,
        accountNumber: withdrawal.bankAccount.accountNumber,
        accountHolder: withdrawal.bankAccount.accountHolder,
        ifscCode: withdrawal.bankAccount.ifscCode || 'N/A'
      } : null,
      notes: withdrawal.notes,
      status: withdrawal.status,
      mtr_number: withdrawal.mtrNumber,
      admin_notes: withdrawal.adminNotes,
      approved_at: withdrawal.approvedAt,
      created_at: withdrawal.createdAt,
      updated_at: withdrawal.updatedAt,
      first_name: withdrawal.user.firstName,
      last_name: withdrawal.user.lastName,
      email: withdrawal.user.email,
      currency: withdrawal.user.currency,
      currency_symbol: withdrawal.user.currency === 'INR' ? '₹' : '$',
      media_url: withdrawal.media?.url,
      media_name: withdrawal.media?.originalName
    };

    return NextResponse.json({ withdrawal: responseWithdrawal });
  } catch (error) {
    console.error('Get withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
