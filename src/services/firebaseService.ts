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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.USERS);
      return [];
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
        return { id: docSnap.id, ...docSnap.data() } as User;
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
      return { id: doc.id, ...doc.data() } as User;
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.ACCOUNTS);
      return [];
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

  async getAccountByUserId(userId: string): Promise<Account | undefined> {
    try {
      const q = query(collection(db, COLLECTIONS.ACCOUNTS), where('userId', '==', userId));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Account;
      }
      return undefined;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ACCOUNTS);
      return undefined;
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
      const q = query(collection(db, COLLECTIONS.TRANSACTIONS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.TRANSACTIONS);
      return [];
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
      const q = query(
        collection(db, COLLECTIONS.TRANSACTIONS), 
        where('accountId', '==', accountId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.NOTIFICATIONS);
      return [];
    }
  }

  async getNotificationsByUserId(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS), 
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
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
        q = query(
          collection(db, COLLECTIONS.CHAT_MESSAGES), 
          where('userId', '==', userId),
          orderBy('createdAt', 'asc')
        );
      } else {
        // Only admins should call this without userId, but rules will protect it anyway
        q = query(collection(db, COLLECTIONS.CHAT_MESSAGES), orderBy('createdAt', 'asc'));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as ChatMessage));
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

  // Beneficiaries
  async getBeneficiaries(): Promise<Beneficiary[]> {
    const snapshot = await getDocs(collection(db, COLLECTIONS.BENEFICIARIES));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Beneficiary));
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Beneficiary));
  }

  // Contact Messages
  async getContactMessages(): Promise<ContactMessage[]> {
    const q = query(collection(db, COLLECTIONS.CONTACT_MESSAGES), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
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
      const q = query(collection(db, COLLECTIONS.AUDIT_LOGS), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Loan));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.LOANS);
      return [];
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
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Deposit));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, COLLECTIONS.DEPOSITS);
      return [];
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
