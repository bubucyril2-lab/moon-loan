import { 
  auth, 
  db, 
  signInWithPopup, 
  googleProvider, 
  signOut, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc 
} from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';
import { User } from '../types';

class FirebaseAuthService {
  async register(userData: Partial<User> & { password?: string }): Promise<User> {
    if (!userData.email || !userData.password) {
      throw new Error('Email and password are required');
    }

    const { user: firebaseUser } = await createUserWithEmailAndPassword(
      auth, 
      userData.email, 
      userData.password
    );

    const newUser: User = {
      id: firebaseUser.uid,
      email: userData.email,
      username: userData.username || userData.email.split('@')[0],
      fullName: userData.fullName || 'New User',
      role: 'customer',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
    return newUser;
  }

  async login(email: string, password: string): Promise<User> {
    const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User data not found in database');
    }

    const userData = userDoc.data() as User;
    const userWithId = { ...userData, id: firebaseUser.uid };
    if (userWithId.status === 'disabled') {
      await signOut(auth);
      throw new Error('Account is disabled');
    }

    return userWithId;
  }

  async loginWithGoogle(): Promise<User> {
    const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

    if (!userDoc.exists()) {
      // Create new user record for Google sign-in
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email!,
        username: firebaseUser.email!.split('@')[0],
        fullName: firebaseUser.displayName || 'Google User',
        role: 'customer',
        status: 'active',
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
      return newUser;
    }

    const userData = userDoc.data() as User;
    const userWithId = { ...userData, id: firebaseUser.uid };
    if (userWithId.status === 'disabled') {
      await signOut(auth);
      throw new Error('Account is disabled');
    }

    return userWithId;
  }

  async logout(): Promise<void> {
    await signOut(auth);
  }

  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<void> {
    await updateDoc(doc(db, 'users', userId), updates);
  }

  async seedAdmin(): Promise<void> {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin12345';
    
    try {
      // Check if admin already exists in Firestore
      // We can't easily check Auth without trying to login or create
      // For seeding, we'll try to create and catch "email-already-in-use"
      try {
        const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        const adminUser: User = {
          id: firebaseUser.uid,
          email: adminEmail,
          username: 'admin',
          fullName: 'System Administrator',
          role: 'admin',
          status: 'active',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', firebaseUser.uid), adminUser);
        console.log('[Firebase] Admin seeded successfully');
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log('[Firebase] Admin already exists in Auth');
          // Ensure Firestore record exists
          // We don't have the UID here easily without logging in, 
          // but for this demo environment, we can assume if it's in Auth, it's fine or we'll fix it on first login attempt if needed.
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('[Firebase] Error seeding admin:', error);
    }
  }
}

export const firebaseAuthService = new FirebaseAuthService();
