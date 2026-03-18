import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { supabase, isConfigured } from './server/supabase';
import dotenv from 'dotenv';
import multer from 'multer';
import fs from 'fs';

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  dotenv.config();
}

const JWT_SECRET = process.env.JWT_SECRET || 'moonstone-secret-key-2026';
const PORT = 3000;

export const app = express();

app.use(cors());
app.use(express.json());

// Socket.io will be initialized only when running as a standalone server
let io: any = null;
let httpServer: any = null;

// Ensure uploads directory exists (only if not on Vercel)
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
const uploadDir = isVercel ? '/tmp' : path.join(process.cwd(), 'uploads');

if (!isVercel && !fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (err) {
    console.warn('Could not create uploads directory:', err);
  }
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
const upload = multer({ storage });

// Serve uploads statically
app.use('/uploads', express.static(uploadDir));

// --- Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
  next();
};

// --- Debug/Emergency Routes ---
app.get('/api/debug/reset-admin', async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync('admin', 10);
    const { data, error } = await supabase
      .from('users')
      .update({ password: hashedPassword, status: 'active', role: 'admin' })
      .eq('email', 'admin12345')
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      // If user doesn't exist, create them
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          email: 'admin12345',
          password: hashedPassword,
          full_name: 'System Admin',
          role: 'admin',
          status: 'active'
        });
      if (insertError) throw insertError;
      return res.json({ message: 'Admin user created and password set to "admin"' });
    }

    res.json({ message: 'Admin password reset successfully to "admin"' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Auth Routes ---
app.post('/api/auth/register', upload.single('profilePicture'), async (req: any, res) => {
    if (!isConfigured) {
      return res.status(500).json({ error: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.' });
    }
    console.log('Registration request received:', req.body.email);
    const { email, password, fullName, country, city, age } = req.body;
    const profilePicture = req.file ? `/uploads/${req.file.filename}` : null;
    
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password: hashedPassword,
          full_name: fullName,
          country,
          city,
          age: parseInt(age),
          profile_picture: profilePicture
        })
        .select()
        .single();

      if (userError) throw userError;
      
      const userId = user.id;
      // Create initial account for customer
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const { error: accountError } = await supabase
        .from('accounts')
        .insert({
          user_id: userId,
          account_number: accountNumber,
          balance: 0
        });

      if (accountError) throw accountError;

      res.status(201).json({ message: 'Registration successful. Pending approval.' });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message.includes('unique') ? 'Email already exists' : 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    if (!isConfigured) {
      return res.status(500).json({ error: 'Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.' });
    }
    const { email, password } = req.body;
    console.log(`Login attempt for: ${email}`);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Supabase Login Error:', error.message, error.code);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user) {
      console.log('Login failed: User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      console.log('Login failed: Password mismatch');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ error: 'Account disabled' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { 
      id: user.id, 
      email: user.email, 
      fullName: user.full_name, 
      role: user.role, 
      status: user.status,
      profilePicture: user.profile_picture,
      country: user.country,
      city: user.city,
      age: user.age
    } });
  });

  // --- Settings & System ---
  app.get('/api/settings', async (req, res) => {
    const { data: settings, error } = await supabase.from('settings').select('*');
    if (error) return res.status(500).json({ error: error.message });
    const settingsObj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json(settingsObj);
  });

  app.get('/api/admin/settings', authenticateToken, isAdmin, async (req: any, res) => {
    const { data: settings, error } = await supabase.from('settings').select('*');
    if (error) return res.status(500).json({ error: error.message });
    const settingsObj = settings.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {});
    res.json(settingsObj);
  });

  app.post('/api/admin/settings', authenticateToken, isAdmin, async (req: any, res) => {
    const settings = req.body;
    
    try {
      for (const [key, value] of Object.entries(settings)) {
        await supabase.from('settings').update({ value: String(value) }).eq('key', key);
      }
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'update_settings',
        details: JSON.stringify(settings),
        ip_address: req.ip
      });
      
      res.json({ message: 'Settings updated' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Audit Logs ---
  app.get('/api/admin/audit-logs', authenticateToken, isAdmin, async (req: any, res) => {
    const { data: logs, error } = await supabase
      .from('audit_logs')
      .select('*, users!admin_id(full_name)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) return res.status(500).json({ error: error.message });
    
    const formattedLogs = logs.map(log => ({
      ...log,
      admin_name: log.users?.full_name
    }));
    
    res.json(formattedLogs);
  });

  // --- Growth Stats ---
  app.get('/api/admin/stats/growth', authenticateToken, isAdmin, async (req: any, res) => {
    // This query is a bit complex for Supabase JS client without RPC
    // We'll fetch and group in JS for simplicity or use a raw query if we had one
    const { data: txs, error } = await supabase
      .from('transactions')
      .select('created_at, amount')
      .eq('type', 'credit')
      .order('created_at', { ascending: true });

    if (error) return res.status(500).json({ error: error.message });

    const growth = txs.reduce((acc: any[], tx: any) => {
      const date = tx.created_at.split('T')[0];
      const existing = acc.find(a => a.date === date);
      if (existing) {
        existing.total += tx.amount;
      } else {
        acc.push({ date, total: tx.amount });
      }
      return acc;
    }, []).slice(-30);

    res.json(growth);
  });

  // --- Notifications ---
  app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.user!.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(notifications);
  });

  app.post('/api/notifications/:id/read', authenticateToken, async (req: any, res) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user!.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Notification marked as read' });
  });

  app.post('/api/admin/broadcast', authenticateToken, isAdmin, async (req: any, res) => {
    const { message } = req.body;
    
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'customer');

      if (usersError) throw usersError;
      
      const notifications = users.map(u => ({
        user_id: u.id,
        title: 'System Announcement',
        message,
        type: 'broadcast'
      }));

      const { error: notifyError } = await supabase.from('notifications').insert(notifications);
      if (notifyError) throw notifyError;
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'broadcast_message',
        details: message,
        ip_address: req.ip
      });
      
      res.json({ message: 'Broadcast sent' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Customer Routes ---
  app.get('/api/customer/account', authenticateToken, async (req: any, res) => {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', req.user.id)
      .single();
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(account);
  });

  app.get('/api/customer/transactions', authenticateToken, async (req: any, res) => {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) return res.status(404).json({ error: 'Account not found' });
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(transactions);
  });

  app.get('/api/customer/transactions/export', authenticateToken, async (req: any, res) => {
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (accountError || !account) return res.status(404).json({ error: 'Account not found' });
    
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', account.id)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    let csv = 'Date,Type,Amount,Description,Reference\n';
    transactions.forEach(tx => {
      csv += `${tx.created_at},${tx.type},${tx.amount},"${tx.description}",${tx.reference_id || ''}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=statement.csv');
    res.status(200).send(csv);
  });

  app.post('/api/customer/transfer', authenticateToken, async (req: any, res) => {
    const { toAccountNumber, amount, description, pin, bankName, recipientName, type, currency, swiftCode } = req.body;
    
    try {
      const { data: fromAccount, error: fromError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      if (fromError || !fromAccount) return res.status(404).json({ error: 'Account not found' });
      if (fromAccount.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
      
      if (!fromAccount.pin) {
        return res.status(400).json({ error: 'Transfer PIN not set. Please contact admin to set it.' });
      }
      if (fromAccount.pin !== pin) {
        return res.status(403).json({ error: 'Invalid Transfer PIN' });
      }
      
      const isInternational = type === 'international';
      const { data: toAccount } = await supabase
        .from('accounts')
        .select('*')
        .eq('account_number', toAccountNumber)
        .single();
      
      const isInternal = !!toAccount;

      // Debit sender
      const { error: debitError } = await supabase
        .from('accounts')
        .update({ balance: fromAccount.balance - amount })
        .eq('id', fromAccount.id);

      if (debitError) throw debitError;
      
      let finalDescription = description;
      if (isInternational) {
        finalDescription = `International Transfer (${currency}): ${description} to ${recipientName} at ${bankName} (${toAccountNumber}) - SWIFT: ${swiftCode || 'N/A'}`;
      } else if (bankName) {
        finalDescription = `Local Transfer: ${description} to ${recipientName} at ${bankName} (${toAccountNumber})`;
      }

      await supabase.from('transactions').insert({
        account_id: fromAccount.id,
        type: 'debit',
        amount,
        description: finalDescription,
        reference_id: toAccountNumber
      });
      
      if (isInternal && !isInternational) {
        // Credit recipient
        await supabase
          .from('accounts')
          .update({ balance: toAccount.balance + amount })
          .eq('id', toAccount.id);

        await supabase.from('transactions').insert({
          account_id: toAccount.id,
          type: 'credit',
          amount,
          description: `Transfer from ${fromAccount.account_number}: ${description}`,
          reference_id: fromAccount.account_number
        });
      }

      res.json({ message: 'Transfer successful' });
    } catch (error: any) {
      console.error('Transfer error:', error);
      res.status(500).json({ error: 'Transfer failed' });
    }
  });

  // --- Payment Methods Routes ---
  app.get('/api/admin/payment-methods', authenticateToken, isAdmin, async (req, res) => {
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(methods);
  });

  app.post('/api/admin/payment-methods', authenticateToken, isAdmin, async (req: any, res) => {
    const { type, name, details, instructions } = req.body;
    
    try {
      const { data: method, error: methodError } = await supabase
        .from('payment_methods')
        .insert({ type, name, details, instructions })
        .select()
        .single();

      if (methodError) throw methodError;
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'add_payment_method',
        details: JSON.stringify({ type, name }),
        ip_address: req.ip
      });

      res.status(201).json({ id: method.id, message: 'Payment method added' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/payment-methods/:id', authenticateToken, isAdmin, async (req: any, res) => {
    const { type, name, details, instructions, is_active } = req.body;
    
    try {
      const { error: methodError } = await supabase
        .from('payment_methods')
        .update({ type, name, details, instructions, is_active: is_active ? true : false })
        .eq('id', req.params.id);

      if (methodError) throw methodError;
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'update_payment_method',
        details: JSON.stringify({ id: req.params.id, name }),
        ip_address: req.ip
      });

      res.json({ message: 'Payment method updated' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/admin/payment-methods/:id', authenticateToken, isAdmin, async (req: any, res) => {
    try {
      const { error: methodError } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', req.params.id);

      if (methodError) throw methodError;
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'delete_payment_method',
        details: JSON.stringify({ id: req.params.id }),
        ip_address: req.ip
      });

      res.json({ message: 'Payment method deleted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/customer/payment-methods', authenticateToken, async (req, res) => {
    const { data: methods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(methods);
  });

  // --- Admin Routes ---
  app.get('/api/admin/transactions', authenticateToken, isAdmin, async (req, res) => {
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts!inner (
          account_number,
          users!inner (
            full_name
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    const formatted = transactions.map(tx => ({
      ...tx,
      account_number: tx.accounts?.account_number,
      full_name: tx.accounts?.users?.full_name
    }));
    
    res.json(formatted);
  });

  app.get('/api/admin/stats', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { count: totalCustomers } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'customer');
      const { count: pendingApprovals } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: activeAccounts } = await supabase.from('users').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { data: balances } = await supabase.from('accounts').select('balance');
      
      const totalSystemBalance = balances?.reduce((sum, acc) => sum + (acc.balance || 0), 0) || 0;
      
      res.json({
        totalCustomers: totalCustomers || 0,
        pendingApprovals: pendingApprovals || 0,
        activeAccounts: activeAccounts || 0,
        totalSystemBalance
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/customers', authenticateToken, isAdmin, async (req, res) => {
    const { data: customers, error } = await supabase
      .from('users')
      .select('*, accounts(account_number, balance, pin)')
      .eq('role', 'customer');

    if (error) return res.status(500).json({ error: error.message });
    
    const formatted = customers.map(user => ({
      ...user,
      account_number: user.accounts?.[0]?.account_number,
      balance: user.accounts?.[0]?.balance,
      pin: user.accounts?.[0]?.pin
    }));
    
    res.json(formatted);
  });

  app.get('/api/admin/customers/:id/details', authenticateToken, isAdmin, async (req, res) => {
    try {
      const { data: customer, error: userError } = await supabase
        .from('users')
        .select('*, accounts(id, account_number, balance, pin)')
        .eq('id', req.params.id)
        .eq('role', 'customer')
        .single();
      
      if (userError || !customer) return res.status(404).json({ error: 'Customer not found' });
      
      const accountId = customer.accounts?.[0]?.id;
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .order('created_at', { ascending: false })
        .limit(10);
      
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', req.params.id);
      
      const formattedCustomer = {
        ...customer,
        account_number: customer.accounts?.[0]?.account_number,
        balance: customer.accounts?.[0]?.balance,
        pin: customer.accounts?.[0]?.pin
      };
      
      res.json({ customer: formattedCustomer, transactions: transactions || [], loans: loans || [] });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/customers/:id/status', authenticateToken, isAdmin, async (req: any, res) => {
    const { status } = req.body;
    const { error } = await supabase.from('users').update({ status }).eq('id', req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    
    await supabase.from('audit_logs').insert({
      admin_id: req.user!.id,
      action: 'update_customer_status',
      details: JSON.stringify({ id: req.params.id, status }),
      ip_address: req.ip
    });
      
    res.json({ message: 'Status updated' });
  });

  app.delete('/api/admin/customers/:id', authenticateToken, isAdmin, async (req: any, res) => {
    const userId = req.params.id;
    
    try {
      // Supabase handles cascading if configured, but we'll be explicit if needed
      // Actually, standard Supabase setup might not cascade unless specified in SQL.
      // We'll just delete the user and assume foreign keys are handled or we delete them.
      
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) throw error;
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'delete_customer',
        details: JSON.stringify({ id: userId }),
        ip_address: req.ip
      });
      
      res.json({ message: 'Customer account deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/customers/:id/reset-pin', authenticateToken, isAdmin, async (req: any, res) => {
    const { newPin } = req.body;
    const { error } = await supabase.from('accounts').update({ pin: newPin }).eq('user_id', req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    
    await supabase.from('audit_logs').insert({
      admin_id: req.user!.id,
      action: 'reset_customer_pin',
      details: JSON.stringify({ id: req.params.id }),
      ip_address: req.ip
    });
      
    res.json({ message: 'Transfer PIN reset successfully' });
  });

  app.post('/api/admin/customers/:id/update', authenticateToken, isAdmin, async (req: any, res) => {
    const { full_name, email, country, city, age } = req.body;
    const { error } = await supabase
      .from('users')
      .update({ full_name, email, country, city, age })
      .eq('id', req.params.id);
    
    if (error) return res.status(500).json({ error: error.message });
    
    await supabase.from('audit_logs').insert({
      admin_id: req.user!.id,
      action: 'update_customer_profile',
      details: JSON.stringify({ id: req.params.id, full_name, email }),
      ip_address: req.ip
    });
      
    res.json({ message: 'Customer updated' });
  });

  app.post('/api/admin/credit', authenticateToken, isAdmin, async (req, res) => {
    const { userId, amount, description } = req.body;
    
    try {
      const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (accError || !account) return res.status(404).json({ error: 'Account not found' });

      await supabase.from('accounts').update({ balance: account.balance + amount }).eq('id', account.id);
      await supabase.from('transactions').insert({
        account_id: account.id,
        type: 'credit',
        amount,
        description: description || 'Admin Credit'
      });

      res.json({ message: 'Account credited successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/customers/:id/adjust-balance', authenticateToken, isAdmin, async (req: any, res) => {
    const { amount, type, description } = req.body; // type: 'credit' or 'debit'
    
    try {
      const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', req.params.id)
        .single();
      
      if (accError || !account) return res.status(404).json({ error: 'Account not found' });

      const adjustment = type === 'credit' ? amount : -amount;
      await supabase.from('accounts').update({ balance: account.balance + adjustment }).eq('id', account.id);
      await supabase.from('transactions').insert({
        account_id: account.id,
        type,
        amount,
        description: description || `Admin ${type}`
      });
        
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'adjust_balance',
        details: JSON.stringify({ id: req.params.id, amount, type, description }),
        ip_address: req.ip
      });

      res.json({ message: 'Balance adjusted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Loan Routes ---
  app.post('/api/customer/loans', authenticateToken, async (req: any, res) => {
    const { amount, interestRate, repaymentSchedule, purpose, duration } = req.body;
    
    try {
      const { data: loan, error } = await supabase
        .from('loans')
        .insert({
          user_id: req.user.id,
          amount,
          interest_rate: interestRate,
          repayment_schedule: repaymentSchedule,
          purpose: purpose || 'General Loan',
          duration: duration || '12 months',
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json({ message: 'Loan application submitted', loan });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/customer/loans', authenticateToken, async (req: any, res) => {
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(loans);
  });

  app.get('/api/admin/loans', authenticateToken, isAdmin, async (req, res) => {
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*, users(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    
    const formatted = loans.map(loan => ({
      ...loan,
      full_name: loan.users?.full_name,
      email: loan.users?.email
    }));
    
    res.json(formatted);
  });

  app.post('/api/admin/loans/:id/status', authenticateToken, isAdmin, async (req: any, res) => {
    const { status } = req.body;
    const loanStatus = status === 'approved' ? 'repaying' : status;
    
    try {
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .update({ status: loanStatus })
        .eq('id', req.params.id)
        .select()
        .single();

      if (loanError) throw loanError;
      
      if (status === 'approved') {
        const { data: account, error: accError } = await supabase
          .from('accounts')
          .select('*')
          .eq('user_id', loan.user_id)
          .single();
        
        if (accError || !account) throw new Error('Account not found');

        await supabase.from('accounts').update({ balance: account.balance + loan.amount }).eq('id', account.id);
        await supabase.from('transactions').insert({
          account_id: account.id,
          type: 'credit',
          amount: loan.amount,
          description: `Loan Disbursement: ${loan.purpose || 'Loan'}`
        });
      }

      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'update_loan_status',
        details: JSON.stringify({ id: req.params.id, status: loanStatus }),
        ip_address: req.ip
      });

      res.json({ message: 'Loan status updated' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/loans/:id/repayment', authenticateToken, isAdmin, async (req, res) => {
    const { amount } = req.body;
    
    try {
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (loanError || !loan) return res.status(404).json({ error: 'Loan not found' });

      const newPaidAmount = (loan.paid_amount || 0) + amount;
      const newStatus = newPaidAmount >= loan.amount ? 'completed' : loan.status;

      const { error: updateError } = await supabase
        .from('loans')
        .update({ paid_amount: newPaidAmount, status: newStatus })
        .eq('id', req.params.id);

      if (updateError) throw updateError;
      
      res.json({ message: 'Repayment recorded' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Notification Routes ---
  app.post('/api/admin/notifications/send', authenticateToken, isAdmin, async (req: any, res) => {
    const { userId, title, message, type } = req.body;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({ user_id: userId, title, message, type: type || 'info' });
      
      if (error) throw error;
      
      await supabase.from('audit_logs').insert({
        admin_id: req.user!.id,
        action: 'send_notification',
        details: JSON.stringify({ userId, title, type }),
        ip_address: req.ip
      });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Beneficiary Routes ---
  app.get('/api/customer/beneficiaries', authenticateToken, async (req: any, res) => {
    const { data: beneficiaries, error } = await supabase
      .from('beneficiaries')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(beneficiaries);
  });

  app.post('/api/customer/beneficiaries', authenticateToken, async (req: any, res) => {
    const { name, accountNumber, bankName } = req.body;
    
    try {
      const { error } = await supabase
        .from('beneficiaries')
        .insert({
          user_id: req.user.id,
          name,
          account_number: accountNumber,
          bank_name: bankName
        });

      if (error) throw error;
      res.status(201).json({ message: 'Beneficiary added' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/customer/beneficiaries/:id', authenticateToken, async (req: any, res) => {
    const { error } = await supabase
      .from('beneficiaries')
      .delete()
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Beneficiary removed' });
  });

  // --- Deposit/Withdraw Routes ---
  app.post('/api/customer/deposit', authenticateToken, async (req: any, res) => {
    const { amount, description } = req.body;
    
    try {
      const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      if (accError || !account) return res.status(404).json({ error: 'Account not found' });

      await supabase.from('accounts').update({ balance: account.balance + amount }).eq('id', account.id);
      await supabase.from('transactions').insert({
        account_id: account.id,
        type: 'credit',
        amount,
        description: description || 'Self Deposit'
      });

      res.json({ message: 'Deposit successful' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/customer/withdraw', authenticateToken, async (req: any, res) => {
    const { amount, description } = req.body;
    
    try {
      const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', req.user.id)
        .single();
      
      if (accError || !account) return res.status(404).json({ error: 'Account not found' });
      if (account.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

      await supabase.from('accounts').update({ balance: account.balance - amount }).eq('id', account.id);
      await supabase.from('transactions').insert({
        account_id: account.id,
        type: 'debit',
        amount,
        description: description || 'Self Withdrawal'
      });

      res.json({ message: 'Withdrawal successful' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Settings Routes ---
  app.post('/api/customer/settings/profile-picture', authenticateToken, upload.single('image'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    
    const imageUrl = `/uploads/${req.file.filename}`;
    const { error } = await supabase.from('users').update({ profile_picture: imageUrl }).eq('id', req.user.id);
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ imageUrl });
  });

  app.get('/api/chat/history/:userId', authenticateToken, async (req: any, res) => {
    const otherId = req.params.userId;
    const myId = req.user.id;
    
    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(messages);
  });

  // --- Public Contact ---
  app.post('/api/public/contact', async (req, res) => {
    const { name, email, message } = req.body;
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name, email, message });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json({ message: 'Message sent successfully' });
  });

  // --- API Error Handling ---
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Server Error:', err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({ 
      error: err.message || 'Internal Server Error',
      details: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  });

async function startServer() {
  const { Server } = await import('socket.io');
  httpServer = createServer(app);
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // --- Chat Socket ---
  io.on('connection', (socket: any) => {
    console.log('User connected:', socket.id);

    socket.on('join', (userId: any) => {
      socket.join(`user_${userId}`);
    });

    socket.on('send_message', async (data: any) => {
      const { senderId, receiverId, message } = data;
      
      try {
        const { data: chatMessage, error } = await supabase
          .from('chat_messages')
          .insert({
            sender_id: senderId,
            receiver_id: receiverId,
            message
          })
          .select()
          .single();
        
        if (error) throw error;

        const newMessage = {
          id: chatMessage.id,
          senderId,
          receiverId,
          message,
          createdAt: chatMessage.created_at,
          readStatus: chatMessage.read_status
        };

        if (io) {
          io.to(`user_${receiverId}`).emit('receive_message', newMessage);
        }
        socket.emit('message_sent', newMessage);
      } catch (error) {
        console.error('Socket send_message error:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
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

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// Only start the server if this file is run directly
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer().catch(console.error);
}
