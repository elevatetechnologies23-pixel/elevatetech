import nodemailer from 'nodemailer';

// Singleton cached pooled transporter for high-speed delivery
let cachedTransporter: nodemailer.Transporter | null = null;

// Create or return reusable pooled transporter using environment variables
export const createTransporter = async (): Promise<nodemailer.Transporter> => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const host = process.env.SMTP_HOST;
  const user = (process.env.SMTP_USER || '').trim().replace(/["']/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/\s/g, '').replace(/["']/g, '');
  const port = Number(process.env.SMTP_PORT) || 465;
  const isGmail = (host && host.includes('gmail')) || user.endsWith('@gmail.com');

  if (user && pass) {
    if (isGmail) {
      cachedTransporter = nodemailer.createTransport({
        service: 'gmail',
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth: { user, pass }
      });
      return cachedTransporter;
    }

    cachedTransporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
    return cachedTransporter;
  }

  // Fallback to test account (Ethereal) for dev/testing
  console.warn('⚠️ SMTP credentials not fully provided. Using temporary Ethereal test account.');
  const testAccount = await nodemailer.createTestAccount();
  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
  return cachedTransporter;
};

// Verify SMTP connection and optionally send a test email
export const testSmtpConnection = async (toEmail?: string): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    
    if (toEmail) {
      const from = process.env.SMTP_FROM || `"Elevate Technology" <${process.env.SMTP_USER || 'no-reply@elevatetechnology.com'}>`;
      const info = await transporter.sendMail({
        from,
        to: toEmail,
        subject: '🧪 Elevate Technology SMTP Test Email',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:500px;margin:0 auto;padding:20px;border:1px solid #e2e8f0;border-radius:10px;">
            <h3 style="color:#0052FF;">SMTP Test Successful</h3>
            <p>This is a test email confirming that Elevate Technology email dispatch is functioning properly.</p>
            <p style="font-size:12px;color:#64748b;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `
      });
      return { success: true, message: `SMTP verified and test email sent to ${toEmail}!`, details: { messageId: info.messageId } };
    }

    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'SMTP Connection Failed', details: err };
  }
};

// Send OTP email for password reset
export const sendPasswordResetEmail = async (toEmail: string, recipientName: string, otp: string) => {
  const transporter = await createTransporter();
  const from = process.env.SMTP_FROM || `"Elevate Technology" <${process.env.SMTP_USER || 'no-reply@elevatetechnology.com'}>`;

  const info = await transporter.sendMail({
    from,
    to: toEmail,
    subject: '🔐 Password Reset OTP — Elevate Technology',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;padding:24px;background:#fff">
        <div style="text-align:center;border-bottom:2px solid #0052FF;padding-bottom:14px;margin-bottom:20px">
          <h2 style="color:#0052FF;margin:0">Elevate Technology</h2>
          <p style="color:#64748b;font-size:13px;margin-top:4px">Password Reset Request</p>
        </div>
        <p style="font-size:15px;color:#1e293b">Hello <strong>${recipientName || 'Valued User'}</strong>,</p>
        <p style="font-size:13px;color:#475569;line-height:1.6">
          We received a request to reset your account password. Use the OTP below to continue. It expires in <strong>10 minutes</strong>.
        </p>
        <div style="background:#f8fafc;border:2px dashed #0052FF;border-radius:10px;padding:20px;text-align:center;margin:24px 0">
          <span style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:bold;letter-spacing:1px;display:block;margin-bottom:8px">Your One-Time Password (OTP)</span>
          <strong style="font-size:36px;color:#0052FF;font-family:monospace;letter-spacing:8px">${otp}</strong>
        </div>
        <p style="font-size:12px;color:#94a3b8">If you did not request this, please ignore this email. Your account remains secure.</p>
        <div style="border-top:1px solid #e2e8f0;margin-top:20px;padding-top:14px;text-align:center;font-size:11px;color:#94a3b8">
          Elevate Technology | +91 9922567375 | elevatetechnologies23@gmail.com
        </div>
      </div>
    `
  });
  console.log(`Password reset OTP email sent to ${toEmail}: ${info.messageId}`);
  return info;
};

// 1. Send License Key Issuance Email
export const sendLicenseKeyEmail = async (
  toEmail: string, 
  recipientName: string, 
  licenseKey: string, 
  productName: string, 
  validUntil: Date | string
) => {
  try {
    const transporter = await createTransporter();
    const formattedDate = new Date(validUntil).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const mailOptions = {
      from: `"Elevate Technology Software Licenses" <${process.env.SMTP_USER || 'no-reply@elevatetechnology.com'}>`,
      to: toEmail,
      subject: `🔑 Your Software License Key: ${productName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; border-b: 2px solid #0052FF; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #0052FF; margin: 0;">Elevate Technology</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Software License Fulfillment Notice</p>
          </div>
          
          <p style="font-size: 16px; color: #1e293b;">Dear <strong>${recipientName || 'Valued Client'}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Thank you for choosing Elevate Technology! Your software license key for <strong>${productName}</strong> has been issued and is ready for activation.
          </p>

          <div style="background-color: #f8fafc; border: 2px dashed #0052FF; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; text-transform: uppercase; color: #64748b; font-weight: bold; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your License Key</span>
            <strong style="font-size: 22px; color: #0052FF; font-family: monospace; letter-spacing: 2px;">${licenseKey}</strong>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; width: 40%;">Product Edition:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${productName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b;">Subscription Valid Until:</td>
              <td style="padding: 8px 0; color: #1e293b; font-weight: bold;">${formattedDate}</td>
            </tr>
          </table>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            Need help configuring your thermal printer or barcode scanner? Access your device activation portal in your <a href="https://elevatetechnology.com/dashboard" style="color: #0052FF; text-decoration: none; font-weight: bold;">Customer Dashboard</a>.
          </p>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
            Elevate Technology Helpdesk | Contact: +91 9922567375 | elevatetechnologies23@gmail.com
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`License Email dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send license email:', error);
    return false;
  }
};

// 2. Send Order Status Update Email
export const sendOrderStatusEmail = async (
  toEmail: string, 
  recipientName: string, 
  orderId: string, 
  orderStatus: string, 
  totalAmount: number
) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Elevate Technology Orders" <${process.env.SMTP_USER || 'no-reply@elevatetechnology.com'}>`,
      to: toEmail,
      subject: `📦 Order Status Update: ${orderStatus.toUpperCase()} (Ref #${orderId.slice(-8)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; border-b: 2px solid #0052FF; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #0052FF; margin: 0;">Elevate Technology</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Order Status Dispatch Notice</p>
          </div>
          
          <p style="font-size: 16px; color: #1e293b;">Hello <strong>${recipientName || 'Valued Customer'}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6;">
            Your order status has been updated to: <strong style="color: #0052FF; text-transform: uppercase;">${orderStatus}</strong>.
          </p>

          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #64748b;">Order Ref ID:</span>
              <span style="font-size: 13px; font-weight: bold; color: #1e293b;">#${orderId}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #64748b;">Current Status:</span>
              <span style="font-size: 13px; font-weight: bold; color: #0052FF; text-transform: uppercase;">${orderStatus}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 13px; color: #64748b;">Total Invoice Amount:</span>
              <span style="font-size: 13px; font-weight: bold; color: #1e293b;">INR ${totalAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            Track your order updates and download your GST invoice in your <a href="https://elevatetechnology.com/dashboard" style="color: #0052FF; font-weight: bold;">Account Dashboard</a>.
          </p>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
            Elevate Technology | Support: +91 9922567375 | elevatetechnologies23@gmail.com
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Order Email dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send order status email:', error);
    return false;
  }
};

// 3. Send Support Ticket Reply Email
export const sendTicketReplyEmail = async (
  toEmail: string, 
  recipientName: string, 
  ticketSubject: string, 
  replyMessage: string
) => {
  try {
    const transporter = await createTransporter();

    const mailOptions = {
      from: `"Elevate Support Helpdesk" <${process.env.SMTP_USER || 'support@elevatetechnology.com'}>`,
      to: toEmail,
      subject: `💬 Support Response: ${ticketSubject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; background-color: #ffffff;">
          <div style="text-align: center; border-b: 2px solid #0052FF; padding-bottom: 16px; margin-bottom: 24px;">
            <h2 style="color: #0052FF; margin: 0;">Elevate Technology Helpdesk</h2>
            <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Ticket Response Notification</p>
          </div>
          
          <p style="font-size: 16px; color: #1e293b;">Hello <strong>${recipientName || 'Valued Client'}</strong>,</p>
          <p style="font-size: 14px; color: #475569;">
            Our technical support team has replied to your ticket: <strong>"${ticketSubject}"</strong>.
          </p>

          <div style="background-color: #f1f5f9; border-left: 4px solid #0052FF; border-radius: 4px; padding: 16px; margin: 20px 0; font-size: 14px; color: #334155; line-height: 1.6;">
            <em>"${replyMessage}"</em>
          </div>

          <p style="font-size: 13px; color: #64748b;">
            View full conversation or reply back via your <a href="https://elevatetechnology.com/dashboard" style="color: #0052FF; font-weight: bold;">Support Portal</a>.
          </p>

          <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
            Elevate 24/7 Tech Support | +91 9922567375
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Ticket Email dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket email:', error);
    return false;
  }
};
