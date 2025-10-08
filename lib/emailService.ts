import { Resend } from 'resend';

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static instance: EmailService;
  private senderEmail: string;

  private constructor() {
    this.senderEmail = process.env.SENDER_EMAIL || 'TradeFair <noreply@tradefair.com>';
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send an email using Resend
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string; data?: unknown }> {
    try {
      if (!process.env.RESEND_API_KEY) {
        console.error('RESEND_API_KEY is not configured');
        return { success: false, error: 'Email service not configured' };
      }

      const { data, error } = await resend.emails.send({
        from: options.from || this.senderEmail,
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message || 'Failed to send email' };
      }

      console.log('Email sent successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: 'Internal email service error' };
    }
  }

  /**
   * Send signup verification email with OTP
   */
  async sendSignupVerificationEmail(
    email: string, 
    firstName: string, 
    otp: string
  ): Promise<{ success: boolean; error?: string }> {
    const subject = 'Verify Your TradeFair Account - OTP Required';
    const html = this.generateSignupVerificationTemplate(firstName, otp);

    const result = await this.sendEmail({
      to: email,
      subject,
      html,
    });

    return result;
  }

  /**
   * Send deposit approval notification email
   */
  async sendDepositApprovalEmail(
    email: string,
    firstName: string,
    amount: number,
    currency: string,
    transactionId: number
  ): Promise<{ success: boolean; error?: string }> {
    const subject = 'Deposit Approved - Funds Added to Your Account';
    const html = this.generateDepositApprovalTemplate(firstName, amount, currency, transactionId);

    const result = await this.sendEmail({
      to: email,
      subject,
      html,
    });

    return result;
  }

  /**
   * Send withdrawal approval notification email
   */
  async sendWithdrawalApprovalEmail(
    email: string,
    firstName: string,
    amount: number,
    currency: string,
    transactionId: number,
    mtrNumber?: string
  ): Promise<{ success: boolean; error?: string }> {
    const subject = 'Withdrawal Approved - Funds Transferred';
    const html = this.generateWithdrawalApprovalTemplate(firstName, amount, currency, transactionId, mtrNumber);

    const result = await this.sendEmail({
      to: email,
      subject,
      html,
    });

    return result;
  }

  /**
   * Generate HTML template for signup verification email
   */
  private generateSignupVerificationTemplate(firstName: string, otp: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your TradeFair Account</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .otp-box { background: #fff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 10px 0; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Welcome to TradeFair!</h1>
          <p>Verify your account to get started</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName},</h2>
          
          <p>Thank you for signing up with TradeFair! To complete your registration and secure your account, please verify your email address using the OTP code below.</p>
          
          <div class="otp-box">
            <p><strong>Your Verification Code:</strong></p>
            <div class="otp-code">${otp}</div>
            <p><small>This code is valid for 10 minutes</small></p>
          </div>
          
          <div class="warning">
            <strong>Security Notice:</strong> Never share this OTP with anyone. TradeFair will never ask for your OTP via phone or email.
          </div>
          
          <p>If you didn't create an account with TradeFair, please ignore this email or contact our support team.</p>
          
          <p>Best regards,<br>
          <strong>The TradeFair Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 TradeFair. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for deposit approval email
   */
  private generateDepositApprovalTemplate(
    firstName: string, 
    amount: number, 
    currency: string, 
    transactionId: number
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Approved - TradeFair</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: #fff; border: 2px solid #28a745; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount { font-size: 28px; font-weight: bold; color: #28a745; margin: 10px 0; }
          .transaction-details { background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success-icon { font-size: 48px; color: #28a745; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Deposit Approved!</h1>
          <p>Your funds have been successfully added to your account</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName},</h2>
          
          <p>Great news! Your deposit has been approved and the funds have been successfully credited to your TradeFair account.</p>
          
          <div class="amount-box">
            <p><strong>Deposited Amount:</strong></p>
            <div class="amount">${currency} ${amount.toLocaleString()}</div>
          </div>
          
          <div class="transaction-details">
            <h3>Transaction Details</h3>
            <div class="detail-row">
              <span><strong>Transaction ID:</strong></span>
              <span>#${transactionId}</span>
            </div>
            <div class="detail-row">
              <span><strong>Amount:</strong></span>
              <span>${currency} ${amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span><strong>Status:</strong></span>
              <span style="color: #28a745; font-weight: bold;">Approved</span>
            </div>
            <div class="detail-row">
              <span><strong>Processed On:</strong></span>
              <span>${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
          
          <p>You can now start trading with your deposited funds. Log in to your account to view your updated balance and begin exploring our trading platform.</p>
          
          <div style="text-align: center;">
            <a href="#" class="button">View Account Dashboard</a>
          </div>
          
          <p>If you have any questions about this transaction or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Happy trading!<br>
          <strong>The TradeFair Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 TradeFair. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML template for withdrawal approval email
   */
  private generateWithdrawalApprovalTemplate(
    firstName: string, 
    amount: number, 
    currency: string, 
    transactionId: number,
    mtrNumber?: string
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Withdrawal Approved - TradeFair</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17a2b8 0%, #138496 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .amount-box { background: #fff; border: 2px solid #17a2b8; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .amount { font-size: 28px; font-weight: bold; color: #17a2b8; margin: 10px 0; }
          .transaction-details { background: #fff; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-row:last-child { border-bottom: none; }
          .mtr-highlight { background: #e7f3ff; border: 1px solid #17a2b8; border-radius: 5px; padding: 10px; margin: 15px 0; }
          .button { display: inline-block; background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .success-icon { font-size: 48px; color: #17a2b8; margin-bottom: 20px; }
          .info-box { background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="success-icon">💸</div>
          <h1>Withdrawal Approved!</h1>
          <p>Your funds have been successfully transferred</p>
        </div>
        
        <div class="content">
          <h2>Hello ${firstName},</h2>
          
          <p>Your withdrawal request has been approved and processed successfully. The funds have been transferred to your registered bank account.</p>
          
          <div class="amount-box">
            <p><strong>Withdrawal Amount:</strong></p>
            <div class="amount">${currency} ${amount.toLocaleString()}</div>
          </div>
          
          <div class="transaction-details">
            <h3>Transaction Details</h3>
            <div class="detail-row">
              <span><strong>Transaction ID:</strong></span>
              <span>#${transactionId}</span>
            </div>
            <div class="detail-row">
              <span><strong>Amount:</strong></span>
              <span>${currency} ${amount.toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span><strong>Status:</strong></span>
              <span style="color: #17a2b8; font-weight: bold;">Approved & Transferred</span>
            </div>
            <div class="detail-row">
              <span><strong>Processed On:</strong></span>
              <span>${new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
            ${mtrNumber ? `
            <div class="detail-row">
              <span><strong>MTR Number:</strong></span>
              <span style="font-weight: bold;">${mtrNumber}</span>
            </div>
            ` : ''}
          </div>
          
          ${mtrNumber ? `
          <div class="mtr-highlight">
            <strong>Money Transfer Receipt (MTR) Number:</strong> ${mtrNumber}<br>
            <small>Please keep this MTR number for your records. You can use it to track the transfer with your bank.</small>
          </div>
          ` : ''}
          
          <div class="info-box">
            <strong>Important:</strong> Depending on your bank, it may take 1-3 business days for the funds to reflect in your account. If you don't see the funds after 3 business days, please contact your bank or our support team.
          </div>
          
          <p>You can continue trading with your remaining account balance. Log in to your account to view your updated balance and transaction history.</p>
          
          <div style="text-align: center;">
            <a href="#" class="button">View Account Dashboard</a>
          </div>
          
          <p>If you have any questions about this transaction or need assistance, please don't hesitate to contact our support team.</p>
          
          <p>Thank you for choosing TradeFair!<br>
          <strong>The TradeFair Team</strong></p>
        </div>
        
        <div class="footer">
          <p>© 2024 TradeFair. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `;
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();
