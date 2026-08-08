export interface ValidatedReceipt {
  key: string;
  originalFileName: string;
  mimeType: string;
  detectedMimeType: string;
  fileExtension: string;
  fileSize: number;
  checksum: string;
  storageProvider: string;
}

export interface PaymentSubmission {
  transactionId: string;
  transactionIdNormalized: string;
  amount: string;
  currency: string;
  paymentDate: Date | null;
  studentNote: string | null;
}
