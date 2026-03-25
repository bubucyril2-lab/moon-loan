
import { firebaseService } from './firebaseService';
import { User, Account, Transaction, Notification, ChatMessage, Deposit, Loan, Beneficiary, ContactMessage } from '../types';
import { collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface PaymentMethod {
  id: number;
  type: 'bank' | 'crypto';
  name: string;
  details: string;
  instructions: string;
  is_active: number;
  created_at: string;
}

class StorageService {
  // Users
  async getUsers(): Promise<User[]> {
    return await firebaseService.getUsers();
  }

  async saveUser(user: User): Promise<void> {
    await firebaseService.saveUser(user);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return await firebaseService.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return await firebaseService.getUserByEmail(email);
  }

  async deleteUser(id: string): Promise<void> {
    await firebaseService.deleteUser(id);
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    return await firebaseService.getAccounts();
  }

  async saveAccount(account: Account): Promise<void> {
    await firebaseService.saveAccount(account);
  }

  async getAccountByUserId(userId: string): Promise<Account | undefined> {
    return await firebaseService.getAccountByUserId(userId);
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    return await firebaseService.getAccountById(id);
  }

  async deleteAccount(id: string): Promise<void> {
    await firebaseService.deleteAccount(id);
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return await firebaseService.getTransactions();
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    await firebaseService.saveTransaction(transaction);
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    return await firebaseService.getTransactionsByAccountId(accountId);
  }

  async deleteTransactionsByAccountId(accountId: string): Promise<void> {
    await firebaseService.deleteTransactionsByAccountId(accountId);
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    return await firebaseService.getNotifications();
  }

  async saveNotification(notification: Notification): Promise<void> {
    await firebaseService.saveNotification(notification);
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    return await firebaseService.getNotificationsByUserId(userId);
  }

  async deleteNotificationsByUserId(userId: string): Promise<void> {
    await firebaseService.deleteNotificationsByUserId(userId);
  }

  // Chat Messages
  async getChatMessages(userId?: string): Promise<ChatMessage[]> {
    return await firebaseService.getChatMessages(userId);
  }

  async saveChatMessage(message: ChatMessage): Promise<void> {
    await firebaseService.saveChatMessage(message);
  }

  onChatMessages(userId: string | undefined, callback: (messages: ChatMessage[]) => void) {
    return firebaseService.onChatMessages(userId, callback);
  }

  // Deposits
  async getDeposits(): Promise<Deposit[]> {
    return await firebaseService.getDeposits();
  }

  async saveDeposit(deposit: Deposit): Promise<void> {
    await firebaseService.saveDeposit(deposit);
  }

  // Loans
  async getLoans(): Promise<Loan[]> {
    return await firebaseService.getLoans();
  }

  async saveLoan(loan: Loan): Promise<void> {
    await firebaseService.saveLoan(loan);
  }

  async getLoansByUserId(userId: string): Promise<Loan[]> {
    return await firebaseService.getLoansByUserId(userId);
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    return await firebaseService.getDepositsByUserId(userId);
  }

  async deleteLoansByUserId(userId: string): Promise<void> {
    await firebaseService.deleteLoansByUserId(userId);
  }

  // Beneficiaries
  async getBeneficiaries(): Promise<Beneficiary[]> {
    return await firebaseService.getBeneficiaries();
  }

  async saveBeneficiary(beneficiary: Beneficiary): Promise<void> {
    await firebaseService.saveBeneficiary(beneficiary);
  }

  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    return await firebaseService.getBeneficiariesByUserId(userId);
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    return await firebaseService.getContactMessages();
  }

  async saveContactMessage(message: ContactMessage): Promise<void> {
    await firebaseService.saveContactMessage(message);
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    return await firebaseService.getAuditLogs();
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return await firebaseService.getPaymentMethods();
  }

  async savePaymentMethod(method: PaymentMethod): Promise<void> {
    await firebaseService.savePaymentMethod(method);
  }

  async saveAuditLog(log: AuditLog): Promise<void> {
    await firebaseService.saveAuditLog(log);
  }

  // Settings
  async getSettings(): Promise<any> {
    return await firebaseService.getSettings();
  }

  async saveSettings(settings: any): Promise<void> {
    await firebaseService.saveSettings(settings);
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await firebaseService.deletePaymentMethod(id.toString());
  }

  async uploadFile(file: File, path: string): Promise<string> {
    return await firebaseService.uploadFile(file, path);
  }
}

export const storageService = new StorageService();
