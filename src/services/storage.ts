import { 
  db, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  doc,
  orderBy,
  limit
} from 'firebase/firestore';
import { User, Account, Transaction, Notification, ChatMessage, Deposit, Loan, Beneficiary, ContactMessage } from '../types';

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
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      return snapshot.docs.map(doc => doc.data() as User);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
      return [];
    }
  }

  async saveUser(user: User): Promise<void> {
    try {
      await setDoc(doc(db, 'users', user.id), user);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.id}`);
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      return userDoc.exists() ? userDoc.data() as User : undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${id}`);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()));
      const snapshot = await getDocs(q);
      return snapshot.empty ? undefined : snapshot.docs[0].data() as User;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'users');
      return undefined;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${id}`);
    }
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      const snapshot = await getDocs(collection(db, 'accounts'));
      return snapshot.docs.map(doc => doc.data() as Account);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'accounts');
      return [];
    }
  }

  async saveAccount(account: Account): Promise<void> {
    try {
      await setDoc(doc(db, 'accounts', account.id), account);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `accounts/${account.id}`);
    }
  }

  async getAccountByUserId(userId: string): Promise<Account | undefined> {
    try {
      const q = query(collection(db, 'accounts'), where('userId', '==', userId), limit(1));
      const snapshot = await getDocs(q);
      return snapshot.empty ? undefined : snapshot.docs[0].data() as Account;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'accounts');
      return undefined;
    }
  }

  async getAccountByAccountNumber(accountNumber: string): Promise<Account | undefined> {
    try {
      const q = query(collection(db, 'accounts'), where('accountNumber', '==', accountNumber), limit(1));
      const snapshot = await getDocs(q);
      return snapshot.empty ? undefined : snapshot.docs[0].data() as Account;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'accounts');
      return undefined;
    }
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    try {
      const accountDoc = await getDoc(doc(db, 'accounts', id));
      return accountDoc.exists() ? accountDoc.data() as Account : undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `accounts/${id}`);
      return undefined;
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'accounts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `accounts/${id}`);
    }
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Transaction);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      return [];
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    try {
      await setDoc(doc(db, 'transactions', transaction.id), transaction);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `transactions/${transaction.id}`);
    }
  }

  async getTransactionsByAccountId(accountId: string, userId?: string): Promise<Transaction[]> {
    try {
      let q;
      if (userId) {
        q = query(
          collection(db, 'transactions'), 
          where('userId', '==', userId),
          where('accountId', '==', accountId)
        );
      } else {
        q = query(
          collection(db, 'transactions'), 
          where('accountId', '==', accountId)
        );
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Transaction);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'transactions');
      return [];
    }
  }

  async deleteTransactionsByAccountId(accountId: string): Promise<void> {
    try {
      const q = query(collection(db, 'transactions'), where('accountId', '==', accountId));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'transactions');
    }
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'notifications');
      return [];
    }
  }

  async saveNotification(notification: Notification): Promise<void> {
    try {
      await setDoc(doc(db, 'notifications', notification.id), notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `notifications/${notification.id}`);
    }
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, 'notifications'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Notification);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'notifications');
      return [];
    }
  }

  async deleteNotificationsByUserId(userId: string): Promise<void> {
    try {
      const q = query(collection(db, 'notifications'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notifications');
    }
  }

  // Chat Messages
  async getChatMessages(userId?: string): Promise<ChatMessage[]> {
    try {
      let q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'));
      if (userId) {
        q = query(collection(db, 'chat_messages'), where('userId', '==', userId), orderBy('createdAt', 'asc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ChatMessage);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
      return [];
    }
  }

  async saveChatMessage(message: ChatMessage): Promise<void> {
    try {
      await setDoc(doc(db, 'chat_messages', message.id), message);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chat_messages/${message.id}`);
    }
  }

  onChatMessages(userId: string | undefined, callback: (messages: ChatMessage[]) => void) {
    let q = query(collection(db, 'chat_messages'), orderBy('createdAt', 'asc'));
    if (userId) {
      q = query(collection(db, 'chat_messages'), where('userId', '==', userId), orderBy('createdAt', 'asc'));
    }
    return onSnapshot(q, (snapshot) => {
      callback(snapshot.docs.map(doc => doc.data() as ChatMessage));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'chat_messages');
    });
  }

  // Deposits
  async getDeposits(): Promise<Deposit[]> {
    try {
      const q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Deposit);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'deposits');
      return [];
    }
  }

  async saveDeposit(deposit: Deposit): Promise<void> {
    try {
      await setDoc(doc(db, 'deposits', deposit.id), deposit);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `deposits/${deposit.id}`);
    }
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    try {
      const q = query(
        collection(db, 'deposits'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Deposit);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'deposits');
      return [];
    }
  }

  // Loans
  async getLoans(): Promise<Loan[]> {
    try {
      const q = query(collection(db, 'loans'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Loan);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'loans');
      return [];
    }
  }

  async saveLoan(loan: Loan): Promise<void> {
    try {
      await setDoc(doc(db, 'loans', loan.id), loan);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `loans/${loan.id}`);
    }
  }

  async getLoansByUserId(userId: string): Promise<Loan[]> {
    try {
      const q = query(
        collection(db, 'loans'), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Loan);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'loans');
      return [];
    }
  }

  async deleteLoansByUserId(userId: string): Promise<void> {
    try {
      const q = query(collection(db, 'loans'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const batch = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(batch);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'loans');
    }
  }

  // Beneficiaries
  async getBeneficiaries(): Promise<Beneficiary[]> {
    try {
      const snapshot = await getDocs(collection(db, 'beneficiaries'));
      return snapshot.docs.map(doc => doc.data() as Beneficiary);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'beneficiaries');
      return [];
    }
  }

  async saveBeneficiary(beneficiary: Beneficiary): Promise<void> {
    try {
      await setDoc(doc(db, 'beneficiaries', beneficiary.id), beneficiary);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `beneficiaries/${beneficiary.id}`);
    }
  }

  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    try {
      const q = query(collection(db, 'beneficiaries'), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Beneficiary);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'beneficiaries');
      return [];
    }
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    try {
      const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as ContactMessage);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'contact_messages');
      return [];
    }
  }

  async saveContactMessage(message: ContactMessage): Promise<void> {
    try {
      await setDoc(doc(db, 'contact_messages', message.id), message);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `contact_messages/${message.id}`);
    }
  }

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as AuditLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'audit_logs');
      return [];
    }
  }

  async saveAuditLog(log: AuditLog): Promise<void> {
    try {
      // Ensure no undefined values are passed to Firestore
      const sanitizedLog = {
        ...log,
        adminId: log.adminId || 'unknown',
        adminName: log.adminName || 'Unknown Admin'
      };
      await setDoc(doc(db, 'audit_logs', sanitizedLog.id), sanitizedLog);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `audit_logs/${log.id}`);
    }
  }

  // Payment Methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const snapshot = await getDocs(collection(db, 'payment_methods'));
      return snapshot.docs.map(doc => doc.data() as PaymentMethod);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'payment_methods');
      return [];
    }
  }

  async savePaymentMethod(method: PaymentMethod): Promise<void> {
    try {
      await setDoc(doc(db, 'payment_methods', method.id.toString()), method);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `payment_methods/${method.id}`);
    }
  }

  async deletePaymentMethod(id: string | number): Promise<void> {
    try {
      await deleteDoc(doc(db, 'payment_methods', id.toString()));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `payment_methods/${id}`);
    }
  }

  // Settings
  async getSettings(): Promise<any> {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
      return settingsDoc.exists() ? settingsDoc.data() : {};
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
      return {};
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      await setDoc(doc(db, 'settings', 'global'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/global');
    }
  }

  async uploadFile(file: File, path: string): Promise<string> {
    // Mock file upload: return a data URL since we don't have Firebase Storage set up
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const storageService = new StorageService();
