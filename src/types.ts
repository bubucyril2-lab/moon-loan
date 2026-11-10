export interface User {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  full_name?: string;
  role: 'admin' | 'customer';
  status: 'pending' | 'active' | 'disabled';
  profilePicture?: string;
  country?: string;
  city?: string;
  address?: string;
  phoneNumber?: string;
  age?: number;
  password?: string; // Added for local auth
  transactionPin?: string;
  twoFactorEnabled?: boolean;
  createdAt?: string;
  created_at?: string;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  account_number?: string;
  balance: number;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId?: string;
  senderEmail?: string;
  recipientName?: string;
  recipientEmail?: string;
  recipient_email?: string;
  recipientAccount?: string;
  bankName?: string;
  type: 'credit' | 'debit';
  amount: number;
  fee?: number;
  feeReason?: string;
  transferType?: 'local' | 'international';
  description: string;
  category?: string;
  status: string;
  referenceId?: string;
  reference_id?: string;
  createdAt?: string;
  created_at?: string;
}

export interface FeeReason {
  id: string;
  name: string;
  description: string;
  amount: number;
  isEnabled: boolean;
}

export interface FeeStage {
  id: string;
  stageNumber: number;
  title: string;
  amount: number;
  description: string;
  instructions: string;
  statusText?: string;
  requiredAccount?: string;
  requiredBank?: string;
  isPaid?: boolean;
}

export interface ReceiverEmailCustomConfig {
  autoSendEnabled: boolean;
  subject: string;
  headline: string;
  customMessage: string;
  actionText?: string;
  actionUrl?: string;
}

export interface TransferScreenConfig {
  successTitle: string;
  successSubtitle: string;
  noticeBannerText: string;
  noticeBannerType: 'info' | 'warning' | 'success';
  showReferenceId: boolean;
  showFeeBreakdown: boolean;
  showPrintButton: boolean;
  showShareButton: boolean;
  pendingReviewNotice: string;
  // Fee Payment Message On Screen Immediately After Transfer (ON/OFF)
  feePaymentMessageEnabled: boolean;
  // Mode: Single Payment or Multiple Payments (only single fee comes at a time)
  feePaymentMode: 'single' | 'multiple';
  singleFeeAtATime?: boolean;
  singleFeeMessage: {
    title: string;
    amount: number;
    description: string;
    instructions: string;
    accountNumber?: string;
    bankName?: string;
    routingCode?: string;
    urgencyText?: string;
  };
  multipleFeeStages: FeeStage[];
  // Receiver Email Configuration: Admin can turn ON/OFF. When false/OFF, not needed and does not appear during transfer
  showReceiverEmailInTransfer?: boolean;
  // Receiver Email Custom Message (Auto ON/OFF & Default Template)
  receiverCustomEmailConfig: ReceiverEmailCustomConfig;
}

export interface EmailTemplate {
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

export interface SmtpConfig {
  provider?: 'sendgrid' | 'smtp';
  sendgridApiKey?: string;
  sendgridSenderEmail?: string;
  sendgridSenderName?: string;
  hasSendgridKey?: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  adminAlertEmail: string;
  enabled: boolean;
  // Auto ON/OFF Features
  autoDispatchEnabled?: boolean;
  autoSendTransferReceipt?: boolean;
  autoSendWelcomeEmail?: boolean;
  autoSendAdminTransferAlert?: boolean;
  autoSendChatNotification?: boolean;
}

export interface EmailLog {
  id: string;
  type: 'transfer' | 'chat_customer' | 'chat_admin' | 'test' | 'custom' | 'welcome' | 'notice';
  to: string;
  from: string;
  replyTo?: string;
  subject: string;
  bodyText?: string;
  bodyPreview?: string;
  timestamp: string;
  status: 'sent' | 'simulated' | 'failed';
  error?: string;
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead?: boolean;
  read?: boolean;
  createdAt?: string;
  created_at?: string;
}

export type ChatMessage = {
  id: string;
  userId: string;
  senderId: string;
  text: string;
  isAdmin: boolean;
  createdAt?: string;
  created_at?: string; // Keep for compatibility if needed
}

export interface EmailMessage {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  senderEmail: string;
  recipientEmail: string;
  subject: string;
  messageText: string;
  isFromAdmin: boolean;
  status: 'sent' | 'delivered' | 'received' | 'simulated';
  createdAt: string;
  replyTo?: string;
  threadId?: string;
}

export interface Loan {
  id: string;
  userId: string;
  amount: number;
  purpose?: string;
  interestRate?: number;
  interest_rate?: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaying' | 'completed';
  repaymentSchedule?: string;
  repayment_schedule?: string;
  paidAmount?: number;
  paid_amount?: number;
  createdAt?: string;
  created_at?: string;
}

export interface Deposit {
  id: string;
  userId: string;
  amount: number;
  paymentMethodId?: string;
  proofImage?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}

export interface Beneficiary {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  account_number?: string;
  bankName?: string;
  bank_name?: string;
  createdAt?: string;
  created_at?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt?: string;
}

export interface ReceiverThreadMessage {
  id: string;
  senderType: 'admin' | 'receiver' | 'system';
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
