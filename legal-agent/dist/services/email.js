"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailTemplates = void 0;
exports.getAuthUrl = getAuthUrl;
exports.setCredentials = setCredentials;
exports.hasCredentials = hasCredentials;
exports.sendEmail = sendEmail;
exports.sendEmailAdvanced = sendEmailAdvanced;
exports.sendTemplatedEmail = sendTemplatedEmail;
exports.sendEmailSimple = sendEmailSimple;
const googleapis_1 = require("googleapis");
const nodemailer_1 = __importDefault(require("nodemailer"));
// Gmail OAuth2 config from environment
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost';
// Gmail App Password config (from environment)
const GMAIL_EMAIL = process.env.GMAIL_EMAIL || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';
// Generic SMTP config (supports Outlook/Office365, etc.)
// Defaults to Gmail to preserve existing behaviour.
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
// OAuth2 client
const oauth2Client = new googleapis_1.google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
// Scopes for Gmail API
const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];
// Store credentials in memory (for demo - in production, store in database/file)
let storedCredentials = null;
/**
 * Tạo URL để user authorize
 */
function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
}
/**
 * Lưu credentials sau khi user authorize
 */
async function setCredentials(code) {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    storedCredentials = tokens;
    console.log('✅ Gmail credentials saved');
}
/**
 * Kiểm tra đã có credentials chưa
 */
function hasCredentials() {
    const creds = storedCredentials || oauth2Client.credentials;
    return !!(creds && creds.access_token);
}
/**
 * Format email thành RFC 2822
 */
function makeBody(to, subject, message) {
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
async function sendEmail(to, subject, body) {
    try {
        // Get access token
        const accessToken = await oauth2Client.getAccessToken();
        // Send email using Gmail API directly
        const gmail = googleapis_1.google.gmail({ version: 'v1', auth: oauth2Client });
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
            messageId: result.data.id,
        };
    }
    catch (error) {
        console.error('❌ Email send error:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}
// ============================================
// HTML Email Templates
// ============================================
exports.emailTemplates = {
    /**
     * Template email chào mừng merchant
     */
    welcome: (merchantName, phaseName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">🎉 Chào mừng ${merchantName}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6;">
        Xin chào <strong>${merchantName}</strong>,
      </p>
      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        Cảm ơn bạn đã đăng ký trở thành đối tác của chúng tôi! Hiện tại, hồ sơ của bạn đang ở giai đoạn:
      </p>

      <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <strong style="color: #667eea;">📋 Giai đoạn hiện tại:</strong>
        <p style="margin: 5px 0 0 0; color: #333333;">${phaseName}</p>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        Chúng tôi sẽ tiếp tục hỗ trợ bạn trong quá trình onboarding. Nếu có câu hỏi, vui lòng liên hệ đến đội ngũ hỗ trợ.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2026 ZaloPay Merchant Onboarding. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    /**
     * Template email thông báo hoàn thành onboarding
     */
    completed: (merchantName) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Onboarding Hoàn tất!</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6;">
        Xin chào <strong>${merchantName}</strong>,
      </p>
      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        Chúc mừng! Hồ sơ đăng ký của bạn đã được phê duyệt và hoàn tất quá trình onboarding.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <span style="font-size: 48px;">🎊</span>
      </div>

      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        Giờ đây bạn có thể bắt đầu sử dụng các dịch vụ của ZaloPay. Đội ngũ hỗ trợ sẽ liên hệ với bạn trong thời gian sớm nhất.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2026 ZaloPay Merchant Onboarding. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    /**
     * Template email nhắc nhở cung cấp documents
     */
    reminder: (merchantName, missingDocs) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">⏰ Nhắc nhở cung cấp tài liệu</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333333; font-size: 16px; line-height: 1.6;">
        Xin chào <strong>${merchantName}</strong>,
      </p>
      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        Chúng tôi nhận thấy bạn còn thiếu một số tài liệu cần thiết. Vui lòng bổ sung sớm nhất có thể:
      </p>

      <ul style="background-color: #fff3cd; padding: 15px 15px 15px 35px; border-radius: 4px; margin: 20px 0;">
        ${missingDocs.map(doc => `<li style="color: #856404; margin: 5px 0;">${doc}</li>`).join('')}
      </ul>

      <p style="color: #666666; font-size: 14px; line-height: 1.6;">
        Nếu bạn cần hỗ trợ, vui lòng liên hệ đội ngũ chúng tôi.
      </p>
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        © 2026 ZaloPay Merchant Onboarding. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`,
    /**
     * Generic HTML template
     */
    custom: (title, content, footer) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 24px;">${title}</h1>
    </div>

    <!-- Content -->
    <div style="padding: 30px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
      <p style="color: #999999; font-size: 12px; margin: 0;">
        ${footer || '© 2026 ZaloPay Merchant Onboarding. All rights reserved.'}
      </p>
    </div>
  </div>
</body>
</html>`,
};
/**
 * Gửi email nâng cao với CC, BCC, Reply-To và đính kèm file
 */
async function sendEmailAdvanced(options) {
    const { to, subject, body, from, appPassword, cc, bcc, replyTo, attachments, } = options;
    try {
        // Get config
        const email = from || GMAIL_EMAIL;
        const password = appPassword || GMAIL_APP_PASSWORD;
        if (!email || !password) {
            return {
                success: false,
                error: 'Thiếu cấu hình email. Vui lòng cấu hình GMAIL_EMAIL và GMAIL_APP_PASSWORD.',
            };
        }
        // Create transporter
        const transporter = nodemailer_1.default.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: email,
                pass: password,
            },
        });
        // Build mail options
        const mailOptions = {
            from: `"Merchant Onboarding" <${email}>`,
            to,
            subject,
            html: body,
        };
        // Add CC
        if (cc) {
            mailOptions.cc = Array.isArray(cc) ? cc.join(', ') : cc;
        }
        // Add BCC
        if (bcc) {
            mailOptions.bcc = Array.isArray(bcc) ? bcc.join(', ') : bcc;
        }
        // Add Reply-To
        if (replyTo) {
            mailOptions.replyTo = replyTo;
        }
        // Add attachments
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments.map(att => {
                const attachment = {
                    filename: att.filename,
                };
                // Either use content buffer or file path
                if (att.content) {
                    attachment.content = att.content;
                }
                else if (att.path) {
                    attachment.path = att.path;
                }
                if (att.contentType) {
                    attachment.contentType = att.contentType;
                }
                return attachment;
            });
        }
        // Send email
        const result = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}${cc ? `, CC: ${mailOptions.cc}` : ''}${bcc ? `, BCC: ${mailOptions.bcc}` : ''}`);
        return {
            success: true,
            messageId: result.messageId,
        };
    }
    catch (error) {
        console.error('❌ Email send error:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}
/**
 * Gửi email với template có sẵn
 */
async function sendTemplatedEmail(to, templateName, templateData, options) {
    const template = exports.emailTemplates[templateName];
    if (!template) {
        return {
            success: false,
            error: `Template "${templateName}" không tồn tại`,
        };
    }
    // Generate subject based on template
    const subjects = {
        welcome: '🎉 Chào mừng đến với ZaloPay Merchant!',
        completed: '✅ Chúc mừng! Onboarding hoàn tất',
        reminder: '⏰ Nhắc nhở: Cần bổ sung tài liệu',
        custom: 'Thông báo từ ZaloPay',
    };
    // @ts-ignore - Template is a function
    const htmlBody = template(...Object.values(templateData));
    const subject = subjects[templateName] || 'Thông báo';
    return sendEmailAdvanced({
        to,
        subject,
        body: htmlBody,
        cc: options?.cc,
        bcc: options?.bcc,
        replyTo: options?.replyTo,
        attachments: options?.attachments,
    });
}
/**
 * Gửi email đơn giản (dùng App Password hoặc OAuth2)
 */
async function sendEmailSimple(to, subject, body, fromEmail, appPassword) {
    try {
        let transporter;
        // Use env vars if not provided (SMTP_* takes priority, falls back to Gmail)
        const email = fromEmail || SMTP_USER || GMAIL_EMAIL;
        const password = appPassword || SMTP_PASS || GMAIL_APP_PASSWORD;
        if (email && password) {
            // Use SMTP with username + (app) password — works for Gmail, Outlook/Office365, etc.
            transporter = nodemailer_1.default.createTransport({
                host: SMTP_HOST,
                port: SMTP_PORT,
                secure: SMTP_PORT === 465, // 465 = SSL, 587 = STARTTLS
                requireTLS: SMTP_PORT === 587,
                auth: {
                    user: email,
                    pass: password,
                },
            });
        }
        else {
            // Use OAuth2
            const creds = storedCredentials || oauth2Client.credentials;
            if (!creds?.access_token) {
                return {
                    success: false,
                    error: 'Chưa cấu hình Gmail. Vui lòng cấu hình GMAIL_EMAIL và GMAIL_APP_PASSWORD hoặc authorize qua OAuth2.',
                };
            }
            transporter = nodemailer_1.default.createTransport({
                service: 'gmail',
                auth: {
                    type: 'OAuth2',
                    user: email || 'me',
                    clientId: GOOGLE_CLIENT_ID,
                    clientSecret: GOOGLE_CLIENT_SECRET,
                    refreshToken: creds?.refresh_token,
                    accessToken: creds?.access_token,
                },
            });
        }
        const result = await transporter.sendMail({
            from: email ? `"Merchant Onboarding" <${email}>` : 'me',
            to,
            subject,
            html: body,
        });
        return {
            success: true,
            messageId: result.messageId,
        };
    }
    catch (error) {
        console.error('❌ Email send error:', error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}
//# sourceMappingURL=email.js.map