export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'customer';
  status: 'pending' | 'active' | 'disabled';
  profilePicture?: string;
  country?: string;
  city?: string;
  age?: number;
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  balance: number;
  created_at: string;
}

export interface Transaction {
  id: number;
  account_id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  status: string;
  reference_id?: string;
  created_at: string;
}

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  message: string;
  read_status: number;
  created_at: string;
}

export interface Loan {
  id: number;
  user_id: number;
  amount: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaying' | 'completed';
  repayment_schedule: string;
  paid_amount: number;
  created_at: string;
}
