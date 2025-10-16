import { CheckIcon } from '@heroicons/react/24/outline';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';
import tradingPlatformApi from '@/lib/tradingPlatformApi';

const prisma = new PrismaClient();

// GET - Fetch user's transactions
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query params once
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: Prisma.TransactionWhereInput = {
      userId: authResult.user.id,
      ...(type && type !== 'all' && { type }),
      ...(status && status !== 'all' && { status }),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom && { gte: new Date(dateFrom) }),
              ...(dateTo && { lte: new Date(dateTo + 'T23:59:59.999Z') }),
            },
          }
        : {}),
    };

    // Single aggregated query: user currency + transactions + total count
    const [userWithCurrency, transactions, total] = await prisma.$transaction([
      prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: { currency: true },
      }),
      prisma.transaction.findMany({
        where: whereClause,
        select: {
          id: true,
          type: true,
          amount: true,
          status: true,
          notes: true,
          mtrNumber: true,
          adminNotes: true,
          approvedAt: true,
          closingBalance: true,
          createdAt: true,
          updatedAt: true,
          bankAccount: {
            select: {
              id: true,
              bankName: true,
              accountNumber: true,
              accountHolder: true,
            },
          },
          media: {
            select: {
              id: true,
              url: true,
              originalName: true,
            },
          },
          paymentMethod: {
            select: {
              id: true,
              type: true,
              accountHolderName: true,
              bankName: true,
              accountNumber: true,
              ifscCode: true,
              vpaAddress: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.transaction.count({ where: whereClause }),
    ]);

    const userCurrency = userWithCurrency?.currency || 'USD';
    const currencySymbol = userCurrency === 'INR' ? '₹' : '$';

    return NextResponse.json({
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toString(),
        currency: userCurrency,
        currency_symbol: currencySymbol,
        status: t.status,
        notes: t.notes,
        mtrNumber: t.mtrNumber,
        bankId: t.bankAccount?.id ?? null,
        bankAccount: t.bankAccount,
        media: t.media,
        paymentMethod: t.paymentMethod
          ? {
              id: t.paymentMethod.id,
              type: t.paymentMethod.type,
              account_holder_name: t.paymentMethod.accountHolderName,
              bank_name: t.paymentMethod.bankName,
              account_number: t.paymentMethod.accountNumber ? `${t.paymentMethod.accountNumber}` : null,
              ifsc_code: t.paymentMethod.ifscCode,
              vpa_address: t.paymentMethod.vpaAddress,
            }
          : null,
        adminNotes: t.adminNotes,
        approvedAt: t.approvedAt?.toISOString() ?? null,
        closingBalance: Number(t.closingBalance),
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new transaction (deposit or withdrawal)
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }



    const body = await request.json();
    const { type, amount, notes, bankId, mediaId, mtrNumber, paymentMethodId } = body;

    // Validation
    if (!type || !['deposit', 'withdrawal'].includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid transaction type. Must be "deposit" or "withdrawal".' 
      }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ 
        error: 'Invalid amount. Must be greater than 0.' 
      }, { status: 400 });
    }

    // For deposits, MTR number is required
    if (type === 'deposit' && !mtrNumber?.trim()) {
      return NextResponse.json({ 
        error: 'MTR/UTR number is required for deposits.' 
      }, { status: 400 });
    }

    // For withdrawals, bank account is required
    if (type === 'withdrawal' && !bankId) {
      return NextResponse.json({ 
        error: 'Bank account is required for withdrawals.' 
      }, { status: 400 });
    }

    // Verify bank account belongs to user if provided
    if (bankId) {
      const bankAccount = await prisma.bankAccount.findFirst({
        where: {
          id: bankId,
          userId: authResult.user.id,
          isActive: true,
        },
      });

      if (!bankAccount) {
        return NextResponse.json({ 
          error: 'Invalid bank account.' 
        }, { status: 400 });
      }
    }

    // Get user's currency and trading platform info
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.id },
      select: { 
        currency: true, 
        balance: true, 
        bonusBalance: true,
        tradingPlatformUserId: true 
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
 
    if (type === 'withdrawal') {
      const totalAvailableBalance = Number(user.balance) + Number(user.bonusBalance || 0);
      if (totalAvailableBalance < Number(amount)) {
        return NextResponse.json({ 
          error: 'Insufficient balance for withdrawal.' 
        }, { status: 400 });
      }

      if (user.currency === 'USD') {
        try {
          const systemSettings = await prisma.systemSettings.findFirst({
            orderBy: { createdAt: 'desc' }
          });
          
          const settings = systemSettings?.settings as { exchangeRates?: { usdWithdrawalRate?: number } };
          const exchangeRates = settings?.exchangeRates || {};
          if (!exchangeRates.usdWithdrawalRate) {
            return NextResponse.json({
              error: 'USD withdrawal exchange rate is not set by the admin. Please contact support.'
            }, { status: 400 });
          }
        } catch (error) {
          console.error('Error checking exchange rates:', error);
          return NextResponse.json({
            error: 'Unable to process USD withdrawal at this time.'
          }, { status: 500 });
        }
      }
    }
    let tradingPlatformResult = null;
    if (type === 'deposit' && user.tradingPlatformUserId && paymentMethodId) {
      try {
        tradingPlatformResult = await tradingPlatformApi.createDepositRequest({
          amount: amount,
          bankId: 34, // Using paymentMethodId as bankId for trading platform
          comment: notes || `Deposit request for ${user.currency === 'INR' ? '₹' : '$'}${amount}`,
          tradingPlatformUserId: user.tradingPlatformUserId,
        });

   

        if (!tradingPlatformResult.success) {
          return NextResponse.json(
            { error: `Trading platform error: ${tradingPlatformResult.message}` },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error('Trading platform deposit request failed:', error);
        return NextResponse.json(
          { error: 'Failed to create deposit request on trading platform' },
          { status: 500 }
        );
      }
    }


    
    
    
   
    if (type === 'withdrawal' && user.tradingPlatformUserId) {
      const checkUserOpenTradeAccount = await tradingPlatformApi.getUserFinancials(user.tradingPlatformUserId);


      if (!checkUserOpenTradeAccount.success) {
        return NextResponse.json(
          { error: `Trading platform error: ${checkUserOpenTradeAccount.message}` },
          { status: 400 }
        );
      }


      if (checkUserOpenTradeAccount.data?.currentPL !== 0) {
        return NextResponse.json(
          { error: 'Withdrawal not allowed if positions are open. Please close all trades then place withdrawal request. Thankyou Team Tradefair' },
          { status: 422 } 
        );
      }

      if (checkUserOpenTradeAccount.data?.CheckIcon === 0) {
        try {
          tradingPlatformResult = await tradingPlatformApi.createCashRequest({
            amount: amount,
            comment: notes || `Withdrawal request for ${user.currency === 'INR' ? '₹' : '$'}${amount}`,
            tradingPlatformUserId: user.tradingPlatformUserId,
          });

          if (!tradingPlatformResult.success) {
            return NextResponse.json(
              { error: `Trading platform error: ${tradingPlatformResult.message}` },
              { status: 400 }
            );
          }
        } catch (error) {
          console.error('Trading platform cash request failed:', error);
          return NextResponse.json(
            { error: 'Failed to create cash request on trading platform' },
            { status: 500 }
          );
        }
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get current user balances before any changes
      const currentUser = await tx.user.findUnique({
        where: { id: authResult.user.id },
        select: { balance: true, bonusBalance: true },
      });

      if (!currentUser) {
        throw new Error('User not found');
      }

      const currentBalance = currentUser.balance;
      const currentBonusBalance = currentUser.bonusBalance || 0;

      // For withdrawals, calculate how much to deduct from each balance type
      let bonusDeduction = 0;
      let walletDeduction = 0;
      let closingBalance = currentBalance;

      if (type === 'withdrawal') {
        // First deduct from bonus balance, then from wallet balance
        bonusDeduction = Math.min(Number(currentBonusBalance), amount);
        walletDeduction = amount - bonusDeduction;
        closingBalance = currentBalance.sub(walletDeduction);
      }

      // Create transaction record with closing balance and trading platform request ID

      const transaction = await tx.transaction.create({
        data: {
          userId: authResult.user.id,
          type,
          amount,
          currency: user.currency || 'USD',
          notes: type === 'withdrawal' && bonusDeduction > 0 
            ? `${notes || ''} (Deducted: ${bonusDeduction} from bonus, ${walletDeduction} from wallet)`.trim()
            : notes,
          bankId,
          mediaId,
          mtrNumber,
          paymentMethodId,
          status: 'pending',
          closingBalance,
          tradingPlatformRequestId: tradingPlatformResult?.requestId || null,
        },
        include: {
          bankAccount: true,
          media: true,
        },
      });

      // For withdrawals, deduct from both balance types as calculated
      if (type === 'withdrawal') {
        const updateData: { balance?: { decrement: number }; bonusBalance?: { decrement: number } } = {};
        
        if (walletDeduction > 0) {
          updateData.balance = {
            decrement: walletDeduction,
          };
        }
        
        if (bonusDeduction > 0) {
          updateData.bonusBalance = {
            decrement: bonusDeduction,
          };
        }

        if (Object.keys(updateData).length > 0) {
          await tx.user.update({
            where: { id: authResult.user.id },
            data: updateData,
          });
        }
      }

      return transaction;
    });

    const response: any = {
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} request created successfully`,
      transaction: {
        id: result.id,
        type: result.type,
        amount: Number(result.amount),
        currency: result.currency,
        status: result.status,
        notes: result.notes,
        mtrNumber: result.mtrNumber,
        tradingPlatformRequestId: result.tradingPlatformRequestId,
        bankAccount: result.bankAccount ? {
          id: result.bankAccount.id,
          bankName: result.bankAccount.bankName,
          accountNumber: result.bankAccount.accountNumber,
          accountHolder: result.bankAccount.accountHolder,
        } : null,
        media: result.media ? {
          id: result.media.id,
          url: result.media.url,
          originalName: result.media.originalName,
        } : null,
        createdAt: result.createdAt.toISOString(),
        updatedAt: result.updatedAt.toISOString(),
      },
    };

    // Add trading platform info if request was successful
    if (tradingPlatformResult?.success) {
      response.tradingPlatform = {
        success: true,
        requestId: tradingPlatformResult.requestId,
        message: tradingPlatformResult.message,
      };
    }

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('Error creating transaction:', error);
    
    // Handle unique constraint violation for MTR number
    if (error.code === 'P2002' && error.meta?.target?.includes('mtr_number')) {
      return NextResponse.json(
        { error: 'This UTR/MTR number has already been used. Please check your transaction or use a different UTR number.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
