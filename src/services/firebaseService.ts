import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  addDoc,
  serverTimestamp,
  getDocFromServer
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import { 
  User, 
  Account, 
  Transaction, 
  Notification, 
  ChatMessage, 
  Deposit, 
  Loan, 
  Beneficiary, 
  ContactMessage 
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const COLLECTIONS = {
  USERS: 'users',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  NOTIFICATIONS: 'notifications',
  CHAT_MESSAGES: 'chat_messages',
  DEPOSITS: 'deposits',
  LOANS: 'loans',
  BENEFICIARIES: 'beneficiaries',
  CONTACT_MESSAGES: 'contact_messages',
  PAYMENT_METHODS: 'payment_methods',
  AUDIT_LOGS: 'audit_logs',
  SETTINGS: 'settings',
};

class FirebaseService {
  async testConnection() {
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if(error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration. ");
      }
    }
  }

  // Users
  async getUsers(): Promise<User[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
      throw error; // Re-throw after handling
    }
  }

  async saveUser(user: User): Promise<void> {
    const { id, ...data } = user;
    try {
      await setDoc(doc(db, COLLECTIONS.USERS, id), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.USERS}/${id}`);
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, id));
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as User;
      }
      return undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.USERS}/${id}`);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const q = query(collection(db, COLLECTIONS.USERS), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return { ...doc.data(), id: doc.id } as User;
    }
    return undefined;
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.USERS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.USERS}/${id}`);
    }
  }

  // Accounts
  async getAccounts(): Promise<Account[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.ACCOUNTS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Account));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ACCOUNTS);
      throw error;
    }
  }

  async saveAccount(account: Account): Promise<void> {
    const { id, ...data } = account;
    try {
      await setDoc(doc(db, COLLECTIONS.ACCOUNTS, id), {
        ...data,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.ACCOUNTS}/${id}`);
    }
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    try {
      const docSnap = await getDoc(doc(db, COLLECTIONS.ACCOUNTS, id));
      if (docSnap.exists()) {
        return { ...docSnap.data(), id: docSnap.id } as Account;
      }
      return undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${COLLECTIONS.ACCOUNTS}/${id}`);
      return undefined;
    }
  }

  async getAccountByUserId(userId: string): Promise<Account | undefined> {
    try {
      // Try querying by userId
      const q = query(collection(db, COLLECTIONS.ACCOUNTS), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { ...doc.data(), id: doc.id } as Account;
      }

      // Fallback: Try querying by user_id (snake_case)
      const q2 = query(collection(db, COLLECTIONS.ACCOUNTS), where('user_id', '==', userId));
      const snapshot2 = await getDocs(q2);
      if (!snapshot2.empty) {
        const doc = snapshot2.docs[0];
        return { ...doc.data(), id: doc.id } as Account;
      }

      // Final fallback: fetch all and filter in memory (only if necessary)
      const allAccounts = await this.getAccounts();
      const account = allAccounts.find(a => a.userId === userId || (a as any).user_id === userId);
      return account;
    } catch (error) {
      // Don't swallow permission denied or index errors
      console.error('Error getting account by userId:', error);
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ACCOUNTS);
      throw error;
    }
  }

  async deleteAccount(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ACCOUNTS, id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTIONS.ACCOUNTS}/${id}`);
    }
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.TRANSACTIONS));
      const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
      return transactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TRANSACTIONS);
      throw error;
    }
  }

  async saveTransaction(transaction: Transaction): Promise<void> {
    const { id, ...data } = transaction;
    const userId = data.userId || auth.currentUser?.uid;
    const category = data.category || 'Adjustment';
    try {
      if (id) {
        await setDoc(doc(db, COLLECTIONS.TRANSACTIONS, id), {
          ...data,
          userId,
          category,
          createdAt: data.createdAt || data.created_at || serverTimestamp()
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.TRANSACTIONS), {
          ...data,
          userId,
          category,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.TRANSACTIONS}/${id || 'new'}`);
    }
  }

  async getTransactionsByAccountId(accountId: string): Promise<Transaction[]> {
    try {
      let q = query(
        collection(db, COLLECTIONS.TRANSACTIONS), 
        where('accountId', '==', accountId)
      );

      // If not admin, add userId filter to satisfy security rules for list operations
      const currentUser = auth.currentUser;
      if (currentUser) {
        // We check if the user is an admin by checking their email or role
        // For simplicity and to avoid extra DB calls here, we can check the email
        const isAdminUser = [
          "bubucyril2@gmail.com",
          "admin@gmail.com",
          "jen@gmail.com"
        ].includes(currentUser.email || "") || currentUser.uid === "wrBDIOCVQmU4S2BAJLzYMOvrit83";

        if (!isAdminUser) {
          q = query(q, where('userId', '==', currentUser.uid));
        }
      }

      const snapshot = await getDocs(q);
      const transactions = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction));
      
      // Sort in memory
      return transactions.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TRANSACTIONS);
      return [];
    }
  }

  async deleteTransactionsByAccountId(accountId: string): Promise<void> {
    try {
      const q = query(collection(db, COLLECTIONS.TRANSACTIONS), where('accountId', '==', accountId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.TRANSACTIONS);
    }
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.NOTIFICATIONS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.NOTIFICATIONS);
      throw error;
    }
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    try {
      // Remove orderBy to avoid composite index requirement
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS), 
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      const notifications = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Notification));
      
      // Sort in memory
      return notifications.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
        const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.NOTIFICATIONS);
      return [];
    }
  }

  async deleteNotificationsByUserId(userId: string): Promise<void> {
    try {
      const q = query(collection(db, COLLECTIONS.NOTIFICATIONS), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.NOTIFICATIONS);
    }
  }

  async saveNotification(notification: Notification): Promise<void> {
    const { id, ...data } = notification;
    try {
      if (id) {
        await setDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), {
          ...data,
          createdAt: data.createdAt || data.created_at || serverTimestamp()
        });
      } else {
        await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.NOTIFICATIONS}/${id || 'new'}`);
    }
  }

  // Chat
  async getChatMessages(userId?: string): Promise<ChatMessage[]> {
    try {
      let q;
      if (userId) {
        // Remove orderBy to avoid composite index requirement
        q = query(
          collection(db, COLLECTIONS.CHAT_MESSAGES), 
          where('userId', '==', userId)
        );
      } else {
        q = query(collection(db, COLLECTIONS.CHAT_MESSAGES));
      }
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as ChatMessage));
      
      // Sort in memory
      return messages.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CHAT_MESSAGES);
      return [];
    }
  }

  async saveChatMessage(message: ChatMessage): Promise<void> {
    const { id, ...data } = message;
    await addDoc(collection(db, COLLECTIONS.CHAT_MESSAGES), {
      ...data,
      createdAt: serverTimestamp()
    });
  }

  onChatMessages(userId: string | undefined, callback: (messages: ChatMessage[]) => void) {
    let q;
    if (userId) {
      q = query(
        collection(db, COLLECTIONS.CHAT_MESSAGES), 
        where('userId', '==', userId)
      );
    } else {
      q = query(collection(db, COLLECTIONS.CHAT_MESSAGES));
    }

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ ...(doc.data() as any), id: doc.id } as ChatMessage));
      // Sort in memory to avoid composite index requirement
      const sortedMessages = messages.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateA - dateB;
      });
      callback(sortedMessages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.CHAT_MESSAGES);
    });
  }

  // Beneficiaries
  async getBeneficiaries(): Promise<Beneficiary[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.BENEFICIARIES));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Beneficiary));
  }

  async saveBeneficiary(beneficiary: Beneficiary): Promise<void> {
    const { id, ...data } = beneficiary;
    if (id) {
      await setDoc(doc(db, COLLECTIONS.BENEFICIARIES, id), data, { merge: true });
    } else {
      await addDoc(collection(db, COLLECTIONS.BENEFICIARIES), {
        ...data,
        createdAt: serverTimestamp()
      });
    }
  }

  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    const q = query(collection(db, COLLECTIONS.BENEFICIARIES), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Beneficiary));
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.CONTACT_MESSAGES));
    const messages = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ContactMessage));
    return messages.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }

  async saveContactMessage(message: ContactMessage): Promise<void> {
    await addDoc(collection(db, COLLECTIONS.CONTACT_MESSAGES), {
      ...message,
      createdAt: serverTimestamp()
    });
  }

  // Audit Logs
  async getAuditLogs(): Promise<any[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.AUDIT_LOGS));
      const logs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as any));
      return logs.sort((a: any, b: any) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.AUDIT_LOGS);
      return [];
    }
  }

  async saveAuditLog(log: any): Promise<void> {
    try {
      await addDoc(collection(db, COLLECTIONS.AUDIT_LOGS), {
        ...log,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTIONS.AUDIT_LOGS);
    }
  }

  // Payment Methods
  async getPaymentMethods(): Promise<any[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.PAYMENT_METHODS));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
  }

  async savePaymentMethod(method: any): Promise<void> {
    const { id, ...data } = method;
    if (id) {
      await setDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, id.toString()), data, { merge: true });
    } else {
      await addDoc(collection(db, COLLECTIONS.PAYMENT_METHODS), {
        ...data,
        createdAt: serverTimestamp()
      });
    }
  }

  async deletePaymentMethod(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.PAYMENT_METHODS, id));
  }

  // Settings
  async getSettings(): Promise<any> {
    const docSnap = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'system'));
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  }

  async saveSettings(settings: any): Promise<void> {
    await setDoc(doc(db, COLLECTIONS.SETTINGS, 'system'), settings, { merge: true });
  }

  // Storage (Pictures/Videos)
  async uploadFile(file: File, path: string): Promise<string> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  }

  // Loans
  async getLoans(): Promise<Loan[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.LOANS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Loan));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.LOANS);
      throw error;
    }
  }

  async getLoansByUserId(userId: string): Promise<Loan[]> {
    try {
      const q = query(collection(db, COLLECTIONS.LOANS), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Loan));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.LOANS);
      throw error;
    }
  }

  async getDepositsByUserId(userId: string): Promise<Deposit[]> {
    try {
      const q = query(collection(db, COLLECTIONS.DEPOSITS), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Deposit));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.DEPOSITS);
      throw error;
    }
  }

  async deleteLoansByUserId(userId: string): Promise<void> {
    try {
      const q = query(collection(db, COLLECTIONS.LOANS), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, COLLECTIONS.LOANS);
    }
  }

  async saveLoan(loan: Loan): Promise<void> {
    const { id, ...data } = loan;
    try {
      if (id) {
        await setDoc(doc(db, COLLECTIONS.LOANS, id), {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await addDoc(collection(db, COLLECTIONS.LOANS), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.LOANS}/${id || 'new'}`);
    }
  }

  // Deposits
  async getDeposits(): Promise<Deposit[]> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTIONS.DEPOSITS));
      return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Deposit));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DEPOSITS);
      throw error;
    }
  }

  async saveDeposit(deposit: Deposit): Promise<void> {
    const { id, ...data } = deposit;
    try {
      if (id) {
        await setDoc(doc(db, COLLECTIONS.DEPOSITS, id), {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } else {
        await addDoc(collection(db, COLLECTIONS.DEPOSITS), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `${COLLECTIONS.DEPOSITS}/${id || 'new'}`);
    }
  }
}

export const firebaseService = new FirebaseService();
