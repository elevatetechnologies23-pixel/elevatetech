import nodemailer from 'nodemailer';

// Helper to send mail via HTTPS API (Resend or Brevo) or SMTP with cloud failover
export const sendMailWithFallback = async (mailOptions: nodemailer.SendMailOptions): Promise<nodemailer.SentMessageInfo> => {
  const to = Array.isArray(mailOptions.to) ? mailOptions.to[0] : (mailOptions.to as string);
  const subject = mailOptions.subject || '';
  const html = (mailOptions.html || '') as string;
  const text = (mailOptions.text || '') as string;

  // 1. If RESEND_API_KEY is configured, dispatch via HTTPS API (never blocked by Render free tier)
  if (process.env.RESEND_API_KEY) {
    try {
      const fromAddress = process.env.SMTP_FROM || 'Elevate Technology <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          subject,
          html,
          text
        })
      });
      if (res.ok) {
        const data: any = await res.json();
        console.log(`Email dispatched via Resend HTTPS API to ${to}:`, data.id);
        return { messageId: data.id, response: '250 OK via Resend API' } as any;
      }
    } catch (apiErr: any) {
      console.warn('Resend API dispatch failed, falling back to SMTP:', apiErr.message || apiErr);
    }
  }

  // 2. If BREVO_API_KEY is configured, dispatch via Brevo HTTPS API
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: 'Elevate Technology', email: process.env.SMTP_USER || 'elevatetechnologies23@gmail.com' },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text
        })
      });
      if (res.ok) {
        const data: any = await res.json();
        console.log(`Email dispatched via Brevo HTTPS API to ${to}:`, data.messageId);
        return { messageId: data.messageId, response: '250 OK via Brevo API' } as any;
      }
    } catch (apiErr: any) {
      console.warn('Brevo API dispatch failed, falling back to SMTP:', apiErr.message || apiErr);
    }
  }

  const user = (process.env.SMTP_USER || '').trim().replace(/["']/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/\s/g, '').replace(/["']/g, '');
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';

  if (!user || !pass) {
    const fallbackTransporter = await createTransporter();
    return fallbackTransporter.sendMail(mailOptions);
  }

  // 3. Try standard cloud submission port 587 with STARTTLS (allowed on Render/cloud networks)
  try {
    const t587 = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000
    });
    return await t587.sendMail(mailOptions);
  } catch (err587: any) {
    console.warn('Port 587 dispatch failed, attempting Port 465 fallback...', err587.message || err587);
    
    // 4. Fallback to port 465 SSL
    const t465 = nodemailer.createTransport({
      host,
      port: 465,
      secure: true,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000
    });
    return await t465.sendMail(mailOptions);
  }
};

// Create or return transporter using environment variables (defaulting to cloud-friendly port 587)
export const createTransporter = async (): Promise<nodemailer.Transporter> => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = (process.env.SMTP_USER || '').trim().replace(/["']/g, '');
  const pass = (process.env.SMTP_PASS || '').trim().replace(/\s/g, '').replace(/["']/g, '');
  const envPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const port = envPort === 465 ? 465 : 587;
  const secure = port === 465;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000
    });
  }

  // Fallback to test account (Ethereal) for dev/testing
  console.warn('⚠️ SMTP credentials not fully provided. Using temporary Ethereal test account.');
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });
};

// Verify SMTP connection and optionally send a test email
export const testSmtpConnection = async (toEmail?: string): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const from = process.env.SMTP_FROM || `"Elevate Technology" <${process.env.SMTP_USER || 'no-reply@elevatetechnology.com'}>`;
    
    if (toEmail) {
      const info = await sendMailWithFallback({
        from,
        to: toEmail,
        subject: '🧪 Elevate Technology SMTP Test Email',
        text: 'This is a test email confirming that Elevate Technology email dispatch is functioning properly over cloud-optimized port 587.',
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

    const transporter = await createTransporter();
    await transporter.verify();
    return { success: true, message: 'SMTP connection verified successfully!' };
  } catch (err: any) {
    return { success: false, message: err.message || 'SMTP Connection Failed', details: err };
  }
};

// Send OTP email for password reset
export const sendPasswordResetEmail = async (toEmail: string, recipientName: string, otp: string) => {
  try {
    const from = process.env.SMTP_FROM || `"Elevate Technology" <${process.env.SMTP_USER || 'elevatetechnologies23@gmail.com'}>`;

    const info = await sendMailWithFallback({
      from,
      to: toEmail,
      subject: `🔐 Your OTP Code is ${otp} — Elevate Technology`,
      text: `Hello ${recipientName || 'Valued User'},\n\nYour Elevate Technology password reset OTP is: ${otp}\n\nThis OTP expires in 10 minutes. If you did not request this, please ignore this email.`,
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
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
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

    const info = await sendMailWithFallback(mailOptions);
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

    const info = await sendMailWithFallback(mailOptions);
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

    const info = await sendMailWithFallback(mailOptions);
    console.log(`Ticket Email dispatched to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Failed to send ticket email:', error);
    return false;
  }
};
