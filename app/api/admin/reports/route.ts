import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Helper function to verify admin token
async function verifyAdminToken(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isAdmin: true, isStaff: true }
    });

    if (!user || (!user.isAdmin && !user.isStaff)) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

// Helper function to get currency symbol
function getCurrencySymbol(currency: string) {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'INR': '₹',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
  };
  return symbols[currency] || currency;
}

// Helper function to convert data to CSV
function convertToCSV(data: any[]) {
  if (data.length === 0) return '';
  
  const headers = [
    'ID',
    'Customer Name',
    'Customer Email',
    'User ID',
    'Type',
    'Amount',
    'Currency',
    'Status',
    'MTR Number',
    'Bank ID',
    'Notes',
    'Created At',
    'Approved At'
  ];
  
  const csvContent = [
    headers.join(','),
    ...data.map(row => [
      row.id,
      `"${row.customer_name}"`,
      `"${row.customer_email}"`,
      row.user_id,
      row.type,
      row.amount,
      row.currency,
      row.status,
      row.mtrNumber || '',
      row.bank_id || '',
      `"${(row.notes || '').replace(/"/g, '""')}"`,
      row.created_at,
      row.approved_at || ''
    ].join(','))
  ].join('\n');
  
  return csvContent;
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const user = await verifyAdminToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Check if this is a CSV export request
    const isExport = searchParams.get('export') === 'csv';
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (type && type !== 'all') {
      where.type = type;
    }
    
    if (status && status !== 'all') {
      where.status = status;
    }
    
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo + 'T23:59:59.999Z');
      }
    }
    
    if (search) {
      where.user = {
        OR: [
          {
            firstName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            lastName: {
              contains: search,
              mode: 'insensitive'
            }
          },
          {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        ]
      };
    }

    // For CSV export, get all matching records
    if (isExport) {
      const transactions = await prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              currency: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const reportData = transactions.map(transaction => ({
        id: transaction.id,
        customer_name: `${transaction.user.firstName} ${transaction.user.lastName}`,
        customer_email: transaction.user.email,
        user_id: transaction.userId,
        type: transaction.type,
        amount: transaction.amount.toString(),
        currency: transaction.currency,
        status: transaction.status,
        mtrNumber: transaction.mtrNumber,
        bank_id: transaction.bankId,
        notes: transaction.notes,
        closing_balance: Number(transaction.closingBalance),
        created_at: transaction.createdAt.toISOString(),
        approved_at: transaction.approvedAt?.toISOString()
      }));

      const csvContent = convertToCSV(reportData);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="transaction-report-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // For regular API request, get paginated results
    const skip = (page - 1) * limit;
    
    // Calculate financial summary statistics grouped by currency
    const summaryStats = await prisma.transaction.groupBy({
      by: ['type', 'status', 'currency'],
      where,
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });
    
    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        select: {
          id: true,
          userId: true,
          type: true,
          amount: true,
          currency: true,
          status: true,
          mtrNumber: true,
          bankId: true,
          notes: true,
          closingBalance: true,
          createdAt: true,
          approvedAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              currency: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.transaction.count({ where })
    ]);

    const reportData = transactions.map(transaction => ({
      id: transaction.id,
      customer_name: `${transaction.user.firstName} ${transaction.user.lastName}`,
      customer_email: transaction.user.email,
      user_id: transaction.userId,
      type: transaction.type,
      amount: transaction.amount.toString(),
      currency: transaction.currency,
      currency_symbol: getCurrencySymbol(transaction.user.currency || 'USD'),
      status: transaction.status,
      mtrNumber: transaction.mtrNumber,
      bank_id: transaction.bankId,
      notes: transaction.notes,
      closing_balance: Number(transaction.closingBalance || 0),
      created_at: transaction.createdAt.toISOString(),
      approved_at: transaction.approvedAt?.toISOString()
    }));

    const totalPages = Math.ceil(totalCount / limit);

    // Process summary statistics by currency
    const summaryByCurrency: { [currency: string]: any } = {};

    summaryStats.forEach(stat => {
      const amount = parseFloat(stat._sum.amount?.toString() || '0');
      const count = stat._count.id;
      const currency = stat.currency;
      
      if (!summaryByCurrency[currency]) {
        summaryByCurrency[currency] = {
          deposits: {
            open: { amount: 0, count: 0 },
            in_progress: { amount: 0, count: 0 },
            completed: { amount: 0, count: 0 },
            rejected: { amount: 0, count: 0 }
          },
          withdrawals: {
            open: { amount: 0, count: 0 },
            in_progress: { amount: 0, count: 0 },
            completed: { amount: 0, count: 0 },
            rejected: { amount: 0, count: 0 }
          }
        };
      }
      
      if (stat.type === 'deposit') {
        summaryByCurrency[currency].deposits[stat.status] = { amount, count };
      } else if (stat.type === 'withdrawal') {
        summaryByCurrency[currency].withdrawals[stat.status] = { amount, count };
      }
    });

    return NextResponse.json({
      transactions: reportData,
      summaryByCurrency,
      pagination: {
        current: page,
        totalPages,
        total: totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
