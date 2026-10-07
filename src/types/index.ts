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

// ================= STANDALONE VENDOR INVENTORY =================
export interface InventoryProduct {
  id: number;
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  categoryName: string;
  uomId: number;
  uomSymbol: string;
  hsnCode: string;
  taxRate: number;
  costPrice: number;
  salePrice: number;
  minStockAlert: number;
  stockOnHand: number;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface UomCategoryItem {
  id: number;
  name: string;
  description?: string;
}

export interface UomItem {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  symbol: string;
  ratio: number;
  isBaseUnit: boolean;
}

export interface ProductCategoryItem {
  id: number;
  name: string;
  code?: string;
  description?: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockUnits: number;
  inventoryValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalWarehouses: number;
  totalInvoicesCreated: number;
  lowStockProducts: InventoryProduct[];
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  description?: string;
  categoryId: number;
  uomId: number;
  hsnCode: string;
  taxRate: number;
  costPrice: number;
  salePrice: number;
  minStockAlert?: number;
  initialStock?: number;
}

export interface StockInwardPayload {
  productId: number;
  warehouseId?: number;
  qty: number;
  referenceNo?: string;
  partyName?: string;
  remarks?: string;
}

export interface StockOutwardPayload {
  productId: number;
  warehouseId?: number;
  qty: number;
  referenceNo?: string;
  partyName?: string;
  remarks?: string;
}

export interface CreateUomCategoryPayload {
  name: string;
  description?: string;
}

export interface CreateUomPayload {
  categoryId: number;
  name: string;
  symbol: string;
  ratio?: number;
  isBaseUnit?: boolean;
}

export interface CreateProductCategoryPayload {
  name: string;
  code?: string;
  description?: string;
}

export interface WarehouseItem {
  id: number;
  vendorId: number;
  name: string;
  code: string;
  address?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CreateWarehousePayload {
  name: string;
  code: string;
  address?: string;
  isDefault?: boolean;
}

export interface StockQuantItem {
  id: string;
  vendorId: number;
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  uomSymbol: string;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  updatedAt: string;
}

export interface StockMoveItem {
  id: number;
  vendorId: number;
  moveNumber: string;
  type: 'INWARD' | 'OUTWARD';
  productId: number;
  productName: string;
  sku: string;
  warehouseId: number;
  warehouseName: string;
  qty: number;
  uomSymbol: string;
  referenceNo?: string;
  partyName?: string;
  remarks?: string;
  createdAt: string;
}

