export interface User {
  id: string;
  email: string;
  fullName: string;
  full_name?: string;
  role: 'admin' | 'customer';
  status: 'pending' | 'active' | 'disabled';
  profilePicture?: string;
  country?: string;
  city?: string;
  age?: number;
  password?: string; // Added for local auth
  pin?: string;
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
  pin?: string;
  status?: string;
  createdAt?: string;
  created_at?: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  userId?: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category?: string;
  status: string;
  referenceId?: string;
  reference_id?: string;
  createdAt?: string;
  created_at?: string;
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
