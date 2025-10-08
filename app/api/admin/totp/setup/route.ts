import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { getTOTPSetupInstructions, generateQRCode } from '@/lib/totp';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await authenticateUser(request, ['admin']);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get TOTP setup instructions
    const setupInfo = getTOTPSetupInstructions();
    
    // Generate QR code image
    const qrCodeImage = await generateQRCode(setupInfo.qrCodeUrl || '');

    return NextResponse.json({
      success: true,
      setup: {
        instructions: setupInfo.instructions,
        qrCodeImage: qrCodeImage,
        manualEntryKey: setupInfo.manualEntryKey,
        issuer: 'TradeFair',
        accountName: 'TradeFair Admin',
        algorithm: 'SHA1',
        digits: 6,
        period: 30
      }
    });

  } catch (error) {
    console.error('Error generating TOTP setup:', error);
    return NextResponse.json({ 
      error: 'Failed to generate TOTP setup information' 
    }, { status: 500 });
  }
}
