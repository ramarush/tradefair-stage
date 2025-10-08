import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

// TOTP Configuration
const TOTP_CONFIG = {
  // Generate a new secret key for your authenticator app
  // You can generate one using: speakeasy.generateSecret({name: 'TradeFair Admin', issuer: 'TradeFair'})
  SECRET: process.env.TOTP_SECRET || 'JBSWY3DPEHPK3PXP', // Default for development - CHANGE IN PRODUCTION!
  WINDOW: 2, // Allow 2 time steps (60 seconds) tolerance
  STEP: 30, // 30-second time step
  DIGITS: 6, // 6-digit codes
  ALGORITHM: 'sha1' as const,
  ISSUER: 'TradeFair',
  SERVICE_NAME: 'TradeFair Admin'
};

/**
 * Generate a new TOTP secret and QR code for setup
 */
export const generateTOTPSecret = () => {
  const secret = speakeasy.generateSecret({
    name: TOTP_CONFIG.SERVICE_NAME,
    issuer: TOTP_CONFIG.ISSUER,
    length: 20
  });

  return {
    secret: secret.base32,
    qrCodeUrl: secret.otpauth_url,
    manualEntryKey: secret.base32
  };
};

/**
 * Generate QR code image for TOTP setup
 */
export const generateQRCode = async (otpauthUrl: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Verify TOTP token
 */
export const verifyTOTP = (token: string, secret?: string): boolean => {
  try {
    const secretToUse = secret || TOTP_CONFIG.SECRET;
    
    console.log('TOTP Verification Debug:', {
      token: token,
      secretLength: secretToUse.length,
      secretPreview: secretToUse.substring(0, 4) + '...',
      window: TOTP_CONFIG.WINDOW,
      step: TOTP_CONFIG.STEP,
      digits: TOTP_CONFIG.DIGITS,
      algorithm: TOTP_CONFIG.ALGORITHM
    });
    
    const verified = speakeasy.totp.verify({
      secret: secretToUse,
      encoding: 'base32',
      token: token,
      window: TOTP_CONFIG.WINDOW,
      step: TOTP_CONFIG.STEP,
      digits: TOTP_CONFIG.DIGITS,
      algorithm: TOTP_CONFIG.ALGORITHM
    });

    console.log('TOTP Verification Result:', verified);
    return verified;
  } catch (error) {
    console.error('Error verifying TOTP:', error);
    return false;
  }
};

/**
 * Generate current TOTP token (for testing purposes)
 */
export const generateTOTP = (secret?: string): string => {
  try {
    const secretToUse = secret || TOTP_CONFIG.SECRET;
    
    const token = speakeasy.totp({
      secret: secretToUse,
      encoding: 'base32',
      step: TOTP_CONFIG.STEP,
      digits: TOTP_CONFIG.DIGITS,
      algorithm: TOTP_CONFIG.ALGORITHM
    });

    return token;
  } catch (error) {
    console.error('Error generating TOTP:', error);
    return '';
  }
};

/**
 * Get TOTP setup instructions
 */
export const getTOTPSetupInstructions = () => {
  // Use the same secret that verification uses
  const secretToUse = TOTP_CONFIG.SECRET;
  
  // Generate QR code URL manually using the fixed secret
  const qrCodeUrl = `otpauth://totp/${encodeURIComponent(TOTP_CONFIG.SERVICE_NAME)}?secret=${secretToUse}&issuer=${encodeURIComponent(TOTP_CONFIG.ISSUER)}&algorithm=${TOTP_CONFIG.ALGORITHM}&digits=${TOTP_CONFIG.DIGITS}&period=${TOTP_CONFIG.STEP}`;
  
  return {
    instructions: [
      '1. Install an authenticator app (Google Authenticator, Authy, etc.)',
      '2. Scan the QR code below or manually enter the secret key',
      '3. The app will generate 6-digit codes every 30 seconds',
      '4. Use these codes when creating admin transactions'
    ],
    secret: secretToUse,
    qrCodeUrl: qrCodeUrl,
    manualEntryKey: secretToUse
  };
};

export default {
  generateTOTPSecret,
  generateQRCode,
  verifyTOTP,
  generateTOTP,
  getTOTPSetupInstructions,
  TOTP_CONFIG
};
