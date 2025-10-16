import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';
import { verifyTOTP } from '@/lib/totp';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await authenticateUser(request, ['admin']);

    console.log("+++++++++++++++++ authResult", authResult)
    if (!authResult.success || !authResult.user) {
      // Retry authentication once on first failure
      const retryAuthResult = await authenticateUser(request, ['admin']);
      console.log("+++++++++++++++++ retryAuthResult", retryAuthResult)
      if (!retryAuthResult.success || !retryAuthResult.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      // Use the retry result if successful
      authResult.success = retryAuthResult.success;
      authResult.user = retryAuthResult.user;
    }

    const adminUser = authResult.user;
    console.log("+++++++++++++++ adminUser", adminUser)

    const body = await request.json();
    const { userId, amount, type, balanceType, notes, otp } = body;

    // Validation
    if (!userId || !amount || !type || !balanceType || !otp) {
      return NextResponse.json({ 
        error: 'Missing required fields: userId, amount, type, balanceType, and otp are required' 
      }, { status: 400 });
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid transaction type. Must be "deposit" or "withdrawal"' 
      }, { status: 400 });
    }

    if (!['wallet', 'bonus'].includes(balanceType)) {
      return NextResponse.json({ 
        error: 'Invalid balance type. Must be "wallet" or "bonus"' 
      }, { status: 400 });
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    // Verify TOTP
    const isValidOTP = verifyTOTP(otp.toString());
    if (!isValidOTP) {
      return NextResponse.json({ 
        error: 'Invalid OTP. Please check your authenticator app and try again.' 
      }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { 
        id: true, 
        email: true, 
        firstName: true, 
        lastName: true, 
        balance: true,
        bonusBalance: true,
        currency: true,
        isActive: true,
        tradingPlatformUserId: true,
        tradingPlatformAccountId: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    if (!targetUser.isActive) {
      return NextResponse.json({ 
        error: 'Cannot create transaction for inactive user' 
      }, { status: 400 });
    }

    // For withdrawals, check if user has sufficient balance
    if (type === 'withdrawal') {
      if (balanceType === 'wallet') {
        const currentBalance = parseFloat(targetUser.balance?.toString() || '0');
        if (currentBalance < numericAmount) {
          return NextResponse.json({ 
            error: `Insufficient wallet balance. User has ${targetUser.currency || '$'}${currentBalance.toFixed(2)}, but withdrawal amount is ${targetUser.currency || '$'}${numericAmount.toFixed(2)}` 
          }, { status: 400 });
        }
      } else if (balanceType === 'bonus') {
        const currentBonusBalance = parseFloat(targetUser.bonusBalance?.toString() || '0');
        if (currentBonusBalance < numericAmount) {
          return NextResponse.json({ 
            error: `Insufficient bonus balance. User has ${targetUser.currency || '$'}${currentBonusBalance.toFixed(2)}, but withdrawal amount is ${targetUser.currency || '$'}${numericAmount.toFixed(2)}` 
          }, { status: 400 });
        }
      }
    }

    // Generate unique MTR number
    const generateMTRNumber = () => {
      const timestamp = Date.now().toString();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `ADM${timestamp.slice(-8)}${random}`;
    };

    let mtrNumber = generateMTRNumber();
    
    // Ensure MTR number is unique
    let existingTransaction = await prisma.transaction.findUnique({
      where: { mtrNumber: mtrNumber }
    });
    
    while (existingTransaction) {
      mtrNumber = generateMTRNumber();
      existingTransaction = await prisma.transaction.findUnique({
        where: { mtrNumber: mtrNumber }
      });
    }

    // Create transaction and update balance in a single transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user balances before any changes
      const currentUser = await tx.user.findUnique({
        where: { id: parseInt(userId) },
        select: { balance: true, bonusBalance: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      let newBalance: typeof currentUser.balance;
      let newBonusBalance: typeof currentUser.bonusBalance;
      const updateData: { balance?: Prisma.Decimal; bonusBalance?: Prisma.Decimal } = {};

      // Calculate new balance based on balance type
      if (balanceType === 'wallet') {
        const currentBalance = currentUser.balance;
        if (type === 'deposit') {
          newBalance = currentBalance.add(numericAmount);
        } else { // withdrawal
          newBalance = currentBalance.sub(numericAmount);
        }
        updateData.balance = newBalance;
        newBonusBalance = currentUser.bonusBalance; // Keep bonus balance unchanged
      } else { // bonus
        const currentBonusBalance = currentUser.bonusBalance;
        if (type === 'deposit') {
          newBonusBalance = currentBonusBalance.add(numericAmount);
        } else { // withdrawal
          newBonusBalance = currentBonusBalance.sub(numericAmount);
        }
        updateData.bonusBalance = newBonusBalance;
        newBalance = currentUser.balance; // Keep wallet balance unchanged
      }

      // Create the transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: parseInt(userId),
          amount: numericAmount,
          currency: targetUser.currency || 'USD',
          type: type,
          balanceType: balanceType,
          status: 'completed', // Admin transactions are automatically completed
          notes: notes || `Admin-created ${type} (${balanceType}) by ${adminUser.email}`,
          mtrNumber: mtrNumber,
          closingBalance: balanceType === 'wallet' ? newBalance : newBonusBalance,
          approvedAt: new Date()
        }
      });

      // Update user balance(s)
      await tx.user.update({
        where: { id: parseInt(userId) },
        data: updateData
      });

      return { transaction, newBalance, newBonusBalance };
    });

    // Call trading platform API if user has trading platform account
    if (targetUser.tradingPlatformUserId && targetUser.tradingPlatformAccountId) {
      try {
        const transferResult = await tradingPlatformApi.transferMoney({
          receiverAccountId: parseInt(String(targetUser.tradingPlatformAccountId)),
          senderUserId: parseInt(String(targetUser.tradingPlatformUserId)),
          amount: numericAmount,
          currency: targetUser.currency || 'USD',
          isWithdrawal: type === 'withdrawal' // true for withdrawal (user to main), false for deposit (main to user)
        });

        if (transferResult.success) {
          console.log(`✅ Trading platform transfer successful: ${type} of ${numericAmount} ${targetUser.currency} for user ${targetUser.email}`);
        } else {
          console.error(`❌ Trading platform transfer failed: ${transferResult.message}`);
          // Note: We don't rollback the local transaction as it should still be processed locally
        }
      } catch (transferError) {
        console.error(`❌ Error calling transferMoney API for user ${targetUser.email}:`, transferError);
        // Continue - local transaction is still valid
      }
    } else {
      console.log(`Transaction ${result.transaction.id}: User ${targetUser.email} has no trading platform account, skipping transfer`);
    }

    // Log admin action
    console.log(`Admin transaction created: ${type} (${balanceType}) of ${numericAmount} for user ${targetUser.email} by admin ${adminUser.email}`);

    return NextResponse.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} transaction created successfully`,
      transaction: {
        id: result.transaction.id,
        mtr_number: result.transaction.mtrNumber,
        amount: result.transaction.amount,
        type: result.transaction.type,
        balance_type: result.transaction.balanceType,
        currency: result.transaction.currency,
        status: result.transaction.status,
        notes: result.transaction.notes,
        created_at: result.transaction.createdAt,
        approved_at: result.transaction.approvedAt
      },
      user: {
        id: targetUser.id,
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        email: targetUser.email,
        previous_wallet_balance: parseFloat(targetUser.balance?.toString() || '0'),
        previous_bonus_balance: parseFloat(targetUser.bonusBalance?.toString() || '0'),
        new_wallet_balance: result.newBalance,
        new_bonus_balance: result.newBonusBalance,
        currency: targetUser.currency
      }
    });

  } catch (error) {
    console.error('Error creating admin transaction:', error);
    return NextResponse.json({ 
      error: 'Internal server error. Please try again.' 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
