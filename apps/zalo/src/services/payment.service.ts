import apiClient from './api';

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'VIETQR';

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  qrCode?: string;
  qrContent?: string;
  bankCode?: string;
  bankAccount?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdAt: string;
}

export interface CreatePaymentQRDto {
  bookingId: string;
  amount: number;
}

export interface QRCodeResponse {
  qrCode: string;
  qrContent: string;
  amount: number;
  bankCode: string;
  bankAccount: string;
  bankName: string;
  expiresAt: string;
}

// Generate QR code for payment
export const generatePaymentQR = async (bookingId: string): Promise<QRCodeResponse> => {
  const response = await apiClient.post<QRCodeResponse>(`/payments/create-qr`, {
    bookingId,
  });
  return response.data;
};

// Get payment status
export const getPaymentStatus = async (bookingId: string): Promise<Payment> => {
  const response = await apiClient.get<Payment>(`/payments/${bookingId}/status`);
  return response.data;
};

// Get payment by booking ID
export const getPaymentByBooking = async (bookingId: string): Promise<Payment> => {
  const response = await apiClient.get<Payment>(`/payments/booking/${bookingId}`);
  return response.data;
};

// Poll payment status (for real-time updates)
export const pollPaymentStatus = (
  bookingId: string,
  onStatusChange: (payment: Payment) => void,
  intervalMs: number = 3000
): (() => void) => {
  let isPolling = true;

  const poll = async () => {
    while (isPolling) {
      try {
        const payment = await getPaymentStatus(bookingId);
        onStatusChange(payment);

        if (payment.status === 'PAID' || payment.status === 'REFUNDED') {
          isPolling = false;
          break;
        }
      } catch (error) {
        console.error('Payment polling error:', error);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  };

  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
  };
};
