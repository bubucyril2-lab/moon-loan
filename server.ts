import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const PORT = 3000;
export const app = express();

app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
// Configure multer
const upload = multer({ storage });

// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// ==========================================
// SendGrid Exclusive Email Dispatch Engine
// ==========================================
import sgMail from '@sendgrid/mail';

export interface ReceiverThreadMessage {
  id: string;
  senderType: 'admin' | 'receiver';
  senderName: string;
  senderEmail: string;
  subject: string;
  message: string;
  timestamp: string;
  deliveredVia?: string;
}

export interface ReceiverThread {
  threadId: string;
  transactionId?: string;
  referenceId: string;
  receiverEmail: string;
  receiverName: string;
  senderName: string;
  senderEmail: string;
  amount: number | string;
  currency: string;
  bankName: string;
  replyToken: string;
  hasUnreadReply: boolean;
  lastUpdated: string;
  messages: ReceiverThreadMessage[];
}

interface SmtpConfigState {
  provider: 'sendgrid';
  sendgridApiKey: string;
  sendgridSenderEmail: string;
  sendgridSenderName: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  adminAlertEmail: string;
  enabled: boolean;
  autoDispatchEnabled?: boolean;
  autoSendTransferReceipt?: boolean;
  autoSendWelcomeEmail?: boolean;
  autoSendAdminTransferAlert?: boolean;
  autoSendChatNotification?: boolean;
}

export interface ServerEmailTemplate {
  id: string;
  name: string;
  category: 'transfer' | 'welcome' | 'notice' | 'security' | 'statement' | 'custom';
  description: string;
  subject: string;
  headline: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  isEnabled: boolean;
}

const smtpConfigFile = path.join(process.cwd(), 'uploads', 'smtp-config.json');
const emailTemplatesFile = path.join(process.cwd(), 'uploads', 'email-templates.json');
const receiverThreadsFile = path.join(process.cwd(), 'uploads', 'receiver-threads.json');

// Receiver threads persistence
function loadReceiverThreads(): ReceiverThread[] {
  try {
    if (fs.existsSync(receiverThreadsFile)) {
      const data = fs.readFileSync(receiverThreadsFile, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Could not load receiver-threads.json:', err);
  }
  return [];
}

function saveReceiverThreads(threads: ReceiverThread[]) {
  try {
    fs.writeFileSync(receiverThreadsFile, JSON.stringify(threads, null, 2));
  } catch (err) {
    console.error('Error saving receiver-threads.json:', err);
  }
}

function getOrCreateReceiverThread(params: {
  referenceId: string;
  receiverEmail: string;
  receiverName?: string;
  senderName?: string;
  senderEmail?: string;
  amount?: number | string;
  currency?: string;
  bankName?: string;
  transactionId?: string;
}): ReceiverThread {
  const threads = loadReceiverThreads();
  const cleanEmail = (params.receiverEmail || '').trim().toLowerCase();
  const cleanRef = (params.referenceId || '').trim();

  // Try finding by referenceId or by receiverEmail
  let thread = threads.find(t => 
    (cleanRef && t.referenceId === cleanRef) ||
    (cleanEmail && t.receiverEmail.toLowerCase() === cleanEmail && (!cleanRef || t.referenceId === cleanRef))
  );

  if (!thread) {
    const threadId = 'th_' + (cleanRef || Math.random().toString(36).substr(2, 9));
    const replyToken = 'tok_' + Math.random().toString(36).substr(2, 12);
    thread = {
      threadId,
      transactionId: params.transactionId,
      referenceId: cleanRef || 'TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      receiverEmail: params.receiverEmail,
      receiverName: params.receiverName || 'Recipient',
      senderName: params.senderName || 'ECONEST Customer',
      senderEmail: params.senderEmail || '',
      amount: params.amount || 0,
      currency: params.currency || 'USD',
      bankName: params.bankName || 'Beneficiary Bank',
      replyToken,
      hasUnreadReply: false,
      lastUpdated: new Date().toISOString(),
      messages: []
    };
    threads.unshift(thread);
    saveReceiverThreads(threads);
  } else {
    // Update metadata if newly available
    let changed = false;
    if (params.receiverName && !thread.receiverName) { thread.receiverName = params.receiverName; changed = true; }
    if (params.senderName && !thread.senderName) { thread.senderName = params.senderName; changed = true; }
    if (params.amount && !thread.amount) { thread.amount = params.amount; changed = true; }
    if (params.bankName && !thread.bankName) { thread.bankName = params.bankName; changed = true; }
    if (changed) saveReceiverThreads(threads);
  }

  return thread;
}

let currentSmtpConfig: SmtpConfigState = {
  provider: 'sendgrid', // Exclusive SendGrid engine
  sendgridApiKey: process.env.SENDGRID_API_KEY || '',
  sendgridSenderEmail: process.env.SENDGRID_FROM_EMAIL || 'notifications@econestbank.com',
  sendgridSenderName: process.env.SENDGRID_FROM_NAME || 'ECONEST BANK Alert',
  host: 'smtp.sendgrid.net',
  port: 587,
  secure: false,
  user: 'apikey',
  pass: '',
  fromName: 'ECONEST BANK Alert',
  fromEmail: 'notifications@econestbank.com',
  adminAlertEmail: process.env.ADMIN_ALERT_EMAIL || 'bubucyril2@gmail.com',
  enabled: true,
  autoDispatchEnabled: true,
  autoSendTransferReceipt: true,
  autoSendWelcomeEmail: true,
  autoSendAdminTransferAlert: true,
  autoSendChatNotification: true,
};

// Default Customizable Email Templates
const defaultEmailTemplates: ServerEmailTemplate[] = [
  {
    id: 'transfer_receipt',
    name: 'Customer Debit Advice & Transfer Receipt',
    category: 'transfer',
    description: 'Automatically dispatched to the sender or receiver email immediately upon fund transfer.',
    subject: '[ECONEST BANK] Electronic Debit Advice - Transfer Ref #{reference}',
    headline: 'Debit Notification & Official Transaction Summary',
    message: 'Dear {name},\n\nYour recent electronic fund transfer of {amount} has been successfully processed by the ECONEST BANK clearing gateway.\n\nAll security verifications were completed. Your updated available account balance is displayed on your customer dashboard.\n\nThank you for choosing ECONEST BANK.',
    actionText: 'View Dashboard & Receipt',
    actionUrl: '/dashboard',
    isEnabled: true
  },
  {
    id: 'welcome_onboard',
    name: 'New Customer Welcome & Onboarding Package',
    category: 'welcome',
    description: 'Sent to newly registered customers with their digital banking activation details.',
    subject: 'Welcome to ECONEST BANK - Your Digital Account Is Active',
    headline: 'Welcome to Next-Generation Digital Banking',
    message: 'Dear {name},\n\nWe are delighted to welcome you to ECONEST BANK. Your secure digital account has been created and verified.\n\nYou now have immediate access to real-time international wire transfers, multi-currency accounts, and instant loan applications.\n\nProtect your login credentials and never share your PIN or passwords with anyone.',
    actionText: 'Access Your Account',
    actionUrl: '/login',
    isEnabled: true
  },
  {
    id: 'security_alert',
    name: 'Security Alert & Account Verification',
    category: 'security',
    description: 'Direct security advisories, sign-in alerts, or fraud protection advisories.',
    subject: '[SECURITY NOTICE] Priority Account Security Advisory',
    headline: 'ECONEST Fraud Prevention & Account Security Notice',
    message: 'Dear {name},\n\nThis is an authorized security update regarding your ECONEST BANK digital profile.\n\nOur automated security monitors detected an account update or transaction inquiry. If this was initiated by you, no further action is necessary.\n\nIf you did not authorize this action, please access your security center immediately or reach our 24/7 fraud response team.',
    actionText: 'Review Security Center',
    actionUrl: '/dashboard/security',
    isEnabled: true
  },
  {
    id: 'admin_broadcast',
    name: 'Administrative Bank Notice & Priority Advisory',
    category: 'notice',
    description: 'Customized notifications sent by administrators to specific customer emails.',
    subject: '[OFFICIAL NOTICE] Important Advisory from ECONEST BANK Administration',
    headline: 'Executive Banking Communication',
    message: 'Dear {name},\n\nPlease review this official notice regarding your account services with ECONEST BANK.\n\nOur executive administration team has prepared this advisory to keep you informed of your current status, regulatory updates, or requested services.\n\nFor any questions or personalized assistance, feel free to reply directly to this email or chat with our desk.',
    actionText: 'Open Customer Portal',
    actionUrl: '/dashboard',
    isEnabled: true
  },
  {
    id: 'custom_direct',
    name: 'Custom Direct Message to Receiver',
    category: 'custom',
    description: 'Flexible template used when admin enters any receiver email and sends custom message.',
    subject: '[ECONEST BANK] Official Notification for {name}',
    headline: 'Official Banking Notification',
    message: 'Dear {name},\n\nThis is a customized notification dispatched directly from ECONEST BANK Administration.\n\nPlease refer to the details below regarding your banking relationship, pending request, or documentation.\n\nWe remain committed to delivering the highest level of private banking security.',
    actionText: 'Login to Portal',
    actionUrl: '/login',
    isEnabled: true
  }
];

let currentEmailTemplates: ServerEmailTemplate[] = [...defaultEmailTemplates];

// Load saved SMTP config if exists
try {
  if (fs.existsSync(smtpConfigFile)) {
    const raw = fs.readFileSync(smtpConfigFile, 'utf-8');
    currentSmtpConfig = { ...currentSmtpConfig, ...JSON.parse(raw) };
  }
} catch (e) {
  console.warn('Could not read existing smtp-config.json:', e);
}

// Load saved email templates if exists
try {
  if (fs.existsSync(emailTemplatesFile)) {
    const raw = fs.readFileSync(emailTemplatesFile, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      currentEmailTemplates = parsed;
    }
  }
} catch (e) {
  console.warn('Could not read existing email-templates.json:', e);
}

interface StoredEmailLog {
  id: string;
  type: 'transfer' | 'chat_customer' | 'chat_admin' | 'test' | 'custom' | 'welcome' | 'notice';
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  bodyPreview: string;
  timestamp: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

const emailLogs: StoredEmailLog[] = [];

function recordEmailLog(log: Omit<StoredEmailLog, 'id' | 'timestamp'>) {
  const item: StoredEmailLog = {
    id: 'EML-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
    timestamp: new Date().toISOString(),
    ...log
  };
  emailLogs.unshift(item);
  if (emailLogs.length > 100) emailLogs.pop();
  return item;
}

// SendGrid Exclusive Email Dispatch Engine
async function dispatchEmailViaProvider(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  senderName?: string;
  senderEmail?: string;
  logType: 'transfer' | 'chat_customer' | 'chat_admin' | 'test' | 'custom' | 'welcome' | 'notice';
  metadata?: Record<string, any>;
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean; provider: string; error?: string; log: StoredEmailLog }> {
  const config = currentSmtpConfig;
  const fromEmail = options.senderEmail || config.sendgridSenderEmail || config.fromEmail || 'notifications@econestbank.com';
  const fromName = options.senderName || config.sendgridSenderName || config.fromName || 'ECONEST BANK Alert';
  const replyTo = options.replyTo || config.adminAlertEmail || fromEmail;

  if (!config.sendgridApiKey) {
    const log = recordEmailLog({
      type: options.logType,
      to: options.to,
      from: `${fromName} <${fromEmail}>`,
      replyTo,
      subject: options.subject,
      bodyPreview: `Simulated SendGrid email to ${options.to}: ${options.subject} (SendGrid API key pending setup in Admin Settings)`,
      status: 'simulated',
      metadata: { provider: 'sendgrid', ...options.metadata }
    });
    return {
      success: true,
      simulated: true,
      provider: 'sendgrid',
      error: 'SendGrid API key pending configuration. Please enter your SendGrid API key in Admin Settings.',
      log
    };
  }

  try {
    sgMail.setApiKey(config.sendgridApiKey.trim());
    const [response] = await sgMail.send({
      to: options.to,
      from: {
        email: fromEmail,
        name: fromName
      },
      replyTo,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });

    const messageId = (response?.headers && (response.headers['x-message-id'] as string)) || `sg_${Date.now()}`;
    const log = recordEmailLog({
      type: options.logType,
      to: options.to,
      from: `${fromName} <${fromEmail}>`,
      replyTo,
      subject: options.subject,
      bodyPreview: `Delivered via SendGrid: ${options.subject}`,
      status: 'sent',
      metadata: { provider: 'sendgrid', messageId, statusCode: response.statusCode, ...options.metadata }
    });

    return {
      success: true,
      simulated: false,
      messageId,
      provider: 'sendgrid',
      log
    };
  } catch (err: any) {
    const errMsg = (err.response && err.response.body && err.response.body.errors && err.response.body.errors[0]?.message) 
      || err.message 
      || 'SendGrid dispatch error';
    const log = recordEmailLog({
      type: options.logType,
      to: options.to,
      from: `${fromName} <${fromEmail}>`,
      replyTo,
      subject: options.subject,
      bodyPreview: `Failed sending via SendGrid to ${options.to}: ${errMsg}`,
      status: 'failed',
      error: errMsg,
      metadata: { provider: 'sendgrid', ...options.metadata }
    });

    return {
      success: false,
      simulated: false,
      provider: 'sendgrid',
      error: errMsg,
      log
    };
  }
}

// Helper to construct modern branded HTML emails
function buildBrandedHtmlEmail(options: {
  headline: string;
  bodyHtml: string;
  actionText?: string;
  actionUrl?: string;
  metadataRows?: { label: string; value: string }[];
  footerNote?: string;
}) {
  const actionButton = options.actionText && options.actionUrl ? `
    <div style="margin: 28px 0; text-align: center;">
      <a href="${options.actionUrl}" style="background: #059669; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.25);">
        ${options.actionText}
      </a>
    </div>
  ` : '';

  const metaTable = options.metadataRows && options.metadataRows.length > 0 ? `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        ${options.metadataRows.map(row => `
          <tr style="border-bottom: 1px solid #edf2f7;">
            <td style="padding: 7px 0; color: #64748b; width: 140px; font-weight: 500;">${row.label}:</td>
            <td style="padding: 7px 0; color: #0f172a; font-weight: 700;">${row.value}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  ` : '';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">ECONEST BANK</h1>
          <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase;">Official Advisory</span>
        </div>
        <p style="color: #10b981; margin: 4px 0 0; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
          ${options.headline}
        </p>
      </div>

      <div style="font-size: 14px; color: #334155; line-height: 1.65; white-space: pre-line;">
        ${options.bodyHtml}
      </div>

      ${metaTable}
      ${actionButton}

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        <p style="margin: 0 0 6px;">
          ${options.footerNote || 'This communication was generated automatically by the ECONEST BANK Core Banking & Notification Gateway. If you received this in error, please disregard.'}
        </p>
        <p style="margin: 0;">&copy; 2026 ECONEST BANK. Regulated Financial Institution. All rights reserved.</p>
      </div>
    </div>
  `;
}

// Get Email & SendGrid Configuration
app.get('/api/smtp/config', (req, res) => {
  res.json({
    ...currentSmtpConfig,
    hasPassword: Boolean(currentSmtpConfig.pass),
    hasSendgridKey: Boolean(currentSmtpConfig.sendgridApiKey),
    maskedSendgridApiKey: currentSmtpConfig.sendgridApiKey
      ? (currentSmtpConfig.sendgridApiKey.length > 8
          ? currentSmtpConfig.sendgridApiKey.slice(0, 7) + '...' + currentSmtpConfig.sendgridApiKey.slice(-4)
          : 'SG.***')
      : ''
  });
});

// Update Email & SendGrid Configuration
app.post('/api/smtp/config', (req, res) => {
  try {
    const updates = req.body;
    currentSmtpConfig = {
      ...currentSmtpConfig,
      ...updates,
      provider: updates.provider || currentSmtpConfig.provider || 'sendgrid',
      sendgridApiKey: updates.sendgridApiKey !== undefined ? updates.sendgridApiKey.trim() : currentSmtpConfig.sendgridApiKey,
      sendgridSenderEmail: updates.sendgridSenderEmail !== undefined ? updates.sendgridSenderEmail.trim() : currentSmtpConfig.sendgridSenderEmail,
      sendgridSenderName: updates.sendgridSenderName !== undefined ? updates.sendgridSenderName.trim() : currentSmtpConfig.sendgridSenderName,
      port: Number(updates.port) || 465,
      secure: Boolean(updates.secure),
      enabled: updates.enabled !== undefined ? Boolean(updates.enabled) : true,
      autoDispatchEnabled: updates.autoDispatchEnabled !== undefined ? Boolean(updates.autoDispatchEnabled) : true,
      autoSendTransferReceipt: updates.autoSendTransferReceipt !== undefined ? Boolean(updates.autoSendTransferReceipt) : true,
      autoSendWelcomeEmail: updates.autoSendWelcomeEmail !== undefined ? Boolean(updates.autoSendWelcomeEmail) : true,
      autoSendAdminTransferAlert: updates.autoSendAdminTransferAlert !== undefined ? Boolean(updates.autoSendAdminTransferAlert) : true,
      autoSendChatNotification: updates.autoSendChatNotification !== undefined ? Boolean(updates.autoSendChatNotification) : true,
    };
    fs.writeFileSync(smtpConfigFile, JSON.stringify(currentSmtpConfig, null, 2));
    res.json({
      success: true,
      config: {
        ...currentSmtpConfig,
        hasPassword: Boolean(currentSmtpConfig.pass),
        hasSendgridKey: Boolean(currentSmtpConfig.sendgridApiKey)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save email configuration' });
  }
});

// Verify SendGrid API Key directly against SendGrid API
app.post('/api/sendgrid/verify', async (req, res) => {
  const { apiKey, senderEmail, senderName } = req.body;
  const keyToTest = (apiKey || currentSmtpConfig.sendgridApiKey || '').trim();

  if (!keyToTest) {
    return res.status(400).json({
      success: false,
      error: 'SendGrid API key is required to perform validation.'
    });
  }

  try {
    const response = await axios.get('https://api.sendgrid.com/v3/scopes', {
      headers: {
        Authorization: `Bearer ${keyToTest}`
      },
      timeout: 10000
    });

    if (response.status === 200) {
      if (apiKey) {
        currentSmtpConfig.sendgridApiKey = keyToTest;
        if (senderEmail) currentSmtpConfig.sendgridSenderEmail = senderEmail.trim();
        if (senderName) currentSmtpConfig.sendgridSenderName = senderName.trim();
        fs.writeFileSync(smtpConfigFile, JSON.stringify(currentSmtpConfig, null, 2));
      }

      return res.json({
        success: true,
        message: 'SendGrid API key validated successfully! Outgoing email dispatch is active.',
        scopesCount: Array.isArray(response.data?.scopes) ? response.data.scopes.length : 0
      });
    }

    res.status(400).json({
      success: false,
      error: 'Unexpected response from SendGrid verification API.'
    });
  } catch (err: any) {
    const apiError = err.response?.data?.errors?.[0]?.message 
      || (err.response?.status === 401 ? 'Unauthorized: The SendGrid API key is invalid or lacks permissions. Make sure it starts with "SG.".' : err.message);
    res.status(err.response?.status || 500).json({
      success: false,
      error: apiError
    });
  }
});

// Connection Verification (Strictly SendGrid API)
app.post('/api/smtp/verify', async (req, res) => {
  const { configOverride } = req.body;
  const config = configOverride ? { ...currentSmtpConfig, ...configOverride } : currentSmtpConfig;
  const keyToTest = (config.sendgridApiKey || '').trim();

  if (!keyToTest) {
    return res.status(400).json({
      success: false,
      error: 'Please enter your SendGrid API Key (starts with SG...) to verify connection.'
    });
  }

  try {
    const response = await axios.get('https://api.sendgrid.com/v3/scopes', {
      headers: { Authorization: `Bearer ${keyToTest}` },
      timeout: 10000
    });
    return res.json({
      success: true,
      message: 'SendGrid API connection handshake successful! Real email delivery is verified.'
    });
  } catch (err: any) {
    const apiError = err.response?.data?.errors?.[0]?.message 
      || (err.response?.status === 401 ? 'Unauthorized: SendGrid API key is invalid or revoked.' : err.message);
    return res.status(500).json({
      success: false,
      error: apiError
    });
  }
});

// Get Customizable Email Templates
app.get('/api/smtp/templates', (req, res) => {
  res.json({ templates: currentEmailTemplates });
});

// Save Customizable Email Templates
app.post('/api/smtp/templates', (req, res) => {
  try {
    const { templates } = req.body;
    if (Array.isArray(templates)) {
      currentEmailTemplates = templates;
      fs.writeFileSync(emailTemplatesFile, JSON.stringify(currentEmailTemplates, null, 2));
      return res.json({ success: true, templates: currentEmailTemplates });
    }
    res.status(400).json({ error: 'Invalid templates array payload' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save email templates' });
  }
});

// Reset Templates to Default
app.post('/api/smtp/templates/reset', (req, res) => {
  try {
    currentEmailTemplates = [...defaultEmailTemplates];
    fs.writeFileSync(emailTemplatesFile, JSON.stringify(currentEmailTemplates, null, 2));
    res.json({ success: true, templates: currentEmailTemplates });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to reset email templates' });
  }
});

// Send Direct Customized Message to Receiver Email (SendGrid / SMTP)
app.post('/api/smtp/send-custom-email', async (req, res) => {
  const {
    to,
    recipientName = 'Customer',
    subject,
    headline,
    message,
    actionText,
    actionUrl,
    templateId,
    metadataRows
  } = req.body;

  if (!to || !to.includes('@')) {
    return res.status(400).json({ error: 'Valid receiver email address is required' });
  }

  const config = currentSmtpConfig;
  const finalSubject = subject || `[ECONEST BANK] Official Notification for ${recipientName}`;
  const finalHeadline = headline || 'Important Banking Notice';
  const finalMessage = (message || 'Please review your account details on the ECONEST BANK portal.')
    .replace(/{name}/g, recipientName)
    .replace(/{email}/g, to)
    .replace(/{bank_name}/g, 'ECONEST BANK')
    .replace(/{date}/g, new Date().toLocaleDateString());

  const htmlContent = buildBrandedHtmlEmail({
    headline: finalHeadline,
    bodyHtml: finalMessage.replace(/\n/g, '<br/>'),
    actionText: actionText || 'Access Portal',
    actionUrl: actionUrl || 'https://econestbank.com/login',
    metadataRows: metadataRows || [
      { label: 'Recipient Email', value: to },
      { label: 'Timestamp', value: new Date().toUTCString() },
      { label: 'Status', value: 'OFFICIAL NOTICE' }
    ]
  });

  const result = await dispatchEmailViaProvider({
    to,
    subject: finalSubject,
    html: htmlContent,
    text: `${finalHeadline}\n\n${finalMessage}\n\nECONEST BANK - Real Delivery`,
    replyTo: config.adminAlertEmail || config.fromEmail,
    logType: 'custom',
    metadata: { recipientName, templateId }
  });

  if (result.simulated) {
    return res.json({
      success: true,
      simulated: true,
      provider: result.provider,
      message: result.error || 'Email recorded in system logs (SendGrid API key pending).',
      log: result.log
    });
  }

  if (!result.success) {
    return res.status(500).json({
      success: false,
      provider: result.provider,
      error: result.error || 'Email dispatch failed',
      log: result.log
    });
  }

  res.json({
    success: true,
    messageId: result.messageId,
    recipient: to,
    provider: result.provider,
    message: `Real email successfully delivered to ${to} via ${result.provider === 'sendgrid' ? 'SendGrid' : config.host}`,
    log: result.log
  });
});

// Send Test Email with Real Diagnostics (SendGrid / SMTP)
app.post('/api/smtp/test', async (req, res) => {
  const { testEmail, configOverride } = req.body;
  const config = configOverride ? { ...currentSmtpConfig, ...configOverride } : currentSmtpConfig;
  const recipient = testEmail || config.adminAlertEmail || 'bubucyril2@gmail.com';
  const isSendGrid = (config.provider || 'sendgrid') === 'sendgrid' || Boolean(config.sendgridApiKey);

  const subject = `[ECONEST BANK] ${isSendGrid ? 'SendGrid' : 'SMTP'} Delivery Test`;
  const htmlContent = buildBrandedHtmlEmail({
    headline: `${isSendGrid ? 'SENDGRID' : 'ENTERPRISE MAIL'} DELIVERY VERIFICATION`,
    bodyHtml: `Hello Administrator,\n\nThis confirmation verifies that your email notification gateway (${isSendGrid ? 'SendGrid API' : 'SMTP Relay'}) is properly connected and operating.\n\nAll automated transfer receipts, admin advisories, and real customer emails are active.`,
    metadataRows: [
      { label: 'Provider', value: isSendGrid ? 'SendGrid v3 Mail API' : 'SMTP Relay' },
      { label: 'Sender Identity', value: isSendGrid ? `${config.sendgridSenderName || config.fromName} <${config.sendgridSenderEmail || config.fromEmail}>` : `${config.fromName} <${config.fromEmail || config.user}>` },
      { label: 'Destination', value: recipient },
      { label: 'Timestamp', value: new Date().toUTCString() }
    ],
    actionText: 'View Admin Settings',
    actionUrl: '/admin/settings'
  });

  const result = await dispatchEmailViaProvider({
    to: recipient,
    subject,
    html: htmlContent,
    text: `ECONEST BANK Delivery Test: Connection successful on ${new Date().toISOString()}`,
    logType: 'test',
    metadata: { testEmail: recipient }
  });

  if (result.simulated) {
    return res.json({
      success: true,
      simulated: true,
      provider: result.provider,
      message: result.error || 'Email credentials not yet configured. Simulated test email logged successfully.',
      log: result.log
    });
  }

  if (!result.success) {
    return res.status(500).json({
      success: false,
      provider: result.provider,
      error: result.error || 'Test email delivery failed',
      log: result.log
    });
  }

  res.json({
    success: true,
    messageId: result.messageId,
    provider: result.provider,
    message: `Real test email successfully sent to ${recipient} via ${result.provider === 'sendgrid' ? 'SendGrid' : config.host}`,
    log: result.log
  });
});

// Transfer Alert & Customer Receipt Dispatch (SendGrid / SMTP)
app.post('/api/smtp/send-transfer-email', async (req, res) => {
  const {
    senderEmail,
    senderName,
    senderAccount,
    recipientName,
    recipientEmail,
    recipientAccount,
    bankName,
    amount,
    currency = 'USD',
    fee = 0,
    feeReason = 'Standard Transfer Fee',
    referenceId,
    timestamp = new Date().toISOString(),
    description = ''
  } = req.body;

  const config = currentSmtpConfig;
  const adminRecipient = config.adminAlertEmail || 'bubucyril2@gmail.com';
  const totalDebited = (parseFloat(amount) || 0) + (parseFloat(fee) || 0);

  // 1. Admin Alert Email HTML
  const adminSubject = `[ECONEST TRANSFER ALERT] $${amount} from ${senderEmail}${recipientEmail ? ` to ${recipientEmail}` : ''}`;
  const adminHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="background: #0f172a; padding: 18px 24px; border-radius: 8px 8px 0 0; color: #ffffff;">
        <span style="background: #10b981; color: #ffffff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Transfer Notification</span>
        <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 700;">Customer Transfer Alert</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8;">Transaction Reference: ${referenceId}</p>
      </div>

      <div style="padding: 20px; border: 1px solid #f1f5f9; border-top: none; background: #ffffff;">
        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #065f46; font-weight: bold;">Transfer Amount</p>
          <p style="margin: 4px 0 0; font-size: 26px; font-weight: 800; color: #047857;">$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</p>
          <p style="margin: 4px 0 0; font-size: 12px; color: #065f46;">Fee Debited: <strong>$${Number(fee).toFixed(2)} (${feeReason})</strong></p>
        </div>

        <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin: 16px 0 8px; letter-spacing: 0.5px;">Sender Details (Who Made The Transfer)</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; width: 140px;">Customer Email:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;"><a href="mailto:${senderEmail}" style="color: #0284c7; text-decoration: none;">${senderEmail}</a></td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Customer Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${senderName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Source Account:</td>
            <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${senderAccount}</td>
          </tr>
        </table>

        <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin: 16px 0 8px; letter-spacing: 0.5px;">Beneficiary Details</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; width: 140px;">Recipient Name:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${recipientName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Recipient Account:</td>
            <td style="padding: 8px 0; color: #0f172a; font-family: monospace;">${recipientAccount}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Receiver Email:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700;">
              ${recipientEmail ? `<a href="mailto:${recipientEmail}" style="color: #4f46e5; text-decoration: none; font-weight: 700;">${recipientEmail}</a> <span style="display: inline-block; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; margin-left: 6px; text-transform: uppercase;">Direct Receiver</span>` : '<span style="color: #94a3b8; font-style: italic;">Not provided</span>'}
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Destination Bank:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600;">${bankName}</td>
          </tr>
          ${description ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Transfer Memo:</td>
            <td style="padding: 8px 0; color: #0f172a;">${description}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Timestamp:</td>
            <td style="padding: 8px 0; color: #64748b; font-size: 12px;">${new Date(timestamp).toUTCString()}</td>
          </tr>
        </table>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; display: flex; justify-content: space-between;">
          <span>ECONEST Real-Time Clearing Audit</span>
          <span>Status: <strong>PROCESSED</strong></span>
        </div>
      </div>
    </div>
  `;

  // 2. Customer Receipt Email HTML
  const customerSubject = `[ECONEST BANK] Debit Advice Note - Transfer Ref ${referenceId}`;
  const customerHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
      <div style="border-bottom: 2px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 22px;">ECONEST BANK</h1>
        <p style="color: #10b981; margin: 4px 0 0; font-weight: 600; font-size: 12px; text-transform: uppercase;">Official Electronic Debit Advice</p>
      </div>

      <p style="font-size: 14px; color: #334155;">Dear <strong>${senderName}</strong>,</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">Your transfer of <strong>$${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${currency}</strong> to <strong>${recipientName}</strong> at <strong>${bankName}</strong> has been successfully processed.</p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr><td style="padding: 6px 0; color: #64748b;">Reference Number:</td><td style="padding: 6px 0; font-family: monospace; font-weight: bold; color: #0f172a;">${referenceId}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Delivered Amount:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">$${Number(amount).toFixed(2)} ${currency}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Service Fee (${feeReason}):</td><td style="padding: 6px 0; color: #0f172a;">$${Number(fee).toFixed(2)}</td></tr>
          <tr style="border-top: 1px solid #cbd5e1; font-weight: bold;"><td style="padding: 8px 0; color: #0f172a;">Total Amount Debited:</td><td style="padding: 8px 0; color: #0f172a; font-size: 15px;">$${totalDebited.toFixed(2)}</td></tr>
        </table>
      </div>

      <p style="color: #64748b; font-size: 12px; line-height: 1.5;">If you did not authorize this transaction, please contact ECONEST Fraud Protection immediately via the portal or at support@econestbank.com.</p>
    </div>
  `;

  // If receiver email was provided in the transfer, automatically register/seed the conversation thread
  let receiverThread: ReceiverThread | null = null;
  if (recipientEmail && recipientEmail.includes('@')) {
    try {
      receiverThread = getOrCreateReceiverThread({
        referenceId,
        receiverEmail: recipientEmail.trim(),
        receiverName: recipientName || 'Beneficiary',
        senderName: senderName || 'ECONEST Client',
        senderEmail: senderEmail || '',
        amount,
        currency,
        bankName,
      });
    } catch (e) {
      console.warn('Could not auto-register receiver thread:', e);
    }
  }

  // Dispatch solely to Admin (containing sender & receiver email)
  const adminResult = await dispatchEmailViaProvider({
    to: adminRecipient,
    subject: adminSubject,
    html: adminHtml,
    text: `Transfer Alert: $${amount} transferred by ${senderEmail} (${senderName}) to ${recipientName}. Ref: ${referenceId}`,
    replyTo: senderEmail,
    logType: 'transfer',
    metadata: { referenceId, senderEmail, amount, fee, feeReason, recipientName, recipientEmail }
  });

  res.json({
    success: true,
    messageId: adminResult.messageId,
    provider: adminResult.provider,
    simulated: adminResult.simulated,
    adminLog: adminResult.log,
    receiverThreadId: receiverThread?.threadId
  });
});

// ==========================================
// SendGrid Two-Way Receiver Messaging Desk API
// ==========================================

// 1. Get all receiver conversation threads (for admin transactions desk)
app.get('/api/sendgrid/threads', (req, res) => {
  try {
    const threads = loadReceiverThreads();
    // Sort with unread replies first, then most recently updated
    threads.sort((a, b) => {
      if (a.hasUnreadReply && !b.hasUnreadReply) return -1;
      if (!a.hasUnreadReply && b.hasUnreadReply) return 1;
      return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
    });
    res.json({ success: true, threads });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load threads' });
  }
});

// 2. Get single receiver conversation thread by threadId or referenceId
app.get('/api/sendgrid/threads/:threadId', (req, res) => {
  try {
    const { threadId } = req.params;
    const threads = loadReceiverThreads();
    const thread = threads.find(t => t.threadId === threadId || t.referenceId === threadId);
    if (!thread) {
      return res.status(404).json({ success: false, error: 'Thread not found' });
    }
    res.json({ success: true, thread });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch thread' });
  }
});

// 3. Admin sends a direct message to receiver via SendGrid
app.post('/api/sendgrid/send-receiver-message', async (req, res) => {
  try {
    const {
      threadId,
      transactionId,
      referenceId,
      receiverEmail,
      receiverName,
      senderName,
      senderEmail,
      amount,
      currency = 'USD',
      bankName = 'ECONEST BANK',
      subject,
      message,
      adminName = 'ECONEST Bank Administration'
    } = req.body;

    if (!receiverEmail || !receiverEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Valid receiver email address is required.' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message body cannot be empty.' });
    }

    // Load or create thread
    const threads = loadReceiverThreads();
    let thread = threads.find(t => 
      (threadId && t.threadId === threadId) || 
      (referenceId && t.referenceId === referenceId) ||
      (t.receiverEmail.toLowerCase() === receiverEmail.trim().toLowerCase() && (!referenceId || t.referenceId === referenceId))
    );

    if (!thread) {
      thread = getOrCreateReceiverThread({
        referenceId: referenceId || 'TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        receiverEmail: receiverEmail.trim(),
        receiverName: receiverName || 'Transfer Recipient',
        senderName: senderName || 'ECONEST Customer',
        senderEmail: senderEmail || '',
        amount: amount || 0,
        currency,
        bankName,
        transactionId
      });
      threads.unshift(thread);
    }

    // Append Admin Message to thread
    const messageId = 'msg_adm_' + Date.now();
    const finalSubject = subject || `[ECONEST BANK] Official Notification regarding Transfer Ref #${thread.referenceId}`;
    
    const adminMessage: ReceiverThreadMessage = {
      id: messageId,
      senderType: 'admin',
      senderName: adminName,
      senderEmail: currentSmtpConfig.sendgridSenderEmail || 'notifications@econestbank.com',
      subject: finalSubject,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      deliveredVia: 'SendGrid'
    };

    thread.messages.push(adminMessage);
    thread.lastUpdated = new Date().toISOString();
    // Admin sent message, so receiver unread is cleared for admin
    thread.hasUnreadReply = false;

    // Save updated threads to disk
    const threadIndex = threads.findIndex(t => t.threadId === thread?.threadId);
    if (threadIndex >= 0) {
      threads[threadIndex] = thread;
    } else {
      threads.unshift(thread);
    }
    saveReceiverThreads(threads);

    // Build the public response portal link
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const replyUrl = `${protocol}://${host}/reply/${thread.threadId}?token=${thread.replyToken}`;

    // Send the email via SendGrid to the receiver's real Gmail
    const htmlEmail = buildBrandedHtmlEmail({
      headline: `OFFICIAL NOTIFICATION - REF #${thread.referenceId}`,
      bodyHtml: `
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 12px; font-size: 15px; color: #0f172a; font-weight: 600;">Dear ${thread.receiverName || 'Recipient'},</p>
          <div style="background: #f8fafc; border-left: 4px solid #10b981; padding: 16px 20px; border-radius: 4px 8px 8px 4px; font-size: 14px; color: #334155; line-height: 1.7; white-space: pre-line;">
            ${message.trim()}
          </div>
        </div>
      `,
      metadataRows: [
        { label: 'Recipient Email', value: thread.receiverEmail },
        { label: 'Transaction Ref', value: `#${thread.referenceId}` },
        { label: 'Settled Amount', value: `$${Number(thread.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${thread.currency}` },
        { label: 'Originating Sender', value: thread.senderName ? `${thread.senderName} (${thread.senderEmail || 'Client'})` : 'ECONEST Client' },
        { label: 'Destination Bank', value: thread.bankName || 'Beneficiary Bank' }
      ],
      actionText: 'Reply to Bank Administration Online',
      actionUrl: replyUrl,
      footerNote: 'You can reply directly to the Bank Administration by clicking the button above or replying to this email. The Administration Desk will review and respond promptly.'
    });

    const sendResult = await dispatchEmailViaProvider({
      to: thread.receiverEmail,
      subject: finalSubject,
      html: htmlEmail,
      text: `${finalSubject}\n\nDear ${thread.receiverName},\n\n${message.trim()}\n\nTransaction Ref: #${thread.referenceId}\nAmount: $${thread.amount}\n\nReply directly online at: ${replyUrl}`,
      replyTo: currentSmtpConfig.adminAlertEmail || currentSmtpConfig.sendgridSenderEmail,
      logType: 'custom',
      metadata: {
        threadId: thread.threadId,
        referenceId: thread.referenceId,
        receiverEmail: thread.receiverEmail
      }
    });

    res.json({
      success: true,
      message: `Message dispatched via SendGrid to ${thread.receiverEmail}.`,
      messageId: sendResult.messageId,
      simulated: sendResult.simulated,
      thread,
      replyUrl
    });
  } catch (err: any) {
    console.error('Error sending receiver message:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch message via SendGrid.' });
  }
});

// 4. Public endpoint for receiver to post a reply back to bank administration
app.post('/api/sendgrid/receiver-reply', async (req, res) => {
  try {
    const { threadId, token, message, senderName, senderEmail } = req.body;

    if (!threadId || !message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Thread ID and message body are required.' });
    }

    const threads = loadReceiverThreads();
    const thread = threads.find(t => t.threadId === threadId);

    if (!thread) {
      return res.status(404).json({ success: false, error: 'Conversation thread not found.' });
    }

    // If token provided, verify it (or allow if match)
    if (token && thread.replyToken && token !== thread.replyToken) {
      return res.status(403).json({ success: false, error: 'Invalid or expired reply authorization token.' });
    }

    const replyMessage: ReceiverThreadMessage = {
      id: 'msg_rec_' + Date.now(),
      senderType: 'receiver',
      senderName: senderName || thread.receiverName || 'Recipient',
      senderEmail: senderEmail || thread.receiverEmail,
      subject: `Re: Communication regarding Transfer #${thread.referenceId}`,
      message: message.trim(),
      timestamp: new Date().toISOString(),
      deliveredVia: 'Web Response Portal'
    };

    thread.messages.push(replyMessage);
    thread.hasUnreadReply = true;
    thread.lastUpdated = new Date().toISOString();

    const threadIndex = threads.findIndex(t => t.threadId === thread.threadId);
    if (threadIndex >= 0) {
      threads[threadIndex] = thread;
      saveReceiverThreads(threads);
    }

    // Immediately alert the bank admin via SendGrid so admin is instantly notified
    try {
      const adminAlertEmail = currentSmtpConfig.adminAlertEmail || 'bubucyril2@gmail.com';
      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
      const adminViewUrl = `${protocol}://${host}/admin/transactions`;

      const adminAlertHtml = buildBrandedHtmlEmail({
        headline: 'NEW RECEIVER REPLY RECEIVED',
        bodyHtml: `
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #1e40af; font-weight: bold;">New Incoming Message from Transaction Recipient</p>
            <p style="margin: 4px 0 0; font-size: 16px; font-weight: 700; color: #1e3a8a;">${thread.receiverName} (${thread.receiverEmail})</p>
            <p style="margin: 2px 0 0; font-size: 12px; color: #3b82f6;">Transaction Ref: <strong>#${thread.referenceId}</strong></p>
          </div>

          <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">Message Content:</h4>
            <p style="margin: 0; font-size: 14px; color: #0f172a; line-height: 1.6; white-space: pre-line;">${message.trim()}</p>
          </div>
        `,
        metadataRows: [
          { label: 'Receiver Email', value: thread.receiverEmail },
          { label: 'Transaction Ref', value: `#${thread.referenceId}` },
          { label: 'Amount', value: `$${Number(thread.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${thread.currency}` },
          { label: 'Reply Time', value: new Date().toUTCString() }
        ],
        actionText: 'Open Admin Transactions Desk',
        actionUrl: adminViewUrl,
        footerNote: 'This response has been recorded directly into the ECONEST BANK administration desk. You can continue the conversation directly from your browser.'
      });

      await dispatchEmailViaProvider({
        to: adminAlertEmail,
        subject: `[NEW REPLY] ${thread.receiverName} replied to Transfer #${thread.referenceId}`,
        html: adminAlertHtml,
        text: `New Reply Received from ${thread.receiverName} (${thread.receiverEmail}) regarding Transfer #${thread.referenceId}:\n\n${message.trim()}\n\nView on Admin Portal: ${adminViewUrl}`,
        replyTo: thread.receiverEmail,
        logType: 'chat_admin',
        metadata: { threadId: thread.threadId, referenceId: thread.referenceId }
      });
    } catch (notifyErr) {
      console.warn('Could not dispatch SendGrid alert to admin regarding reply:', notifyErr);
    }

    res.json({
      success: true,
      message: 'Your reply was successfully submitted to the Bank Administration Desk.',
      thread
    });
  } catch (err: any) {
    console.error('Error handling receiver reply:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to submit reply.' });
  }
});

// 5. Mark thread as read
app.post('/api/sendgrid/mark-read', (req, res) => {
  try {
    const { threadId } = req.body;
    const threads = loadReceiverThreads();
    const thread = threads.find(t => t.threadId === threadId);
    if (thread) {
      thread.hasUnreadReply = false;
      saveReceiverThreads(threads);
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to mark thread as read.' });
  }
});

// 6. Inbound Webhook for SendGrid Inbound Parse
app.post('/api/sendgrid/inbound-webhook', (req, res) => {
  try {
    const body = req.body || {};
    const from = body.from || '';
    const subject = body.subject || '';
    const text = body.text || '';

    // Search for reference ID like "#TXN-123456" or "Ref TXN-123456"
    const match = subject.match(/(?:Ref\s*#?|#)([A-Za-z0-9_-]+)/i) || text.match(/(?:Ref\s*#?|#)([A-Za-z0-9_-]+)/i);
    const ref = match ? match[1] : '';

    if (ref || from) {
      const threads = loadReceiverThreads();
      const thread = threads.find(t => (ref && t.referenceId.toLowerCase() === ref.toLowerCase()) || (from && from.includes(t.receiverEmail)));
      if (thread && text) {
        thread.messages.push({
          id: 'msg_webhook_' + Date.now(),
          senderType: 'receiver',
          senderName: thread.receiverName || from,
          senderEmail: from,
          subject,
          message: text.trim(),
          timestamp: new Date().toISOString(),
          deliveredVia: 'SendGrid Inbound Parse'
        });
        thread.hasUnreadReply = true;
        thread.lastUpdated = new Date().toISOString();
        saveReceiverThreads(threads);
      }
    }
    res.status(200).send('OK');
  } catch (err: any) {
    console.warn('Inbound webhook processing error:', err);
    res.status(200).send('OK');
  }
});

// Chat Email Relay - Disabled (Policy: Only transfer alerts to admin and direct admin messages to receiver are active)
app.post('/api/smtp/send-chat-email', async (req, res) => {
  res.json({ success: true, disabled: true, message: 'Chat email relay is disabled by policy.' });
});

// Dedicated Official Bank Email Correspondence - Disabled
app.post('/api/smtp/send-email-message', async (req, res) => {
  res.json({ success: true, disabled: true, message: 'Email messages thread relay is disabled by policy.' });
});

// Email Logs Endpoint
app.get('/api/smtp/logs', (req, res) => {
  res.json({ logs: emailLogs });
});

app.delete('/api/smtp/logs', (req, res) => {
  emailLogs.length = 0;
  res.json({ success: true, message: 'Email logs cleared' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
