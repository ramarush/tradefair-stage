import QRCode from 'qrcode';

export interface UPIQROptions {
  vpa: string;
  amount: number;
  name: string;
  note?: string;
}

export async function generateUpiQr(options: UPIQROptions): Promise<string> {
  const { vpa, amount, name, note } = options;
  
  // Create UPI payment string
  const upiString = `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR${note ? `&tn=${encodeURIComponent(note)}` : ''}`;
  
  try {
    // Generate QR code as data URL (for HTML <img>)
    const qrDataUrl = await QRCode.toDataURL(upiString, {
      errorCorrectionLevel: 'M',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    });
    
    return qrDataUrl;
  } catch (err) {
    console.error('Error generating UPI QR code:', err);
    throw new Error('Failed to generate QR code');
  }
}

export function generateUpiString(options: UPIQROptions): string {
  const { vpa, amount, name, note } = options;
  return `upi://pay?pa=${vpa}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR${note ? `&tn=${encodeURIComponent(note)}` : ''}`;
}