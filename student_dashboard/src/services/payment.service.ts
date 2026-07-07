import api from "./api";
import type { ApiResponse } from "@/types";

export interface PaymentOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  tierName: string;
  keyId: string;
}

export const paymentService = {
  createOrder: (tierId: string) =>
    api.post<ApiResponse<PaymentOrderResult>>("/payments/create-order", { tierId }),

  verifyPayment: (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    tierId: string;
  }) => api.post<ApiResponse<any>>("/payments/verify-payment", data),

  getSubscriptionTiers: () =>
    api.get<ApiResponse<any[]>>("/subscription-tiers"),
};
export default paymentService;
