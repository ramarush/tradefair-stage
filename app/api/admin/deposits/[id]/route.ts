/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateUser } from '@/lib/auth';
import tradingPlatformApi from '@/lib/tradingPlatformApi';
import { emailService } from '@/lib/emailService';
import { Decimal } from '@prisma/client/runtime/library';

// PUT - Update deposit request status
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
    const { status, admin_notes } = body;

    // Validation
    const validStatuses = ['pending', 'verification', 'completed', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: pending, verification, completed, rejected' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: {
      status: string;
      adminNotes: string | null;
      approvedAt?: Date;
      closingBalance?: Decimal;
    } = {
      status,
      adminNotes: admin_notes || null
    };


    console.log("++++++++++++++++++++++++++ admin side deposit approve api  status" ,status)
    // Set approvedAt timestamp when status is 'completed' (client requirement)
    if (status === 'completed') {
      updateData.approvedAt = new Date();
    }

    // Use atomic transaction to prevent double approval and ensure balance is credited exactly once
    // Step 1: Validate and fetch the transaction outside the transaction
    console.log("++++++++++++++++++++++++++ admin side deposit approve api step 1 resolvedParams.id" ,resolvedParams.id)
    let currentTransaction;
    try {
      currentTransaction = await prisma.transaction.findUnique({
        where: { 
          id: parseInt(resolvedParams.id),
          type: 'deposit'
        },
        select: {
          id: true,
          userId: true,
          amount: true,
          status: true,
          currency: true,
          closingBalance: true,
          tradingPlatformRequestId: true,
          user: {
            select: {
              email: true,
              firstName: true,
              currency: true,
              tradingPlatformAccountId: true,
              tradingPlatformUserId: true
            }
          }
        }
      });
    } catch (dbError) {
      console.error('Database error while fetching transaction:', dbError);
      throw new Error('Database error: Unable to fetch deposit transaction');
    }

    if (!currentTransaction) {
      throw new Error('Deposit transaction not found');
    }

    // Prevent double approval - if already completed, don't allow re-approval
    if (currentTransaction.status === 'completed' && status === 'completed') {
      throw new Error('This deposit has already been approved and cannot be approved again');
    }


    console.log("++++++++++++++++++++++++++++ call trading platform API step 2 ")
    // Step 2: Only proceed with trading platform API if no database/code errors so far
    let transferResult = null;
    if (status === 'completed' && currentTransaction.user.tradingPlatformAccountId && currentTransaction.user.tradingPlatformUserId) {
      try {
        transferResult = await tradingPlatformApi.transferMoney({
          receiverAccountId: currentTransaction.user.tradingPlatformAccountId,
          senderUserId: currentTransaction.user.tradingPlatformUserId,
          amount: Number(currentTransaction.amount),
          currency: currentTransaction.user.currency || 'USD',
          isWithdrawal: false
        });

        if (!transferResult.success) {
          throw new Error(`Money transfer failed: ${transferResult.message}`);
        }

        console.log('Trading platform money transfer successful:', transferResult.message);
      } catch (apiError) {
        console.error('Trading platform API error:', apiError);
        // Re-throw to prevent proceeding to database update
        throw apiError;
      }
    }


    console.log("++++++++++++++++++++ update database user balance step 3 ")
    // Step 3: Final atomic database update
    const result = await prisma.$transaction(async (tx) => {
      // Calculate new closing balance if approving the deposit
      let newClosingBalance = currentTransaction.closingBalance || 0;
      
      if (status === 'completed' && currentTransaction.status !== 'completed') {
        // Get current user balance
        const currentUser = await tx.user.findUnique({
          where: { id: currentTransaction.userId },
          select: { balance: true }
        });
        
        if (currentUser) {
          // Calculate new closing balance after crediting the deposit
          newClosingBalance = currentUser.balance.add(currentTransaction.amount);
        }
        
        // Credit the user's balance
        await tx.user.update({
          where: { id: currentTransaction.userId },
          data: {
            balance: {
              increment: currentTransaction.amount
            }
          }
        });
        
        // Add closing balance to update data
        updateData.closingBalance = new Decimal(newClosingBalance);
      }

      // Update the transaction status
      const updatedDeposit = await tx.transaction.update({
        where: { 
          id: parseInt(resolvedParams.id),
          type: 'deposit'
        },
        data: updateData,
        select: {
          id: true,
          amount: true,
          status: true,
          mtrNumber: true,
          adminNotes: true,
          approvedAt: true,
          createdAt: true,
          updatedAt: true,
          closingBalance: true
        }
      });

      return { updatedDeposit, userInfo: currentTransaction.user };
    });

    console.log("++++++++++++++++++ update user balance successfully")

    // Send email notification if deposit was approved
    if (status === 'completed' && result.userInfo) {
      try {
        await emailService.sendDepositApprovalEmail(
          result.userInfo.email,
          result.userInfo.firstName,
          Number(result.updatedDeposit.amount),
          result.userInfo.currency || 'USD',
          result.updatedDeposit.id
        );
        console.log('Deposit approval email sent successfully');
      } catch (emailError) {
        console.error('Failed to send deposit approval email:', emailError);
        // Don't fail the transaction if email fails
      }
    }

    // Map field names back to snake_case for API response consistency
    const responseDeposit = {
      id: result.updatedDeposit.id,
      amount: result.updatedDeposit.amount,
      mtr_number: result.updatedDeposit.mtrNumber,
      status: result.updatedDeposit.status,
      admin_notes: result.updatedDeposit.adminNotes,
      approved_at: result.updatedDeposit.approvedAt,
      created_at: result.updatedDeposit.createdAt,
      updated_at: result.updatedDeposit.updatedAt,
      closing_balance: result.updatedDeposit.closingBalance
    };

    return NextResponse.json({
      message: 'Deposit request updated successfully',
      deposit: responseDeposit
    }, { status: 200 });

  } catch (error: any) {
    console.error('Update deposit error:', error);
    
    // Handle specific error cases
    if (error.message === 'Deposit transaction not found') {
      return NextResponse.json(
        { error: 'Deposit transaction not found' },
        { status: 404 }
      );
    }
    
    if (error.message === 'This deposit has already been approved and cannot be approved again') {
      return NextResponse.json(
        { error: 'This deposit has already been approved and cannot be approved again' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Get single deposit request
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

    // Get deposit transaction with user information
    const deposit = await prisma.transaction.findUnique({
      where: { 
        id: parseInt(resolvedParams.id),
        type: 'deposit' // Ensure we're only getting deposit transactions
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            currency: true
          }
        }
      }
    });

    if (!deposit) {
      return NextResponse.json(
        { error: 'Deposit request not found' },
        { status: 404 }
      );
    }

    // Map field names to snake_case for API response consistency
    const responseDeposit = {
      id: deposit.id,
      amount: deposit.amount,
      mtr_number: deposit.mtrNumber,
      status: deposit.status,
      admin_notes: deposit.adminNotes,
      created_at: deposit.createdAt,
      updated_at: deposit.updatedAt,
      approved_at: deposit.approvedAt,
      closing_balance: deposit.closingBalance || 0,
      first_name: deposit.user.firstName,
      last_name: deposit.user.lastName,
      email: deposit.user.email,
      phone: deposit.user.phone,
      currency: deposit.user.currency,
      currency_symbol: deposit.user.currency === 'INR' ? '₹' : '$',
      processed_by_name: null,
      processed_by_lastname: null
    };

    return NextResponse.json({ deposit: responseDeposit }, { status: 200 });

  } catch (error) {
    console.error('Get deposit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
