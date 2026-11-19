import axios from 'axios';
import { storageService } from './storage';
import { Transaction } from '../types';

export interface FeeReceiptItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  transactionId: string;
  referenceId: string;
  feeTitle: string;
  feeAmount: number;
  currency: string;
  stageNumber?: number;
  paymentReference?: string;
  notes?: string;
  proofUrl: string;
  proofFileName?: string;
  status: 'submitted' | 'verified';
  submittedAt: string;
}

const getLocalCacheKey = (userId: string) => `econest_fee_receipts_${userId}`;

function readLocalReceipts(userId: string): FeeReceiptItem[] {
  try {
    const raw = localStorage.getItem(getLocalCacheKey(userId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return [];
}

function writeLocalReceipts(userId: string, receipts: FeeReceiptItem[]) {
  try {
    localStorage.setItem(getLocalCacheKey(userId), JSON.stringify(receipts));
  } catch {
    // ignore storage errors
  }
}

export const feeReceiptService = {
  async uploadReceiptFile(file: File): Promise<{ url: string; filename: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success && res.data?.url) {
        return { url: res.data.url, filename: res.data.filename || file.name };
      }
    } catch (err) {
      console.warn('Backend /api/upload failed, falling back to inline preview:', err);
    }

    // Fallback: data URL via FileReader
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return { url: dataUrl, filename: file.name };
  },

  async submitFeeReceipt(params: {
    userId: string;
    userEmail: string;
    userName: string;
    transactionId: string;
    referenceId: string;
    feeTitle: string;
    feeAmount: number;
    currency?: string;
    stageNumber?: number;
    paymentReference?: string;
    notes?: string;
    file?: File | null;
    proofUrl?: string;
    proofFileName?: string;
  }): Promise<FeeReceiptItem> {
    let proofUrl = params.proofUrl || '';
    let proofFileName = params.proofFileName || '';

    if (params.file) {
      const uploaded = await this.uploadReceiptFile(params.file);
      proofUrl = uploaded.url;
      proofFileName = uploaded.filename;
    }

    const receiptId = `fr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const submittedAt = new Date().toISOString();

    const record: FeeReceiptItem = {
      id: receiptId,
      userId: params.userId,
      userEmail: params.userEmail,
      userName: params.userName,
      transactionId: params.transactionId,
      referenceId: params.referenceId,
      feeTitle: params.feeTitle || 'Settlement Fee',
      feeAmount: Number(params.feeAmount || 0),
      currency: params.currency || 'USD',
      stageNumber: params.stageNumber,
      paymentReference: params.paymentReference?.trim() || undefined,
      notes: params.notes?.trim() || undefined,
      proofUrl,
      proofFileName,
      status: 'submitted',
      submittedAt
    };

    // 1. Save to local cache immediately for instant UI updates across tabs
    const existingLocal = readLocalReceipts(params.userId);
    const mergedLocal = [
      record,
      ...existingLocal.filter(
        r =>
          (!record.transactionId || r.transactionId !== record.transactionId) &&
          (!record.referenceId || r.referenceId !== record.referenceId)
      )
    ];
    writeLocalReceipts(params.userId, mergedLocal);

    // 2. Persist to Express backend
    try {
      await axios.post('/api/fee-receipts', record);
    } catch (err) {
      console.warn('Backend /api/fee-receipts save warning:', err);
    }

    // 3. Persist to Firestore deposits collection (allowed by existing rules for owner)
    try {
      await storageService.saveDeposit({
        id: receiptId,
        userId: params.userId,
        amount: Number(params.feeAmount || 0),
        paymentMethodId: `fee_receipt:${params.referenceId || params.transactionId}`,
        proofImage: proofUrl,
        status: 'pending',
        createdAt: submittedAt,
        // Extended metadata stored on document
        ...( {
          type: 'fee_receipt',
          userEmail: params.userEmail,
          userName: params.userName,
          transactionId: params.transactionId,
          referenceId: params.referenceId,
          feeTitle: record.feeTitle,
          paymentReference: record.paymentReference || '',
          notes: record.notes || '',
          proofFileName: proofFileName || '',
          stageNumber: params.stageNumber || 1
        } as any )
      });
    } catch (err) {
      console.warn('Firestore deposit record save warning:', err);
    }

    // 4. Save Customer Notification & Admin Audit Log
    try {
      await storageService.saveNotification({
        id: Math.random().toString(36).substr(2, 9),
        userId: params.userId,
        title: 'Fee Payment Receipt Submitted',
        message: `Your payment receipt for ${record.feeTitle} ($${record.feeAmount.toFixed(2)} USD, Ref: ${record.referenceId}) has been submitted for clearance verification.`,
        type: 'success',
        isRead: false,
        createdAt: submittedAt
      });

      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: params.userId,
        adminName: params.userName || params.userEmail,
        action: 'FEE_RECEIPT_SUBMITTED',
        details: `Customer ${params.userEmail} submitted fee payment receipt for Ref #${record.referenceId} ($${record.feeAmount.toFixed(2)} USD)`,
        createdAt: submittedAt
      });
    } catch {
      // Non-blocking audit/notification
    }

    return record;
  },

  async getReceiptsForUser(userId: string): Promise<FeeReceiptItem[]> {
    const mergedMap = new Map<string, FeeReceiptItem>();
    const addItem = (item: FeeReceiptItem) => {
      const key = item.referenceId || item.transactionId || item.id;
      if (key && !mergedMap.has(key)) {
        mergedMap.set(key, item);
      }
    };

    // Local cache first
    readLocalReceipts(userId).forEach(addItem);

    // Backend ledger
    try {
      const res = await axios.get(`/api/fee-receipts?userId=${encodeURIComponent(userId)}`);
      if (Array.isArray(res.data?.receipts)) {
        res.data.receipts.forEach(addItem);
      }
    } catch {
      // ignore if offline
    }

    // Firestore deposits fallback/sync
    try {
      const deposits = await storageService.getDepositsByUserId(userId);
      deposits.forEach((d: any) => {
        if (d.type === 'fee_receipt' || (typeof d.paymentMethodId === 'string' && d.paymentMethodId.startsWith('fee_receipt:'))) {
          const refFromMethod = typeof d.paymentMethodId === 'string'
            ? d.paymentMethodId.replace('fee_receipt:', '')
            : '';
          addItem({
            id: d.id,
            userId: d.userId,
            userEmail: d.userEmail || '',
            userName: d.userName || 'Customer',
            transactionId: d.transactionId || '',
            referenceId: d.referenceId || refFromMethod,
            feeTitle: d.feeTitle || 'Settlement Fee',
            feeAmount: Number(d.amount || 0),
            currency: 'USD',
            stageNumber: d.stageNumber,
            paymentReference: d.paymentReference,
            notes: d.notes,
            proofUrl: d.proofImage || '',
            proofFileName: d.proofFileName,
            status: 'submitted',
            submittedAt: d.createdAt || new Date().toISOString()
          });
        }
      });
    } catch {
      // ignore
    }

    const result = Array.from(mergedMap.values());
    writeLocalReceipts(userId, result);
    return result;
  },

  async getAllReceiptsForAdmin(): Promise<FeeReceiptItem[]> {
    const mergedMap = new Map<string, FeeReceiptItem>();
    const addItem = (item: FeeReceiptItem) => {
      const key = item.referenceId || item.transactionId || item.id;
      if (key && !mergedMap.has(key)) {
        mergedMap.set(key, item);
      }
    };

    try {
      const res = await axios.get('/api/fee-receipts');
      if (Array.isArray(res.data?.receipts)) {
        res.data.receipts.forEach(addItem);
      }
    } catch {
      // ignore
    }

    try {
      const deposits = await storageService.getDeposits();
      deposits.forEach((d: any) => {
        if (d.type === 'fee_receipt' || (typeof d.paymentMethodId === 'string' && d.paymentMethodId.startsWith('fee_receipt:'))) {
          const refFromMethod = typeof d.paymentMethodId === 'string'
            ? d.paymentMethodId.replace('fee_receipt:', '')
            : '';
          addItem({
            id: d.id,
            userId: d.userId,
            userEmail: d.userEmail || '',
            userName: d.userName || 'Customer',
            transactionId: d.transactionId || '',
            referenceId: d.referenceId || refFromMethod,
            feeTitle: d.feeTitle || 'Settlement Fee',
            feeAmount: Number(d.amount || 0),
            currency: 'USD',
            stageNumber: d.stageNumber,
            paymentReference: d.paymentReference,
            notes: d.notes,
            proofUrl: d.proofImage || '',
            proofFileName: d.proofFileName,
            status: 'submitted',
            submittedAt: d.createdAt || new Date().toISOString()
          });
        }
      });
    } catch {
      // ignore
    }

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  },

  isTransactionFeeSubmitted(tx: Transaction | { id?: string; referenceId?: string; reference_id?: string; feeReceiptSubmitted?: boolean }, receipts: FeeReceiptItem[]): boolean {
    if ((tx as any).feeReceiptSubmitted) return true;
    const txId = tx.id || '';
    const refId = tx.referenceId || (tx as any).reference_id || '';
    return receipts.some(
      r => (txId && r.transactionId === txId) || (refId && r.referenceId === refId)
    );
  }
};
