import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateUser } from '@/lib/auth';

const prisma = new PrismaClient();

// GET - Fetch user's bank accounts
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        userId: authResult.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      bankAccounts: bankAccounts.map(account => ({
        id: account.id,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
        ifscCode: account.ifscCode,
        routingNumber: account.routingNumber,
        swiftCode: account.swiftCode,
        accountType: account.accountType,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new bank account
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      bankName, 
      accountNumber, 
      accountHolder, 
      ifscCode, 
      routingNumber, 
      swiftCode, 
      accountType 
    } = body;

    // Validation
    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json({ 
        error: 'Bank name, account number, and account holder are required.' 
      }, { status: 400 });
    }

    // Check if account number already exists for this user
    const existingAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: authResult.user.id,
        accountNumber,
        isActive: true,
      },
    });

    if (existingAccount) {
      return NextResponse.json({ 
        error: 'Bank account with this account number already exists.' 
      }, { status: 400 });
    }

    const bankAccount = await prisma.bankAccount.create({
      data: {
        userId: authResult.user.id,
        bankName,
        accountNumber,
        accountHolder,
        ifscCode,
        routingNumber,
        swiftCode,
        accountType,
      },
    });

    return NextResponse.json({
      message: 'Bank account added successfully',
      bankAccount: {
        id: bankAccount.id,
        bankName: bankAccount.bankName,
        accountNumber: bankAccount.accountNumber,
        accountHolder: bankAccount.accountHolder,
        ifscCode: bankAccount.ifscCode,
        routingNumber: bankAccount.routingNumber,
        swiftCode: bankAccount.swiftCode,
        accountType: bankAccount.accountType,
        createdAt: bankAccount.createdAt.toISOString(),
        updatedAt: bankAccount.updatedAt.toISOString(),
      },
    });

  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
