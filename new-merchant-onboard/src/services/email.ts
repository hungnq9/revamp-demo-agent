import { google } from 'googleapis';
import nodemailer from 'nodemailer';

// Gmail OAuth2 config from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';

// Gmail App Password config (from environment)
const GMAIL_EMAIL = process.env.GMAIL_EMAIL || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

// OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

// Scopes for Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

// Store credentials in memory (for demo - in production, store in database/file)
let storedCredentials: any = null;

/**
 * Tạo URL để user authorize
 */
export function getAuthUrl(): string {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
}

/**
 * Lưu credentials sau khi user authorize
 */
export async function setCredentials(code: string): Promise<void> {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  storedCredentials = tokens;
  console.log('✅ Gmail credentials saved');
}

/**
 * Kiểm tra đã có credentials chưa
 */
export function hasCredentials(): boolean {
  const creds = storedCredentials || oauth2Client.credentials;
  return !!(creds && creds.access_token);
}

/**
 * Format email thành RFC 2822
 */
function makeBody(to: string, subject: string, message: string): string {
  const str = [
    `To: ${to}`,
    'Content-Type: text/html; charset="UTF-8"',
    'MIME-Version: 1.0',
    `Subject: ${subject}`,
    '',
    message,
  ].join('\n');

  return Buffer.from(str).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Gửi email qua Gmail API
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    // Get access token
    const accessToken = await oauth2Client.getAccessToken();

    // Send email using Gmail API directly
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const rawMessage = makeBody(to, subject, body);

    const result = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log(`✅ Email sent to ${to}: ${result.data.id}`);

    return {
      success: true,
      messageId: result.data.id as string,
    };
  } catch (error: any) {
    console.error('❌ Email send error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gửi email đơn giản (dùng App Password hoặc OAuth2)
 */
export async function sendEmailSimple(
  to: string,
  subject: string,
  body: string,
  fromEmail?: string,
  appPassword?: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  try {
    let transporter: nodemailer.Transporter;

    // Use env vars if not provided
    const email = fromEmail || GMAIL_EMAIL;
    const password = appPassword || GMAIL_APP_PASSWORD;

    if (email && password) {
      // Use App Password
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: email,
          pass: password,
        },
      } as any);
    } else {
      // Use OAuth2
      const creds = storedCredentials || oauth2Client.credentials;
      if (!creds?.access_token) {
        return {
          success: false,
          error: 'Chưa cấu hình Gmail. Vui lòng cấu hình GMAIL_EMAIL và GMAIL_APP_PASSWORD hoặc authorize qua OAuth2.',
        };
      }
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: email || 'me',
          clientId: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          refreshToken: creds?.refresh_token,
          accessToken: creds?.access_token,
        },
      } as any);
    }

    const result = await transporter.sendMail({
      from: email ? `"Merchant Onboarding" <${email}>` : 'me',
      to,
      subject,
      html: body,
    } as any);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error: any) {
    console.error('❌ Email send error:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}