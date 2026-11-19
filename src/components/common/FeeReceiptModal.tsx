import React, { useState, useRef } from 'react';
import { X, Upload, FileCheck, Loader2, CheckCircle2, Image as ImageIcon, ShieldCheck, AlertCircle } from 'lucide-react';
import { feeReceiptService, FeeReceiptItem } from '../../services/feeReceiptService';
import toast from 'react-hot-toast';

interface FeeReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
  userName: string;
  transactionId: string;
  referenceId: string;
  feeTitle: string;
  feeAmount: number;
  stageNumber?: number;
  escrowAccount?: string;
  escrowBank?: string;
  routingCode?: string;
  onSuccess: (receipt: FeeReceiptItem) => void;
}

export const FeeReceiptModal: React.FC<FeeReceiptModalProps> = ({
  isOpen,
  onClose,
  userId,
  userEmail,
  userName,
  transactionId,
  referenceId,
  feeTitle,
  feeAmount,
  stageNumber,
  escrowAccount,
  escrowBank,
  routingCode,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(String(reader.result || ''));
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please upload your fee payment receipt screenshot or document.');
      return;
    }

    setIsSubmitting(true);
    try {
      const receipt = await feeReceiptService.submitFeeReceipt({
        userId,
        userEmail,
        userName,
        transactionId,
        referenceId,
        feeTitle,
        feeAmount,
        currency: 'USD',
        stageNumber,
        paymentReference,
        notes,
        file: selectedFile
      });

      toast.success('Payment receipt submitted! Fee notice cleared from your dashboard.');
      setSelectedFile(null);
      setPreviewUrl('');
      setPaymentReference('');
      setNotes('');
      onSuccess(receipt);
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit payment receipt');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight">Submit Fee Payment Receipt</h3>
              <p className="text-[11px] text-slate-400 font-mono">Transfer Ref: #{referenceId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Fee Summary Box */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                  Fee Obligation
                </span>
                <p className="text-sm font-bold text-slate-900">{feeTitle}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-amber-700 block">Amount Paid</span>
                <span className="text-lg font-black font-mono text-amber-900">
                  ${Number(feeAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} USD
                </span>
              </div>
            </div>

            {(escrowAccount || escrowBank) && (
              <div className="pt-2 border-t border-amber-200/70 grid grid-cols-2 gap-2 text-[11px]">
                {escrowBank && (
                  <div>
                    <span className="text-amber-700/80 block">Escrow Bank:</span>
                    <span className="font-bold text-slate-800">{escrowBank}</span>
                  </div>
                )}
                {escrowAccount && (
                  <div>
                    <span className="text-amber-700/80 block">Account / Ledger:</span>
                    <span className="font-mono font-bold text-slate-900">{escrowAccount}</span>
                  </div>
                )}
                {routingCode && (
                  <div className="col-span-2">
                    <span className="text-amber-700/80">Routing Code: </span>
                    <span className="font-mono font-bold text-slate-900">{routingCode}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Receipt File Upload */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Upload Payment Receipt *</span>
              <span className="text-[10px] font-semibold text-emerald-600">Image or PDF</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full p-5 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 text-center cursor-pointer ${
                selectedFile
                  ? 'border-emerald-400 bg-emerald-50/50'
                  : 'border-slate-300 bg-slate-50 hover:border-emerald-500 hover:bg-emerald-50/30'
              }`}
            >
              {previewUrl ? (
                <div className="space-y-2 w-full">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-40 mx-auto rounded-xl border border-slate-200 shadow-sm object-contain"
                  />
                  <p className="text-xs font-bold text-emerald-700 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="truncate max-w-[260px]">{selectedFile?.name}</span>
                  </p>
                  <span className="text-[10px] text-slate-500 underline">Click to replace receipt</span>
                </div>
              ) : selectedFile ? (
                <div className="space-y-1">
                  <ImageIcon className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-emerald-700">{selectedFile.name}</p>
                  <span className="text-[10px] text-slate-500 underline">Click to change file</span>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                    <Upload className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Click to Upload Payment Receipt
                  </p>
                  <p className="text-[10px] text-slate-400">
                    PNG, JPG, WEBP or PDF screenshot of fee payment (Max 10MB)
                  </p>
                </>
              )}
            </button>
          </div>

          {/* Optional Payment Reference */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Payment Confirmation / Reference #</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="e.g. Receipt # / Bank Reference / Crypto TXID"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Optional Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Additional Note</span>
              <span className="text-[10px] text-slate-400 font-medium lowercase">optional</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any payment note for the Treasury team..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Once submitted, your payment receipt is sent securely to Bank Administration and this fee payment prompt will be permanently cleared from your dashboard.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedFile}
              className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting Receipt...</span>
                </>
              ) : (
                <>
                  <FileCheck className="h-4 w-4" />
                  <span>Submit Payment Receipt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
