export interface EmailAttachment {
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
}
/**
 * Tạo URL để user authorize
 */
export declare function getAuthUrl(): string;
/**
 * Lưu credentials sau khi user authorize
 */
export declare function setCredentials(code: string): Promise<void>;
/**
 * Kiểm tra đã có credentials chưa
 */
export declare function hasCredentials(): boolean;
/**
 * Gửi email qua Gmail API
 */
export declare function sendEmail(to: string, subject: string, body: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
export declare const emailTemplates: {
    /**
     * Template email chào mừng merchant
     */
    welcome: (merchantName: string, phaseName: string) => string;
    /**
     * Template email thông báo hoàn thành onboarding
     */
    completed: (merchantName: string) => string;
    /**
     * Template email nhắc nhở cung cấp documents
     */
    reminder: (merchantName: string, missingDocs: string[]) => string;
    /**
     * Generic HTML template
     */
    custom: (title: string, content: string, footer?: string) => string;
};
export interface EmailOptions {
    to: string;
    subject: string;
    body: string;
    from?: string;
    appPassword?: string;
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    attachments?: EmailAttachment[];
}
/**
 * Gửi email nâng cao với CC, BCC, Reply-To và đính kèm file
 */
export declare function sendEmailAdvanced(options: EmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * Gửi email với template có sẵn
 */
export declare function sendTemplatedEmail(to: string, templateName: keyof typeof emailTemplates, templateData: Record<string, any>, options?: {
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string;
    attachments?: EmailAttachment[];
}): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
/**
 * Gửi email đơn giản (dùng App Password hoặc OAuth2)
 */
export declare function sendEmailSimple(to: string, subject: string, body: string, fromEmail?: string, appPassword?: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
}>;
//# sourceMappingURL=email.d.ts.map