export type OrderStatus = 'PENDING_APPROVAL' | 'CONFIRMED' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED';

export interface VendorUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  gstin?: string;
  address?: string;
}

export interface SalesOrderLine {
  id: number;
  productId: number;
  productName: string;
  description: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityBilled: number;
  uom: string;
  unitPrice: number;
  subtotal: number;
  priceTotal: number;
  expectedDate: string;
}

export interface SalesOrder {
  id: number;
  soNumber: string;
  poNumber: string;
  customerName: string;
  orderDate: string;
  expectedDate: string;
  amountUntaxed: number;
  amountTax: number;
  amountTotal: number;
  currency: string;
  status: OrderStatus;
  rawState: string;
  linesCount: number;
  notes: string;
  isBilled?: boolean;
  invoiceCount?: number;
}

export interface SalesOrderDetail extends SalesOrder {
  lines: SalesOrderLine[];
  companyAddress: string;
  deliveryAddress: string;
  isAcknowledged?: boolean;
}

export interface DispatchPayload {
  transporterName: string;
  lrNumber: string;
  vehicleNumber?: string;
  numberOfBoxes?: number;
  dispatchDate: string;
  estimatedDeliveryDate?: string;
  remarks?: string;
}

export interface CreateBillPayload {
  vendorBillNumber: string;
  billDate: string;
  dueDate?: string;
  remarks?: string;
}

export interface CreateBillResponse {
  success: boolean;
  billId?: number;
  invoiceId?: number;
  billNumber: string;
  orderId: number;
  amountTotal: number;
  status: string;
  message: string;
}

export interface DashboardStats {
  totalOrders: number;
  confirmedCount: number;
  completedCount: number;
  pendingCount: number;
  totalRevenue: number;
  pendingRevenue: number;
  recentOrders: SalesOrder[];
}
