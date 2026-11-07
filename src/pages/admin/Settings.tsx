import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe, 
  Lock,
  Save,
  Loader2,
  AlertTriangle,
  Mail,
  DollarSign,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  FileText,
  Printer,
  Share2,
  ArrowRight,
  RefreshCw,
  Sliders,
  Power,
  Zap,
  Radio,
  Server,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  UserCheck,
  Inbox,
  Layers,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ShieldCheck,
  Key,
  ArrowRightLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storage';
import { emailService } from '../../services/emailService';
import { FeeReason, TransferScreenConfig, SmtpConfig, EmailLog, EmailTemplate, User, FeeStage, ReceiverEmailCustomConfig } from '../../types';
import { DEFAULT_FEE_REASONS, DEFAULT_TRANSFER_SCREEN_CONFIG } from '../../services/bankConfig';

type SettingsTab = 'general' | 'fees' | 'transfer_screen' | 'smtp';

const AdminSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    bank_name: 'ECONEST BANK',
    maintenance_mode: 'false',
    interest_rate: '5.5',
    max_loan_amount: '50000',
    allow_registrations: 'true'
  });

  // Fee Management
  const [feeEnabled, setFeeEnabled] = useState(true);
  const [feeReasons, setFeeReasons] = useState<FeeReason[]>(DEFAULT_FEE_REASONS);
  const [editingFee, setEditingFee] = useState<FeeReason | null>(null);
  const [isAddingFee, setIsAddingFee] = useState(false);
  const [newFee, setNewFee] = useState({
    name: '',
    description: '',
    amount: 10.00,
    isEnabled: true
  });

  // Post-Transfer Screen Customization & Fee Payment Messages
  const [transferScreen, setTransferScreen] = useState<TransferScreenConfig>(DEFAULT_TRANSFER_SCREEN_CONFIG);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [editingStage, setEditingStage] = useState<FeeStage | null>(null);
  const [newStage, setNewStage] = useState({
    title: '',
    amount: 150.00,
    description: '',
    instructions: '',
    statusText: 'Required Stage',
    requiredAccount: 'ESC-AML-9901-EC',
    requiredBank: 'ECONEST Central Reserve Clearing'
  });
  const [testReceiverEmail, setTestReceiverEmail] = useState('');
  const [isSendingTestReceiverEmail, setIsSendingTestReceiverEmail] = useState(false);

  // Email Gateway Configuration (SendGrid Primary / SMTP Fallback)
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    provider: 'sendgrid',
    sendgridApiKey: '',
    sendgridSenderEmail: 'notifications@econestbank.com',
    sendgridSenderName: 'ECONEST BANK Alert',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    user: 'apikey',
    pass: '',
    fromName: 'ECONEST BANK Alert',
    fromEmail: 'notifications@econestbank.com',
    adminAlertEmail: 'bubucyril2@gmail.com',
    enabled: true,
    autoDispatchEnabled: true,
    autoSendTransferReceipt: true,
    autoSendWelcomeEmail: true,
    autoSendAdminTransferAlert: true,
    autoSendChatNotification: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showSendgridKey, setShowSendgridKey] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);

  // Email Server & SendGrid Verification State
  const [isVerifyingSmtp, setIsVerifyingSmtp] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [isVerifyingSendgrid, setIsVerifyingSendgrid] = useState(false);
  const [sendgridVerifyResult, setSendgridVerifyResult] = useState<any>(null);
  const [isUpdatingSmtp, setIsUpdatingSmtp] = useState(false);

  const [customers, setCustomers] = useState<User[]>([]);

  // Preview Email Log Modal State
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // Load general settings
        const data = await storageService.getSettings();
        if (data) {
          setGeneralSettings(prev => ({
            ...prev,
            bank_name: data.bank_name || prev.bank_name,
            maintenance_mode: data.maintenance_mode || prev.maintenance_mode,
            interest_rate: data.interest_rate || prev.interest_rate,
            max_loan_amount: data.max_loan_amount || prev.max_loan_amount,
            allow_registrations: data.allow_registrations || prev.allow_registrations
          }));

          if (data.fee_enabled !== undefined) {
            setFeeEnabled(Boolean(data.fee_enabled));
          }

          if (data.fee_reasons) {
            try {
              const parsed = typeof data.fee_reasons === 'string' ? JSON.parse(data.fee_reasons) : data.fee_reasons;
              if (Array.isArray(parsed) && parsed.length > 0) {
                setFeeReasons(parsed);
              }
            } catch (e) {}
          }

          if (data.transfer_screen_config) {
            try {
              const parsed = typeof data.transfer_screen_config === 'string' 
                ? JSON.parse(data.transfer_screen_config) 
                : data.transfer_screen_config;
              if (parsed && typeof parsed === 'object') {
                setTransferScreen(prev => ({
                  ...DEFAULT_TRANSFER_SCREEN_CONFIG,
                  ...prev,
                  ...parsed,
                  showReceiverEmailInTransfer: parsed.showReceiverEmailInTransfer !== undefined
                    ? Boolean(parsed.showReceiverEmailInTransfer)
                    : false,
                  singleFeeAtATime: parsed.singleFeeAtATime !== undefined
                    ? Boolean(parsed.singleFeeAtATime)
                    : true,
                  singleFeeMessage: {
                    ...DEFAULT_TRANSFER_SCREEN_CONFIG.singleFeeMessage,
                    ...(parsed.singleFeeMessage || {})
                  },
                  multipleFeeStages: Array.isArray(parsed.multipleFeeStages) && parsed.multipleFeeStages.length > 0
                    ? parsed.multipleFeeStages
                    : DEFAULT_TRANSFER_SCREEN_CONFIG.multipleFeeStages,
                  receiverCustomEmailConfig: {
                    ...DEFAULT_TRANSFER_SCREEN_CONFIG.receiverCustomEmailConfig,
                    ...(parsed.receiverCustomEmailConfig || {})
                  }
                }));
              }
            } catch (e) {}
          }
        }

        // Load SMTP config from backend
        try {
          const smtp = await emailService.getSmtpConfig();
          if (smtp) {
            setSmtpConfig(smtp);
            setTestEmailAddress(smtp.adminAlertEmail || 'bubucyril2@gmail.com');
          }
        } catch (e) {}

        // Load registered customers for quick selection
        try {
          const users = await storageService.getUsers();
          setCustomers(users.filter(u => u.role !== 'admin'));
        } catch (e) {}

        // Load email logs
        fetchLogs();
      } catch (error) {
        toast.error('Failed to load system settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const logs = await emailService.getEmailLogs();
      setEmailLogs(logs);
    } catch (e) {
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      // 1. Save to Firestore Settings doc
      const payloadToSave = {
        ...generalSettings,
        fee_enabled: feeEnabled,
        fee_reasons: JSON.stringify(feeReasons),
        transfer_screen_config: JSON.stringify(transferScreen),
        admin_alert_email: smtpConfig.adminAlertEmail,
        smtp_host: smtpConfig.host,
        smtp_port: smtpConfig.port,
        smtp_from_name: smtpConfig.fromName,
        smtp_from_email: smtpConfig.fromEmail,
        email_notifications_enabled: smtpConfig.enabled,
        auto_dispatch_enabled: smtpConfig.autoDispatchEnabled,
        auto_send_transfer_receipt: smtpConfig.autoSendTransferReceipt,
        auto_send_welcome_email: smtpConfig.autoSendWelcomeEmail,
        auto_send_admin_transfer_alert: smtpConfig.autoSendAdminTransferAlert
      };

      await storageService.saveSettings(payloadToSave);

      // 2. Save SMTP config to backend
      await emailService.saveSmtpConfig(smtpConfig);

      // 3. Audit Log
      await storageService.saveAuditLog({
        id: Math.random().toString(36).substr(2, 9),
        adminId: user.id,
        adminName: user.fullName || user.full_name || 'Admin',
        action: 'system_settings_update',
        details: `Updated settings: Fees (${feeEnabled ? 'ON' : 'OFF'}), Reasons (${feeReasons.length}), Screen customization, and SMTP (${smtpConfig.host})`,
        createdAt: new Date().toISOString()
      });

      toast.success('All settings and SendGrid configurations saved successfully!');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + (error.message || 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Fee Reason ON / OFF
  const handleToggleFeeReason = (id: string) => {
    setFeeReasons(prev => prev.map(reason => {
      if (reason.id === id) {
        const nextState = !reason.isEnabled;
        toast.success(`"${reason.name}" fee is now ${nextState ? 'ENABLED (ON)' : 'PAUSED (OFF)'}`);
        return { ...reason, isEnabled: nextState };
      }
      return reason;
    }));
  };

  // Delete Fee Reason
  const handleDeleteFeeReason = (id: string) => {
    if (feeReasons.length <= 1) {
      toast.error('Must keep at least one fee reason in the list');
      return;
    }
    setFeeReasons(prev => prev.filter(r => r.id !== id));
    toast.success('Fee reason removed');
  };

  // Add Fee Reason
  const handleAddFeeReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.name.trim()) {
      toast.error('Please enter a name for the fee reason');
      return;
    }

    const created: FeeReason = {
      id: 'fee-' + Math.random().toString(36).substr(2, 7),
      name: newFee.name.trim(),
      description: newFee.description.trim() || 'Custom administrative fee',
      amount: parseFloat(newFee.amount.toString()) || 0,
      isEnabled: newFee.isEnabled
    };

    setFeeReasons(prev => [...prev, created]);
    setNewFee({ name: '', description: '', amount: 10, isEnabled: true });
    setIsAddingFee(false);
    toast.success(`Added fee reason: "${created.name}"`);
  };

  // Save Edited Fee Reason
  const handleSaveEditedFee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;

    setFeeReasons(prev => prev.map(r => r.id === editingFee.id ? editingFee : r));
    setEditingFee(null);
    toast.success('Fee reason updated');
  };

  // Sequential Fee Stages Handlers (Multiple payments written one after another)
  const handleAddFeeStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStage.title.trim()) {
      toast.error('Please enter a title for the fee stage');
      return;
    }

    const currentStages = transferScreen.multipleFeeStages || [];
    const nextStageNum = currentStages.length + 1;
    const stage: FeeStage = {
      id: 'stage-' + Math.random().toString(36).substr(2, 7),
      stageNumber: nextStageNum,
      title: newStage.title.trim(),
      amount: parseFloat(newStage.amount.toString()) || 50,
      description: newStage.description.trim() || 'Required sequential clearance step',
      instructions: newStage.instructions.trim() || `Step ${nextStageNum} payment instructions: submit to designated clearing ledger.`,
      statusText: newStage.statusText.trim() || `Required - Step ${nextStageNum}`,
      requiredAccount: newStage.requiredAccount.trim() || 'ESC-CLEAR-9901-EC',
      requiredBank: newStage.requiredBank.trim() || 'ECONEST Central Clearance'
    };

    setTransferScreen(prev => ({
      ...prev,
      multipleFeeStages: [...(prev.multipleFeeStages || []), stage]
    }));

    setNewStage({
      title: '',
      amount: 150,
      description: '',
      instructions: '',
      statusText: `Required Stage`,
      requiredAccount: 'ESC-AML-9901-EC',
      requiredBank: 'ECONEST Central Reserve Clearing'
    });
    setIsAddingStage(false);
    toast.success(`Payment stage ${nextStageNum} ("${stage.title}") added!`);
  };

  const handleDeleteFeeStage = (id: string) => {
    const current = transferScreen.multipleFeeStages || [];
    if (current.length <= 1) {
      toast.error('At least one fee payment stage must remain');
      return;
    }
    const filtered = current.filter(s => s.id !== id);
    const renumbered = filtered.map((s, idx) => ({ ...s, stageNumber: idx + 1 }));
    setTransferScreen(prev => ({ ...prev, multipleFeeStages: renumbered }));
    toast.success('Fee stage removed and list renumbered');
  };

  const handleSaveEditedStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStage) return;
    setTransferScreen(prev => ({
      ...prev,
      multipleFeeStages: (prev.multipleFeeStages || []).map(s => s.id === editingStage.id ? editingStage : s)
    }));
    setEditingStage(null);
    toast.success('Fee stage updated');
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const list = [...(transferScreen.multipleFeeStages || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    const renumbered = list.map((s, idx) => ({ ...s, stageNumber: idx + 1 }));
    setTransferScreen(prev => ({ ...prev, multipleFeeStages: renumbered }));
    toast.success('Stage reordered');
  };

  // Test Receiver Email Dispatch
  const handleTestReceiverEmail = async () => {
    if (!testReceiverEmail || !testReceiverEmail.includes('@')) {
      toast.error('Please enter a valid recipient/receiver email address to test');
      return;
    }
    setIsSendingTestReceiverEmail(true);
    try {
      const res = await emailService.sendReceiverCustomTransferEmail({
        receiverEmail: testReceiverEmail.trim(),
        receiverName: 'Valued Beneficiary',
        senderName: user?.fullName || user?.full_name || 'Admin Originator',
        senderEmail: user?.email || 'admin@econestbank.com',
        amount: 25000,
        currency: 'USD',
        referenceId: 'TXN-TEST-' + Math.floor(100000 + Math.random() * 900000),
        bankName: 'ECONEST BANK',
        feeAmount: transferScreen.feePaymentMode === 'single' ? transferScreen.singleFeeMessage?.amount : (transferScreen.multipleFeeStages || []).reduce((sum, s) => sum + s.amount, 0),
        feeBreakdown: transferScreen.feePaymentMode === 'single' 
          ? `Single Settlement Fee: ${transferScreen.singleFeeMessage?.title} ($${transferScreen.singleFeeMessage?.amount})` 
          : `Sequential Stages: ${(transferScreen.multipleFeeStages || []).map(s => `Step ${s.stageNumber}: ${s.title} ($${s.amount})`).join('; ')}`,
        customConfig: transferScreen.receiverCustomEmailConfig
      });
      toast.success(res.simulated ? 'Test receiver email simulated (credentials pending)' : `Real test email delivered to receiver (${testReceiverEmail})!`);
    } catch (e: any) {
      toast.error('Failed to send test email: ' + (e.message || 'Error'));
    } finally {
      setIsSendingTestReceiverEmail(false);
    }
  };

  // Test Email Delivery (SendGrid)
  const handleTestSmtp = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await emailService.sendTestEmail(
        testEmailAddress || smtpConfig.adminAlertEmail,
        smtpConfig
      );
      setSmtpTestResult(res);
      if (res.success) {
        toast.success(res.simulated ? 'Test email logged (Simulated mode)' : 'Test email dispatched successfully via SendGrid!');
      } else {
        toast.error('SendGrid test failed');
      }
      fetchLogs();
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        error: err.response?.data?.error || err.message || 'SendGrid Connection Error'
      });
      toast.error('SendGrid Connection failed');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  // Real SendGrid Connection Verification Handshake
  const handleVerifySmtp = async () => {
    setIsVerifyingSmtp(true);
    setVerifyResult(null);
    try {
      const res = await emailService.verifySmtpConnection(smtpConfig);
      setVerifyResult(res);
      if (res.success) {
        toast.success('SendGrid connection handshake successful!');
      } else {
        toast.error(res.error || 'SendGrid connection failed');
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'SendGrid Connection Error';
      setVerifyResult({ success: false, error: errMsg });
      toast.error(errMsg);
    } finally {
      setIsVerifyingSmtp(false);
    }
  };

  // Dedicated Update SMTP Configuration handler (Requested by user so they can update as soon as they bring the credentials)
  const handleUpdateSmtpOnly = async (alsoVerify = false) => {
    setIsUpdatingSmtp(true);
    try {
      // 1. Save to backend SMTP config file
      await emailService.saveSmtpConfig(smtpConfig);

      // 2. Also persist to storage settings
      const existing = await storageService.getSettings();
      await storageService.saveSettings({
        ...existing,
        smtp_host: smtpConfig.host,
        smtp_port: smtpConfig.port,
        smtp_user: smtpConfig.user,
        smtp_pass: smtpConfig.pass,
        smtp_secure: smtpConfig.secure,
        smtp_from_name: smtpConfig.fromName,
        smtp_from_email: smtpConfig.fromEmail,
        admin_alert_email: smtpConfig.adminAlertEmail,
        email_notifications_enabled: smtpConfig.enabled,
        auto_dispatch_enabled: smtpConfig.autoDispatchEnabled
      });

      // 3. Audit Log
      if (user) {
        await storageService.saveAuditLog({
          id: Math.random().toString(36).substr(2, 9),
          adminId: user.id,
          adminName: user.fullName || user.full_name || 'Admin',
          action: 'smtp_configuration_update',
          details: `Updated SMTP configuration: Host=${smtpConfig.host}, Port=${smtpConfig.port}, User=${smtpConfig.user}`,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('SMTP Configuration updated and saved to server successfully!');

      if (alsoVerify) {
        if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
          await handleVerifySmtp();
        } else {
          toast.error('Host, Username, and Password are required to test the connection.');
        }
      }
    } catch (err: any) {
      toast.error('Failed to update SMTP: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdatingSmtp(false);
    }
  };

  // Dedicated SendGrid API Key Verification
  const handleVerifySendGrid = async () => {
    if (!smtpConfig.sendgridApiKey) {
      toast.error('Please enter your SendGrid API Key (starts with SG...)');
      return;
    }
    setIsVerifyingSendgrid(true);
    setSendgridVerifyResult(null);
    try {
      const res = await emailService.verifySendGridApiKey(
        smtpConfig.sendgridApiKey,
        smtpConfig.sendgridSenderEmail,
        smtpConfig.sendgridSenderName
      );
      setSendgridVerifyResult({ success: true, message: res.message || 'SendGrid API key verified successfully! Mail sending active.' });
      toast.success('SendGrid API Key verified! Ready to dispatch real emails.');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'SendGrid verification failed';
      setSendgridVerifyResult({ success: false, error: errMsg });
      toast.error('SendGrid Error: ' + errMsg);
    } finally {
      setIsVerifyingSendgrid(false);
    }
  };

  // Dedicated SendGrid Configuration Save & Activate
  const handleUpdateSendGridOnly = async (alsoVerify = false) => {
    setIsUpdatingSmtp(true);
    try {
      const updatedConfig = {
        ...smtpConfig,
        provider: 'sendgrid' as const
      };
      setSmtpConfig(updatedConfig);
      await emailService.saveSmtpConfig(updatedConfig);

      if (user) {
        await storageService.saveAuditLog({
          id: Math.random().toString(36).substr(2, 9),
          adminId: user.id,
          adminName: user.fullName || user.full_name || 'Admin',
          action: 'sendgrid_configuration_update',
          details: `Updated SendGrid settings: Sender=${smtpConfig.sendgridSenderEmail || smtpConfig.fromEmail}`,
          createdAt: new Date().toISOString()
        });
      }

      toast.success('SendGrid configuration saved and activated as primary email engine!');

      if (alsoVerify) {
        await handleVerifySendGrid();
      }
    } catch (err: any) {
      toast.error('Failed to save SendGrid settings: ' + (err.message || 'Unknown error'));
    } finally {
      setIsUpdatingSmtp(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[350px] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Loading System Control Parameters...</p>
      </div>
    );
  }

  // Calculate current active total fee
  const activeFeeTotal = feeReasons
    .filter(r => r.isEnabled)
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">System Settings & Controls</h2>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Configure SendGrid email delivery, transfer fees (ON/OFF), fee reasons, and customer screen customization.
          </p>
        </div>

        <button 
          onClick={handleSaveAll}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/20 transition-all text-sm active:scale-95 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save All Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'general'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SettingsIcon className="h-4 w-4 text-emerald-600" />
          <span>General</span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'fees'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="h-4 w-4 text-amber-500" />
          <span>Transfer Fees & Reasons</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${feeEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
            {feeEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('transfer_screen')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'transfer_screen'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4 text-sky-500" />
          <span>Transfer Screen Message</span>
        </button>

        <button
          onClick={() => setActiveTab('smtp')}
          className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'smtp'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="h-4 w-4 text-emerald-500" />
          <span>SendGrid & Email Relay</span>
          <span className={`w-2 h-2 rounded-full ${smtpConfig.enabled ? 'bg-emerald-500 ring-2 ring-emerald-300' : 'bg-slate-400'}`}></span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: GENERAL CONFIGURATION */}
      {/* ============================================================== */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">General Banking Configuration</h3>
              <p className="text-xs text-slate-500">Core parameters governing global institution rules</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Institution / Bank Name</label>
              <input 
                type="text" 
                value={generalSettings.bank_name}
                onChange={(e) => setGeneralSettings({...generalSettings, bank_name: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-semibold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Default Lending Interest Rate (%)</label>
              <input 
                type="number" 
                step="0.1"
                value={generalSettings.interest_rate}
                onChange={(e) => setGeneralSettings({...generalSettings, interest_rate: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Max Personal Loan Ceiling ($)</label>
              <input 
                type="number" 
                value={generalSettings.max_loan_amount}
                onChange={(e) => setGeneralSettings({...generalSettings, max_loan_amount: e.target.value})}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <p className="text-sm font-bold text-slate-900">Maintenance Mode</p>
                <p className="text-xs text-slate-500">Temporarily restrict customer portal access for scheduled maintenance</p>
              </div>
              <button 
                type="button"
                onClick={() => setGeneralSettings({...generalSettings, maintenance_mode: generalSettings.maintenance_mode === 'true' ? 'false' : 'true'})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  generalSettings.maintenance_mode === 'true' ? 'bg-red-500' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  generalSettings.maintenance_mode === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <div>
                <p className="text-sm font-bold text-slate-900">New Public Registrations</p>
                <p className="text-xs text-slate-500">Allow new prospective customers to open accounts through the public portal</p>
              </div>
              <button 
                type="button"
                onClick={() => setGeneralSettings({...generalSettings, allow_registrations: generalSettings.allow_registrations === 'true' ? 'false' : 'true'})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  generalSettings.allow_registrations === 'true' ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  generalSettings.allow_registrations === 'true' ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: TRANSFER FEE MANAGEMENT & REASONS OF FEE (ON / OFF) */}
      {/* ============================================================== */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Master Fee Switch Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${feeEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Transfer Surcharge & Fee System</h3>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      feeEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Master Switch: {feeEnabled ? 'ENABLED (ON)' : 'DISABLED (OFF)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    When ON, active fee reasons below are debited during customer transfers. When OFF, transfers are 100% free with zero fees.
                  </p>
                </div>
              </div>

              {/* Master Toggle Button */}
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 self-start sm:self-center">
                <span className="text-xs font-bold text-slate-700 px-2">
                  Fees: {feeEnabled ? 'ON' : 'OFF'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = !feeEnabled;
                    setFeeEnabled(next);
                    toast.success(`Transfer Fees are now ${next ? 'ACTIVATED (ON)' : 'DEACTIVATED (OFF)'}`);
                  }}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    feeEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    feeEnabled ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* Summary statistics bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Configured Reasons</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{feeReasons.length}</p>
              </div>
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
                <p className="text-[10px] uppercase font-bold text-emerald-700">Active (ON) Reasons</p>
                <p className="text-2xl font-black text-emerald-700 mt-1">
                  {feeReasons.filter(r => r.isEnabled).length}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Total Active Fee Surcharge</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {feeEnabled ? `$${activeFeeTotal.toFixed(2)}` : '$0.00 (Waived)'}
                </p>
              </div>
            </div>
          </div>

          {/* Reasons of Fee List Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-slate-900 text-base">Configurable Reasons of Fee</h4>
                <p className="text-xs text-slate-500">
                  Add reasons of fee and turn them ON or OFF anytime. Customers will see these itemized on transfer receipts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingFee(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm self-start sm:self-center"
              >
                <Plus className="h-4 w-4" />
                <span>Add Reason of Fee</span>
              </button>
            </div>

            {/* Add Fee Form Modal / Inline */}
            {isAddingFee && (
              <form onSubmit={handleAddFeeReason} className="p-5 bg-emerald-50/50 border border-emerald-200 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="h-3.5 w-3.5 text-emerald-600" />
                    New Fee Reason Configuration
                  </span>
                  <button 
                    type="button"
                    onClick={() => setIsAddingFee(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Reason Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Express Clearing Surcharge"
                      value={newFee.name}
                      onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Fee Amount ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={newFee.amount}
                      onChange={(e) => setNewFee({ ...newFee, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500 font-bold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Reason Description / Compliance Details</label>
                    <input
                      type="text"
                      placeholder="Brief note shown on transaction statements and debit advice"
                      value={newFee.description}
                      onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newFee.isEnabled}
                      onChange={(e) => setNewFee({ ...newFee, isEnabled: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span>Enable immediately (ON)</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingFee(false)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm"
                    >
                      Save Fee Reason
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Edit Fee Form Inline */}
            {editingFee && (
              <form onSubmit={handleSaveEditedFee} className="p-5 bg-sky-50/60 border border-sky-200 rounded-2xl space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-sky-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 className="h-3.5 w-3.5 text-sky-600" />
                    Edit Fee Reason: {editingFee.name}
                  </span>
                  <button 
                    type="button"
                    onClick={() => setEditingFee(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Reason Name</label>
                    <input
                      type="text"
                      value={editingFee.name}
                      onChange={(e) => setEditingFee({ ...editingFee, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Fee Amount ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      value={editingFee.amount}
                      onChange={(e) => setEditingFee({ ...editingFee, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-500 font-bold"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Reason Description</label>
                    <input
                      type="text"
                      value={editingFee.description}
                      onChange={(e) => setEditingFee({ ...editingFee, description: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFee(null)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-sm"
                  >
                    Update Reason
                  </button>
                </div>
              </form>
            )}

            {/* List of Reasons */}
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden">
              {feeReasons.map((reason) => (
                <div 
                  key={reason.id} 
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                    reason.isEnabled ? 'bg-white' : 'bg-slate-50/60 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => handleToggleFeeReason(reason.id)}
                      className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                        reason.isEnabled ? 'bg-emerald-600' : 'bg-slate-300'
                      }`}
                      title={reason.isEnabled ? 'Click to switch OFF' : 'Click to switch ON'}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        reason.isEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm sm:text-base">{reason.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          reason.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                        }`}>
                          {reason.isEnabled ? 'ON' : 'OFF'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl">{reason.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pl-14 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-base font-black text-slate-900 font-mono">
                      ${reason.amount.toFixed(2)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingFee(reason)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Edit Fee Reason"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFeeReason(reason.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Fee Reason"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CUSTOMIZE CUSTOMER POST-TRANSFER SCREEN & FEE MESSAGES */}
      {/* ============================================================== */}
      {activeTab === 'transfer_screen' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Top Notice & Quick Update Bar */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Live Transfer Screen & Receiver Messaging Engine
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Post-Transfer Fee Messages & Receiver Email Setup
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Control the fee payment messages customers see on their screen immediately after transfer (single or multiple sequential payments), configure auto receiver email dispatch, and update settings anytime.
              </p>
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>UPDATE & SAVE SETTINGS</span>
                </>
              )}
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Controls Column */}
            <div className="space-y-6">
              
              {/* CARD 1: FEE PAYMENT MESSAGE ON SCREEN IMMEDIATELY AFTER TRANSFER */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      transferScreen.feePaymentMessageEnabled ? 'bg-amber-500 text-slate-950 font-black' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                        Fee Payment Message On Screen After Transfer
                      </h4>
                      <p className="text-xs text-slate-500">
                        Displays immediately after customer finishes transfer
                      </p>
                    </div>
                  </div>

                  {/* Master Toggle ON / OFF */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = !transferScreen.feePaymentMessageEnabled;
                      setTransferScreen({ ...transferScreen, feePaymentMessageEnabled: next });
                      toast.success(`Fee payment message on transfer screen is now ${next ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`);
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                      transferScreen.feePaymentMessageEnabled ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      transferScreen.feePaymentMessageEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {/* Master Switch Status Pill */}
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Fee Message Display Status:</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    transferScreen.feePaymentMessageEnabled 
                      ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {transferScreen.feePaymentMessageEnabled ? 'ACTIVE (ON)' : 'DISABLED (OFF)'}
                  </span>
                </div>

                {/* Mode Selector: Single Payment vs Multiple Sequential Payments */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Fee Payment Mode (Single vs Multiple One After Another)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTransferScreen({ ...transferScreen, feePaymentMode: 'single' })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        transferScreen.feePaymentMode === 'single'
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Single Payment</span>
                        {transferScreen.feePaymentMode === 'single' && (
                          <Check className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        One single clearance fee required before final credit
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTransferScreen({ ...transferScreen, feePaymentMode: 'multiple' })}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        transferScreen.feePaymentMode === 'multiple'
                          ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">Multiple Payments</span>
                        {transferScreen.feePaymentMode === 'multiple' && (
                          <Check className="h-4 w-4 text-amber-600" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Multiple fees written sequentially one after another
                      </p>
                    </button>
                  </div>
                </div>

                {/* MODE 1: SINGLE PAYMENT FORM */}
                {transferScreen.feePaymentMode === 'single' && (
                  <div className="p-5 bg-amber-50/40 border border-amber-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                      <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                        Single Fee Message Details
                      </span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Shown Immediately On Screen
                      </span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Fee Title</label>
                        <input
                          type="text"
                          value={transferScreen.singleFeeMessage?.title || ''}
                          onChange={(e) => setTransferScreen({
                            ...transferScreen,
                            singleFeeMessage: { ...transferScreen.singleFeeMessage, title: e.target.value }
                          })}
                          placeholder="e.g. Mandatory Interbank Transit Stamp Duty"
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700">Amount ($ USD)</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={transferScreen.singleFeeMessage?.amount || 0}
                          onChange={(e) => setTransferScreen({
                            ...transferScreen,
                            singleFeeMessage: { ...transferScreen.singleFeeMessage, amount: parseFloat(e.target.value) || 0 }
                          })}
                          className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-bold font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Urgency Notice / Badge</label>
                      <input
                        type="text"
                        value={transferScreen.singleFeeMessage?.urgencyText || ''}
                        onChange={(e) => setTransferScreen({
                          ...transferScreen,
                          singleFeeMessage: { ...transferScreen.singleFeeMessage, urgencyText: e.target.value }
                        })}
                        placeholder="Action Required: Remittance must be verified within 24 hours"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Description</label>
                      <textarea
                        rows={2}
                        value={transferScreen.singleFeeMessage?.description || ''}
                        onChange={(e) => setTransferScreen({
                          ...transferScreen,
                          singleFeeMessage: { ...transferScreen.singleFeeMessage, description: e.target.value }
                        })}
                        placeholder="Reason and regulatory compliance background"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700">Step-by-Step Payment Instructions</label>
                      <textarea
                        rows={2}
                        value={transferScreen.singleFeeMessage?.instructions || ''}
                        onChange={(e) => setTransferScreen({
                          ...transferScreen,
                          singleFeeMessage: { ...transferScreen.singleFeeMessage, instructions: e.target.value }
                        })}
                        placeholder="Instructions for paying to escrow or contacting treasury desk"
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid sm:grid-cols-3 gap-2 pt-1 text-xs">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Escrow Account</label>
                        <input
                          type="text"
                          value={transferScreen.singleFeeMessage?.accountNumber || ''}
                          onChange={(e) => setTransferScreen({
                            ...transferScreen,
                            singleFeeMessage: { ...transferScreen.singleFeeMessage, accountNumber: e.target.value }
                          })}
                          placeholder="ESC-8849-0192-EC"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Escrow Bank</label>
                        <input
                          type="text"
                          value={transferScreen.singleFeeMessage?.bankName || ''}
                          onChange={(e) => setTransferScreen({
                            ...transferScreen,
                            singleFeeMessage: { ...transferScreen.singleFeeMessage, bankName: e.target.value }
                          })}
                          placeholder="ECONEST Escrow Bank"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block">Routing Code</label>
                        <input
                          type="text"
                          value={transferScreen.singleFeeMessage?.routingCode || ''}
                          onChange={(e) => setTransferScreen({
                            ...transferScreen,
                            singleFeeMessage: { ...transferScreen.singleFeeMessage, routingCode: e.target.value }
                          })}
                          placeholder="ECNTUS33CLR"
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 2: MULTIPLE PAYMENTS WRITTEN ONE AFTER ANOTHER */}
                {transferScreen.feePaymentMode === 'multiple' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                          Sequential Fee Stages (Written One After Another)
                        </span>
                        <p className="text-[11px] text-slate-500">
                          Total {transferScreen.multipleFeeStages?.length || 0} stages • Sum: ${(transferScreen.multipleFeeStages || []).reduce((sum, s) => sum + (Number(s.amount) || 0), 0).toFixed(2)} USD
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsAddingStage(true)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1 shadow-sm"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Add Another Payment</span>
                      </button>
                    </div>

                    {/* Inline Add Stage Form */}
                    {isAddingStage && (
                      <form onSubmit={handleAddFeeStage} className="p-4 bg-amber-50/70 border border-amber-300 rounded-2xl space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                          <span className="text-xs font-bold text-amber-900 uppercase">
                            Add Step {(transferScreen.multipleFeeStages || []).length + 1} Payment Stage
                          </span>
                          <button type="button" onClick={() => setIsAddingStage(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Stage Title *</label>
                            <input
                              type="text"
                              required
                              value={newStage.title}
                              onChange={(e) => setNewStage({ ...newStage, title: e.target.value })}
                              placeholder="e.g. IMF Transit Stamp Duty"
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Amount ($ USD) *</label>
                            <input
                              type="number"
                              required
                              min="0"
                              step="1"
                              value={newStage.amount}
                              onChange={(e) => setNewStage({ ...newStage, amount: parseFloat(e.target.value) || 0 })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Description</label>
                          <textarea
                            rows={2}
                            value={newStage.description}
                            onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                            placeholder="Explanation of why this sequential fee is required"
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Instructions</label>
                          <input
                            type="text"
                            value={newStage.instructions}
                            onChange={(e) => setNewStage({ ...newStage, instructions: e.target.value })}
                            placeholder="How customer should settle this specific stage"
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsAddingStage(false)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs"
                          >
                            Save Stage
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Inline Edit Stage Form */}
                    {editingStage && (
                      <form onSubmit={handleSaveEditedStage} className="p-4 bg-sky-50/70 border border-sky-300 rounded-2xl space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between pb-2 border-b border-sky-200">
                          <span className="text-xs font-bold text-sky-900 uppercase">
                            Edit Step {editingStage.stageNumber}: {editingStage.title}
                          </span>
                          <button type="button" onClick={() => setEditingStage(null)} className="text-slate-400 hover:text-slate-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Stage Title</label>
                            <input
                              type="text"
                              value={editingStage.title}
                              onChange={(e) => setEditingStage({ ...editingStage, title: e.target.value })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-700">Amount ($ USD)</label>
                            <input
                              type="number"
                              value={editingStage.amount}
                              onChange={(e) => setEditingStage({ ...editingStage, amount: parseFloat(e.target.value) || 0 })}
                              className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs font-bold font-mono"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Description</label>
                          <textarea
                            rows={2}
                            value={editingStage.description}
                            onChange={(e) => setEditingStage({ ...editingStage, description: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-700">Instructions</label>
                          <input
                            type="text"
                            value={editingStage.instructions}
                            onChange={(e) => setEditingStage({ ...editingStage, instructions: e.target.value })}
                            className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingStage(null)}
                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-xs"
                          >
                            Update Stage
                          </button>
                        </div>
                      </form>
                    )}

                    {/* List of Multiple Fee Stages (Written One After Another) */}
                    <div className="space-y-3">
                      {(transferScreen.multipleFeeStages || []).map((stage, idx) => (
                        <div
                          key={stage.id || idx}
                          className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/70 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <span className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                              {stage.stageNumber || idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">
                                  {stage.title}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                                  Step {stage.stageNumber || idx + 1}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{stage.description}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 pl-10 sm:pl-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                            <span className="text-sm font-black text-slate-900 font-mono">
                              ${Number(stage.amount).toFixed(2)} USD
                            </span>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => handleMoveStage(idx, 'up')}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                title="Move Earlier in Sequence"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (transferScreen.multipleFeeStages?.length || 0) - 1}
                                onClick={() => handleMoveStage(idx, 'down')}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                title="Move Later in Sequence"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingStage(stage)}
                                className="p-1 text-slate-400 hover:text-sky-600 rounded-lg"
                                title="Edit Stage"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteFeeStage(stage.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                                title="Remove Stage"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* CARD 2: RECEIVER EMAIL SETUP & CUSTOMIZED MESSAGE */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                
                {/* MASTER TOGGLE: RECEIVER EMAIL ON TRANSFER SCREEN (TURN ON / OFF) */}
                <div className="p-4 sm:p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                          Transfer Screen Field Setting
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          transferScreen.showReceiverEmailInTransfer
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {transferScreen.showReceiverEmailInTransfer ? 'TURNED ON (VISIBLE IN TRANSFER)' : 'TURNED OFF (NOT NEEDED / HIDDEN)'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-white text-base">
                        Receiver Email on Customer Transfer Screen
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                        {transferScreen.showReceiverEmailInTransfer 
                          ? 'Field is currently ON: Customers will see and provide the receiver email address during transfer.'
                          : 'Field is currently OFF: Receiver email is NOT needed and will NOT appear during the transfer form.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const next = !transferScreen.showReceiverEmailInTransfer;
                        setTransferScreen({
                          ...transferScreen,
                          showReceiverEmailInTransfer: next
                        });
                        toast.success(`Receiver email field is now ${next ? 'TURNED ON (Visible in transfer)' : 'TURNED OFF (Not needed & hidden)'}`);
                      }}
                      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-colors cursor-pointer self-start sm:self-center ${
                        transferScreen.showReceiverEmailInTransfer ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md ${
                        transferScreen.showReceiverEmailInTransfer ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      transferScreen.receiverCustomEmailConfig?.autoSendEnabled !== false ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base sm:text-lg">
                        Receiver Email Custom Message Setup
                      </h4>
                      <p className="text-xs text-slate-500">
                        Notification dispatched to receiver when receiver email is provided
                      </p>
                    </div>
                  </div>

                  {/* Auto Send ON / OFF Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      const current = transferScreen.receiverCustomEmailConfig?.autoSendEnabled !== false;
                      const next = !current;
                      setTransferScreen({
                        ...transferScreen,
                        receiverCustomEmailConfig: {
                          ...transferScreen.receiverCustomEmailConfig,
                          autoSendEnabled: next
                        }
                      });
                      toast.success(`Auto-sending customized message to receiver is now ${next ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`);
                    }}
                    className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                      transferScreen.receiverCustomEmailConfig?.autoSendEnabled !== false ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      transferScreen.receiverCustomEmailConfig?.autoSendEnabled !== false ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>Auto-Dispatch to Receiver Email:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono ${
                      transferScreen.receiverCustomEmailConfig?.autoSendEnabled !== false
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {transferScreen.receiverCustomEmailConfig?.autoSendEnabled !== false ? 'AUTO ON' : 'MANUAL ONLY'}
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    When ON, if receiver email is captured, they automatically receive this customized message upon completion. You can also manually send anytime from the Transactions ledger.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Receiver Email Subject Line
                    </label>
                    <input
                      type="text"
                      value={transferScreen.receiverCustomEmailConfig?.subject || ''}
                      onChange={(e) => setTransferScreen({
                        ...transferScreen,
                        receiverCustomEmailConfig: {
                          ...transferScreen.receiverCustomEmailConfig,
                          subject: e.target.value
                        }
                      })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-indigo-500"
                      placeholder="[ECONEST BANK] Inward Transfer Notice for {receiver_name}"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Receiver Email Headline
                    </label>
                    <input
                      type="text"
                      value={transferScreen.receiverCustomEmailConfig?.headline || ''}
                      onChange={(e) => setTransferScreen({
                        ...transferScreen,
                        receiverCustomEmailConfig: {
                          ...transferScreen.receiverCustomEmailConfig,
                          headline: e.target.value
                        }
                      })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                      placeholder="Official Inward Capital Credit Advice"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Customized Message Body
                      </label>
                      <span className="text-[10px] text-slate-400 font-mono">Supports dynamic variables</span>
                    </div>

                    {/* Quick Variable Insert Pills */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {[
                        { label: '{receiver_name}', tag: '{receiver_name}' },
                        { label: '{receiver_email}', tag: '{receiver_email}' },
                        { label: '{sender_name}', tag: '{sender_name}' },
                        { label: '{amount}', tag: '{amount}' },
                        { label: '{currency}', tag: '{currency}' },
                        { label: '{reference_id}', tag: '{reference_id}' },
                        { label: '{bank_name}', tag: '{bank_name}' },
                        { label: '{fee_amount}', tag: '{fee_amount}' },
                        { label: '{fee_breakdown}', tag: '{fee_breakdown}' }
                      ].map(pill => (
                        <button
                          key={pill.tag}
                          type="button"
                          onClick={() => {
                            const cur = transferScreen.receiverCustomEmailConfig?.customMessage || '';
                            setTransferScreen({
                              ...transferScreen,
                              receiverCustomEmailConfig: {
                                ...transferScreen.receiverCustomEmailConfig,
                                customMessage: cur + ' ' + pill.tag
                              }
                            });
                          }}
                          className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] rounded-lg transition-colors border border-slate-200"
                        >
                          + {pill.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={5}
                      value={transferScreen.receiverCustomEmailConfig?.customMessage || ''}
                      onChange={(e) => setTransferScreen({
                        ...transferScreen,
                        receiverCustomEmailConfig: {
                          ...transferScreen.receiverCustomEmailConfig,
                          customMessage: e.target.value
                        }
                      })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                      placeholder="Dear {receiver_name}, an electronic transfer of {amount} {currency} has been initiated..."
                    />
                  </div>

                  {/* Test Dispatch to Receiver Email */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Send Test Message to Receiver Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={testReceiverEmail}
                        onChange={(e) => setTestReceiverEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleTestReceiverEmail}
                        disabled={isSendingTestReceiverEmail}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm shrink-0"
                      >
                        {isSendingTestReceiverEmail ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Send className="h-3.5 w-3.5" />
                        )}
                        <span>Send Test</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: BASIC RECEIPT LABELS & SCREEN ELEMENTS */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
                <div className="pb-3 border-b border-slate-100">
                  <h4 className="font-extrabold text-slate-900 text-base">Receipt Header & Visibility Elements</h4>
                  <p className="text-xs text-slate-500">General text and printable advice options</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Success Screen Title</label>
                    <input
                      type="text"
                      value={transferScreen.successTitle}
                      onChange={(e) => setTransferScreen({ ...transferScreen, successTitle: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Success Subtitle</label>
                    <textarea
                      rows={2}
                      value={transferScreen.successSubtitle}
                      onChange={(e) => setTransferScreen({ ...transferScreen, successSubtitle: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Custom Alert Banner Note</label>
                    <textarea
                      rows={2}
                      value={transferScreen.noticeBannerText}
                      onChange={(e) => setTransferScreen({ ...transferScreen, noticeBannerText: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transferScreen.showReferenceId}
                        onChange={(e) => setTransferScreen({ ...transferScreen, showReferenceId: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Reference ID</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={transferScreen.showFeeBreakdown}
                        onChange={(e) => setTransferScreen({ ...transferScreen, showFeeBreakdown: e.target.checked })}
                        className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                      />
                      <span>Fee Breakdown</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Prominent Bottom Update Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Saving All Settings...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>SAVE & UPDATE TRANSFER SCREEN MESSAGES NOW</span>
                    </>
                  )}
                </button>
              </div>

            </div>

            {/* Live Customer Screen Preview Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-emerald-600" />
                  Live Preview: What Customer Sees Immediately After Transfer
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Realtime Display
                </span>
              </div>

              <div className="bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-800 space-y-6 text-white">
                {/* Header preview */}
                <div className="text-center space-y-2 border-b border-slate-800 pb-5">
                  <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                    <Check className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-black text-white">
                    {transferScreen.successTitle || 'Transfer Authenticated & Dispatched'}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    {transferScreen.successSubtitle}
                  </p>
                </div>

                {/* Banner preview */}
                {transferScreen.noticeBannerText && (
                  <div className="p-3.5 rounded-2xl text-xs font-semibold leading-relaxed bg-emerald-950/60 text-emerald-200 border border-emerald-800/60 flex items-start gap-2.5">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                    <span>{transferScreen.noticeBannerText}</span>
                  </div>
                )}

                {/* FEE PAYMENT MESSAGE PREVIEW */}
                {transferScreen.feePaymentMessageEnabled ? (
                  <div className="bg-slate-950 rounded-2xl p-4 sm:p-5 border-2 border-amber-500/40 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                          Fee Payment Directive
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300">
                        {transferScreen.feePaymentMode === 'multiple' ? 'Sequential Stages' : 'Single Payment'}
                      </span>
                    </div>

                    {transferScreen.feePaymentMode === 'single' ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm">
                            {transferScreen.singleFeeMessage?.title || 'Mandatory Settlement Fee'}
                          </span>
                          <span className="text-base font-black text-amber-400 font-mono">
                            ${Number(transferScreen.singleFeeMessage?.amount || 0).toFixed(2)} USD
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          {transferScreen.singleFeeMessage?.description}
                        </p>
                        {transferScreen.singleFeeMessage?.instructions && (
                          <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                            <span className="text-amber-400 font-bold block mb-0.5">Instructions:</span>
                            {transferScreen.singleFeeMessage.instructions}
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                          <span>Escrow: {transferScreen.singleFeeMessage?.accountNumber || 'ESC-8849-0192-EC'}</span>
                          <span>Bank: {transferScreen.singleFeeMessage?.bankName || 'ECONEST Escrow'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(() => {
                          const stages = transferScreen.multipleFeeStages || [];
                          const activeStage = stages[0];
                          if (!activeStage) return null;

                          return (
                            <div className="p-3 bg-slate-900/90 rounded-xl border border-amber-500/40 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                                    {activeStage.stageNumber || 1}
                                  </span>
                                  <div>
                                    <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block">
                                      Active Step 1 of {stages.length} (Customer View)
                                    </span>
                                    <span className="text-xs font-bold text-white">{activeStage.title}</span>
                                  </div>
                                </div>
                                <span className="text-xs font-black text-amber-400 font-mono">
                                  ${Number(activeStage.amount).toFixed(2)} USD
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 pl-7">{activeStage.description}</p>
                              <div className="text-[10px] text-amber-300/80 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                                <Lock className="h-3 w-3 text-amber-400 shrink-0" />
                                <span>Single fee at a time: Step 2 & subsequent steps are hidden from customer until Step 1 is cleared.</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    Fee Payment Message is currently switched OFF (Customers will only see the standard receipt).
                  </div>
                )}

                {/* Simulated Receipt Preview */}
                <div className="bg-white text-slate-900 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Transfer Advice</span>
                    <span className="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      DELIVERED
                    </span>
                  </div>

                  <div className="text-center py-2">
                    <span className="text-2xl font-black text-slate-900 font-mono">$10,000.00 USD</span>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">Principal Ledger Value</p>
                  </div>

                  <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Originator (Sender):</span>
                      <span className="font-semibold text-slate-800">{user?.fullName || 'Customer'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Receiver / Beneficiary:</span>
                      <span className="font-semibold text-slate-800">Valued Recipient</span>
                    </div>
                    {transferScreen.showReceiverEmailInTransfer ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Receiver Email:</span>
                        <span className="font-semibold text-indigo-600">receiver@example.com</span>
                      </div>
                    ) : (
                      <div className="flex justify-between text-slate-400 text-[11px] italic">
                        <span>Receiver Email:</span>
                        <span>Turned OFF (Not needed)</span>
                      </div>
                    )}
                    {transferScreen.showReferenceId && (
                      <div className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-500">Reference ID:</span>
                        <span className="text-slate-700">TXN-882910-CLR</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* TAB 4: SENDGRID & EMAIL DISPATCH GATEWAY */}
      {/* ============================================================== */}
      {activeTab === 'smtp' && (
        <div className="space-y-8 animate-in fade-in">
          {/* Card 1: SendGrid & Enterprise Mail Gateway Setup */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-900">SendGrid Email Delivery Gateway</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      SendGrid Exclusive
                    </span>
                    {smtpConfig.sendgridApiKey ? (
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        API Key Configured
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        API Key Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Official enterprise email service powered by <strong>SendGrid</strong>. All customer transfer advices, admin transfer alerts, and direct customer messages are delivered directly to real Gmail and registered inboxes.
                  </p>
                </div>
              </div>

              {/* Master Relay Toggle */}
              <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 self-start sm:self-center shrink-0">
                <span className="text-xs font-bold text-slate-700 px-2">
                  Mail Gateway: {smtpConfig.enabled ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}
                </span>
                <button
                  type="button"
                  onClick={() => setSmtpConfig({ ...smtpConfig, enabled: !smtpConfig.enabled })}
                  className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                    smtpConfig.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    smtpConfig.enabled ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </button>
              </div>
            </div>

            {/* SENDGRID EXCLUSIVE VIEW */}
            <div className="space-y-6">
              {/* SendGrid Information Banner */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-emerald-950">
                    SendGrid Exclusive Email Engine Active
                  </p>
                  <p className="text-emerald-800 leading-relaxed">
                    SendGrid is the sole authorized email provider. All customer debit advices, administrative alerts, and direct receiver correspondence are processed through SendGrid's cloud API with real inbox delivery and two-way reply tracking.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* SendGrid API Key */}
                <div className="md:col-span-2 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Key className="h-4 w-4 text-emerald-600" />
                      SendGrid API Key (starts with "SG.")
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSendgridKey(!showSendgridKey)}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {showSendgridKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      <span>{showSendgridKey ? 'Hide Key' : 'Show Key'}</span>
                    </button>
                  </div>
                  <input
                    type={showSendgridKey ? 'text' : 'password'}
                    value={smtpConfig.sendgridApiKey || ''}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, sendgridApiKey: e.target.value })}
                    placeholder="SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full p-3.5 bg-white border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
                  />
                  <p className="text-[11px] text-slate-500">
                    Enter your SendGrid API key with <strong>"Mail Send"</strong> or <strong>"Full Access"</strong> permissions from app.sendgrid.com &gt; Settings &gt; API Keys.
                  </p>
                </div>

                {/* SendGrid Verified Sender Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    SendGrid Verified Sender "From" Email
                  </label>
                  <input
                    type="email"
                    value={smtpConfig.sendgridSenderEmail || smtpConfig.fromEmail || ''}
                    onChange={(e) => setSmtpConfig({
                      ...smtpConfig,
                      sendgridSenderEmail: e.target.value,
                      fromEmail: e.target.value
                    })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. notifications@econestbank.com"
                  />
                  <p className="text-[10px] text-slate-400">
                    Must match a Single Sender Verification or Verified Domain in SendGrid.
                  </p>
                </div>

                {/* SendGrid Sender Display Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={smtpConfig.sendgridSenderName || smtpConfig.fromName || 'ECONEST BANK Alert'}
                    onChange={(e) => setSmtpConfig({
                      ...smtpConfig,
                      sendgridSenderName: e.target.value,
                      fromName: e.target.value
                    })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="e.g. ECONEST BANK Official Desk"
                  />
                  <p className="text-[10px] text-slate-400">
                    The name displayed to recipients next to the from address.
                  </p>
                </div>

                {/* Admin Notification Destination Mailbox */}
                <div className="md:col-span-2 bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Bell className="h-4 w-4 text-indigo-600" />
                      Admin Notification Destination Mailbox
                    </label>
                    <span className="text-[10px] bg-indigo-200/70 text-indigo-900 font-bold px-2 py-0.5 rounded">
                      Admin Inbox
                    </span>
                  </div>
                  <input
                    type="email"
                    value={smtpConfig.adminAlertEmail}
                    onChange={(e) => {
                      setSmtpConfig({ ...smtpConfig, adminAlertEmail: e.target.value });
                      setTestEmailAddress(e.target.value);
                    }}
                    className="w-full p-3.5 bg-white border border-indigo-200 rounded-xl text-sm font-bold text-indigo-950 focus:outline-none focus:border-indigo-600 shadow-xs"
                    placeholder="e.g. bubucyril2@gmail.com"
                    required
                  />
                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    ✓ When a customer submits a transfer, an automated alert is delivered here via SendGrid with sender details, transfer amount, reference ID, and the receiver email used.
                    <br />
                    ✓ You can then send messages directly to the receiver via the Admin Transactions desk, and see their replies in real time.
                  </p>
                </div>

                {/* SendGrid Save & Activate Button Card */}
                <div className="col-span-full mt-2 p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl border-2 border-emerald-300 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                        SAVE & ACTIVATE SENDGRID CONFIGURATION
                      </h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-600 text-white uppercase shadow-xs">
                        SENDGRID ONLY
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Save your SendGrid API credentials and verified sender parameters.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateSendGridOnly(false)}
                      disabled={isUpdatingSmtp}
                      className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-600/30 flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      {isUpdatingSmtp ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 text-emerald-100" />
                          <span>SAVE SENDGRID SETTINGS</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateSendGridOnly(true)}
                      disabled={isUpdatingSmtp || isVerifyingSendgrid}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
                      title="Save and test API Key authentication"
                    >
                      {isVerifyingSendgrid ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 text-emerald-400" />
                          <span>SAVE & TEST API KEY</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* SendGrid Real Verification Results Box */}
              {sendgridVerifyResult && (
                <div className={`p-4 rounded-xl text-xs ${
                  sendgridVerifyResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {sendgridVerifyResult.success ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                    {sendgridVerifyResult.success ? '✓ SendGrid API Authentication Successful' : '✗ SendGrid API Key Verification Error'}
                  </p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed">
                    {sendgridVerifyResult.message || sendgridVerifyResult.error}
                  </p>
                </div>
              )}
            </div>

            {/* Test Email Dispatch Action (Works for SendGrid and SMTP) */}
            <div className="pt-6 border-t border-slate-100 bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Send className="h-4 w-4 text-emerald-600" />
                    Live Delivery Test (Direct to Real Inbox)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Dispatch an instant test email via SendGrid API to confirm inbox delivery.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      value={testEmailAddress}
                      onChange={(e) => setTestEmailAddress(e.target.value)}
                      placeholder="Enter destination email (e.g. Gmail)"
                      className="p-2.5 bg-white border border-slate-300 rounded-xl text-xs w-56 sm:w-64 focus:outline-none focus:border-emerald-500 shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleTestSmtp}
                      disabled={isTestingSmtp}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                      {isTestingSmtp ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Dispatching...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Dispatch Test Email</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Test Send Result Box */}
              {smtpTestResult && (
                <div className={`p-4 rounded-xl text-xs ${
                  smtpTestResult.success
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}>
                  <p className="font-bold flex items-center gap-1.5">
                    {smtpTestResult.success ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
                    {smtpTestResult.success ? '✓ Real Email Dispatched Successfully' : '✗ Email Dispatch Failed'}
                  </p>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed">
                    {smtpTestResult.message || smtpTestResult.error || JSON.stringify(smtpTestResult)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Authorized Workflow - Admin Transfer Notifications & Direct Receiver Messaging */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">Transfer Alerts & Direct Receiver Messaging</h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Authorized Flow
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    When a customer submits a transfer, an automated transfer alert is routed to your admin mailbox with the receiver email used. You can then write direct messages to that receiver email to deliver official notes to their real Gmail address.
                  </p>
                </div>
              </div>

              <Link
                to="/admin/transactions"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 self-start sm:self-center shrink-0 cursor-pointer"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Go to Transfers to Message Receivers</span>
              </Link>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">1</span>
                  <h4 className="text-sm font-bold text-slate-900">Customer Transfer Alert to Admin</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every customer transfer sends a real-time notification to <strong>{smtpConfig.adminAlertEmail || 'bubucyril2@gmail.com'}</strong> containing the transfer amount, customer details, and the receiver's email address.
                </p>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">2</span>
                  <h4 className="text-sm font-bold text-slate-900">Direct Message to Receiver's Real Gmail</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  From the Admin Transactions ledger, click <strong>"Message Receiver"</strong> next to any transfer to compose and dispatch official messages straight to the receiver's real Gmail inbox via SendGrid.
                </p>
              </div>
            </div>
          </div>




          {/* Card 5: Recent Email Dispatch Audit Logs & Outbox */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Inbox className="h-5 w-5 text-indigo-600" />
                  Live Outbox & Delivery Audit Trail
                </h4>
                <p className="text-xs text-slate-500">Live feed of all emails dispatched to customer inboxes, admin alerts, and direct messages</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchLogs}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Refresh logs"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                </button>
                {emailLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      await emailService.clearEmailLogs();
                      setEmailLogs([]);
                      toast.success('Logs cleared');
                    }}
                    className="text-xs text-rose-600 hover:underline px-2 font-bold"
                  >
                    Clear Logs
                  </button>
                )}
              </div>
            </div>

            {emailLogs.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
                No email records yet. Perform a transfer, send a custom message, or run a test to generate live records.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden max-h-96 overflow-y-auto">
                {emailLogs.map((log) => (
                  <div key={log.id} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.type === 'transfer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'custom'
                            ? 'bg-sky-100 text-sky-800'
                            : log.type === 'chat_customer' || log.type === 'chat_admin'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {log.type.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-slate-800">{log.subject}</span>
                      </div>
                      <p className="text-slate-500 truncate max-w-xl">{log.bodyPreview}</p>
                      <p className="text-[10px] text-slate-400">
                        Receiver: <strong className="text-slate-700">{log.to}</strong> {log.replyTo ? `| Reply-To: ${log.replyTo}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 sm:self-center shrink-0">
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          log.status === 'sent'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : log.status === 'simulated'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {log.status === 'sent' ? '✓ Delivered (SendGrid API)' : log.status}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewLog(log)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs"
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email Preview Modal Dialog */}
          {previewLog && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-4 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-900 text-base">Dispatched Email Audit Record</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewLog(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-2 font-mono">
                  <div><strong className="text-slate-500">Subject:</strong> <span className="font-bold text-slate-900">{previewLog.subject}</span></div>
                  <div><strong className="text-slate-500">Receiver:</strong> <span className="text-indigo-600 font-bold">{previewLog.to}</span></div>
                  <div><strong className="text-slate-500">From:</strong> {previewLog.from}</div>
                  <div><strong className="text-slate-500">Status:</strong> <span className="font-bold uppercase text-emerald-600">{previewLog.status}</span></div>
                  <div><strong className="text-slate-500">Timestamp:</strong> {new Date(previewLog.timestamp).toLocaleString()}</div>
                  {previewLog.metadata?.messageId && (
                    <div><strong className="text-slate-500">Message-ID:</strong> {previewLog.metadata.messageId}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Message Content:</span>
                  <div className="p-4 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-sans">
                    {previewLog.bodyPreview}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setPreviewLog(null)}
                    className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSettings;
