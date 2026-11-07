// Client Service for SendGrid Email Operations & Receiver Desk
import axios from 'axios';
import { SmtpConfig, EmailLog, EmailTemplate, ReceiverThread } from '../types';

export interface TransferEmailPayload {
  senderEmail: string;
  senderName: string;
  senderAccount: string;
  recipientName: string;
  recipientEmail?: string;
  recipientAccount: string;
  bankName: string;
  amount: number | string;
  currency?: string;
  fee?: number | string;
  feeReason?: string;
  referenceId: string;
  timestamp?: string;
  description?: string;
}

export interface ChatEmailPayload {
  isFromAdmin: boolean;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  messageText: string;
  timestamp?: string;
}

export interface OfficialEmailPayload {
  userId: string;
  isFromAdmin: boolean;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  messageText: string;
  threadId?: string;
  timestamp?: string;
}

class EmailService {
  async getSmtpConfig(): Promise<SmtpConfig> {
    try {
      const res = await axios.get('/api/smtp/config');
      return res.data;
    } catch (e) {
      console.warn('Using fallback SMTP settings:', e);
      return {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        user: '',
        pass: '',
        fromName: 'ECONEST BANK Alert',
        fromEmail: 'notifications@econestbank.com',
        adminAlertEmail: 'bubucyril2@gmail.com',
        enabled: true,
      };
    }
  }

  async saveSmtpConfig(config: Partial<SmtpConfig>): Promise<{ success: boolean; config: SmtpConfig }> {
    const res = await axios.post('/api/smtp/config', config);
    return res.data;
  }

  async sendTestEmail(testEmail: string, configOverride?: Partial<SmtpConfig>): Promise<any> {
    const res = await axios.post('/api/smtp/test', { testEmail, configOverride });
    return res.data;
  }

  async sendTransferEmail(payload: TransferEmailPayload): Promise<any> {
    try {
      const res = await axios.post('/api/smtp/send-transfer-email', payload);
      return res.data;
    } catch (e: any) {
      console.warn('Non-blocking transfer email error:', e?.response?.data || e);
      return { success: false, error: e.message };
    }
  }

  async sendChatEmail(payload: ChatEmailPayload): Promise<any> {
    try {
      const res = await axios.post('/api/smtp/send-chat-email', payload);
      return res.data;
    } catch (e: any) {
      console.warn('Non-blocking chat email dispatch error:', e?.response?.data || e);
      return { success: false, error: e.message };
    }
  }

  async sendOfficialEmailMessage(payload: OfficialEmailPayload): Promise<any> {
    try {
      const res = await axios.post('/api/smtp/send-email-message', payload);
      return res.data;
    } catch (e: any) {
      console.warn('Non-blocking official email dispatch error:', e?.response?.data || e);
      return { success: false, error: e.message };
    }
  }

  async verifySendGridApiKey(apiKey: string, senderEmail?: string, senderName?: string): Promise<any> {
    const res = await axios.post('/api/sendgrid/verify', { apiKey, senderEmail, senderName });
    return res.data;
  }

  async verifySmtpConnection(configOverride?: Partial<SmtpConfig>): Promise<any> {
    const res = await axios.post('/api/smtp/verify', { configOverride });
    return res.data;
  }

  async getEmailTemplates(): Promise<EmailTemplate[]> {
    try {
      const res = await axios.get('/api/smtp/templates');
      return res.data.templates || [];
    } catch (e) {
      return [];
    }
  }

  async saveEmailTemplates(templates: EmailTemplate[]): Promise<any> {
    const res = await axios.post('/api/smtp/templates', { templates });
    return res.data;
  }

  async resetEmailTemplates(): Promise<any> {
    const res = await axios.post('/api/smtp/templates/reset');
    return res.data;
  }

  async sendCustomEmail(payload: {
    to: string;
    recipientName?: string;
    subject?: string;
    headline?: string;
    message: string;
    actionText?: string;
    actionUrl?: string;
    templateId?: string;
    metadataRows?: { label: string; value: string }[];
  }): Promise<any> {
    const res = await axios.post('/api/smtp/send-custom-email', payload);
    return res.data;
  }

  async sendReceiverCustomTransferEmail(params: {
    receiverEmail: string;
    receiverName: string;
    senderName: string;
    senderEmail?: string;
    amount: number | string;
    currency?: string;
    referenceId: string;
    bankName: string;
    feeAmount?: number | string;
    feeBreakdown?: string;
    customConfig?: {
      autoSendEnabled?: boolean;
      subject?: string;
      headline?: string;
      customMessage?: string;
      actionText?: string;
      actionUrl?: string;
    };
  }): Promise<any> {
    const config = params.customConfig;
    const curr = params.currency || 'USD';
    const rawSubject = config?.subject || `[ECONEST BANK] Inward Transfer Notice for {receiver_name} - Ref #{reference_id}`;
    const rawHeadline = config?.headline || 'Official Inward Capital Credit Advice';
    const rawMessage = config?.customMessage || `Dear {receiver_name},\n\nAn electronic transfer of {amount} {currency} has been initiated to your account at {bank_name} by {sender_name}.\n\nReference: #{reference_id}\n\nThank you,\nECONEST BANK`;

    const replacer = (str: string) => {
      return str
        .replace(/{receiver_name}/g, params.receiverName)
        .replace(/{recipient_name}/g, params.receiverName)
        .replace(/{receiver_email}/g, params.receiverEmail)
        .replace(/{sender_name}/g, params.senderName)
        .replace(/{sender_email}/g, params.senderEmail || '')
        .replace(/{amount}/g, Number(params.amount).toLocaleString(undefined, { minimumFractionDigits: 2 }))
        .replace(/{currency}/g, curr)
        .replace(/{reference_id}/g, params.referenceId)
        .replace(/{bank_name}/g, params.bankName)
        .replace(/{date}/g, new Date().toLocaleString())
        .replace(/{fee_amount}/g, params.feeAmount ? `$${Number(params.feeAmount).toFixed(2)}` : '$0.00')
        .replace(/{fee_breakdown}/g, params.feeBreakdown || '');
    };

    const finalSubject = replacer(rawSubject);
    const finalHeadline = replacer(rawHeadline);
    const finalMessage = replacer(rawMessage);

    return this.sendCustomEmail({
      to: params.receiverEmail,
      recipientName: params.receiverName,
      subject: finalSubject,
      headline: finalHeadline,
      message: finalMessage,
      actionText: config?.actionText || 'View Settlement Status',
      actionUrl: config?.actionUrl || '/login',
      metadataRows: [
        { label: 'Recipient Name', value: params.receiverName },
        { label: 'Recipient Email', value: params.receiverEmail },
        { label: 'Sender', value: `${params.senderName} (${params.senderEmail || 'ECONEST Client'})` },
        { label: 'Settlement Amount', value: `${Number(params.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${curr}` },
        { label: 'Reference ID', value: params.referenceId },
        { label: 'Crediting Bank', value: params.bankName }
      ]
    });
  }

  async getEmailLogs(): Promise<EmailLog[]> {
    try {
      const res = await axios.get('/api/smtp/logs');
      return res.data.logs || [];
    } catch (e) {
      return [];
    }
  }

  async clearEmailLogs(): Promise<void> {
    await axios.delete('/api/smtp/logs');
  }

  // ==================================================
  // SendGrid Two-Way Receiver Desk Methods
  // ==================================================
  async getReceiverThreads(): Promise<ReceiverThread[]> {
    try {
      const res = await axios.get('/api/sendgrid/threads');
      return res.data.threads || [];
    } catch (e) {
      console.warn('Could not load receiver threads:', e);
      return [];
    }
  }

  async getReceiverThread(threadId: string): Promise<ReceiverThread | null> {
    try {
      const res = await axios.get(`/api/sendgrid/threads/${encodeURIComponent(threadId)}`);
      return res.data.thread || null;
    } catch (e) {
      console.warn('Could not fetch thread:', e);
      return null;
    }
  }

  async sendReceiverMessage(payload: {
    threadId?: string;
    transactionId?: string;
    referenceId?: string;
    receiverEmail: string;
    receiverName?: string;
    senderName?: string;
    senderEmail?: string;
    amount?: number | string;
    currency?: string;
    bankName?: string;
    subject?: string;
    message: string;
    adminName?: string;
  }): Promise<{ success: boolean; message?: string; messageId?: string; simulated?: boolean; thread?: ReceiverThread; replyUrl?: string; error?: string }> {
    const res = await axios.post('/api/sendgrid/send-receiver-message', payload);
    return res.data;
  }

  async sendReceiverReply(payload: {
    threadId: string;
    token?: string;
    message: string;
    senderName?: string;
    senderEmail?: string;
  }): Promise<{ success: boolean; message?: string; thread?: ReceiverThread; error?: string }> {
    const res = await axios.post('/api/sendgrid/receiver-reply', payload);
    return res.data;
  }

  async markThreadRead(threadId: string): Promise<{ success: boolean }> {
    try {
      const res = await axios.post('/api/sendgrid/mark-read', { threadId });
      return res.data;
    } catch (e) {
      return { success: false };
    }
  }
}

export const emailService = new EmailService();
