import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { generateUpiQr } from '@/lib/upiQr';

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

    const { vpa_address, amount, account_holder_name, note } = await request.json();

    if (!vpa_address || !amount || !account_holder_name) {
      return NextResponse.json(
        { error: 'VPA address, amount, and account holder name are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    try {
      const qrCode = await generateUpiQr({
        vpa: vpa_address,
        amount: amount,
        name: account_holder_name,
        note: note || `Deposit of ₹${amount}`
      });

      return NextResponse.json({
        qrCode,
        upi_string: `upi://pay?pa=${vpa_address}&pn=${encodeURIComponent(account_holder_name)}&am=${amount}&cu=INR${note ? `&tn=${encodeURIComponent(note)}` : ''}`
      });

    } catch (error) {
      console.error('Error generating QR code:', error);
      return NextResponse.json(
        { error: 'Failed to generate QR code' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing QR generation request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}