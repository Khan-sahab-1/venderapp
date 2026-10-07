import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  VendorUser,
  SalesOrder,
  SalesOrderDetail,
  DashboardStats,
  DispatchPayload,
  CreateBillPayload,
  CreateBillResponse,
  InventoryProduct,
  UomCategoryItem,
  UomItem,
  ProductCategoryItem,
  InventorySummary,
  CreateProductPayload,
  StockInwardPayload,
} from '../types';

// Live Swagger API Gateway URL provided by user
export const DEFAULT_API_URL = 'http://192.168.1.6:4000/api';

const STORAGE_KEYS = {
  TOKEN: '@vendor_auth_token',
  BASE_URL: '@vendor_api_base_url',
  USER: '@vendor_user_profile',
};

class ApiService {
  private client: AxiosInstance = axios.create({
    baseURL: DEFAULT_API_URL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  private authToken: string | null = null;

  async init(): Promise<{ token: string | null; baseUrl: string; user: VendorUser | null }> {
    try {
      const [storedBaseUrl, storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BASE_URL),
        AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER),
      ]);

      const activeUrl = storedBaseUrl || DEFAULT_API_URL;
      this.setBaseUrl(activeUrl);

      if (storedToken) {
        this.setToken(storedToken);
      }

      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      return {
        token: storedToken,
        baseUrl: activeUrl,
        user: parsedUser,
      };
    } catch {
      return {
        token: null,
        baseUrl: DEFAULT_API_URL,
        user: null,
      };
    }
  }

  setBaseUrl(url: string) {
    const cleanUrl = url.trim().replace(/\/+$/, '');
    this.client.defaults.baseURL = cleanUrl;
    AsyncStorage.setItem(STORAGE_KEYS.BASE_URL, cleanUrl).catch(() => {});
  }

  getBaseUrl(): string {
    return this.client.defaults.baseURL || DEFAULT_API_URL;
  }

  setToken(token: string | null) {
    this.authToken = token;
    if (token) {
      this.client.defaults.headers.common.Authorization = `Bearer ${token}`;
      AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token).catch(() => {});
    } else {
      delete this.client.defaults.headers.common.Authorization;
      AsyncStorage.removeItem(STORAGE_KEYS.TOKEN).catch(() => {});
    }
  }

  getToken(): string | null {
    return this.authToken;
  }

  /**
   * Vendor Login - POST /api/auth/login
   */
  async login(loginText: string, passwordText: string): Promise<{ token: string; vendor: VendorUser }> {
    try {
      const response = await this.client.post('/auth/login', {
        login: loginText,
        password: passwordText,
      });

      const { token, vendor } = response.data;
      if (!token) {
        throw new Error('No authentication token returned by server');
      }

      this.setToken(token);
      if (vendor) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(vendor));
      }

      return { token, vendor };
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Authentication failed';
      throw new Error(serverMsg);
    }
  }

  /**
   * Get Logged-in Vendor Profile - GET /api/auth/profile
   */
  async getProfile(): Promise<VendorUser> {
    try {
      const response = await this.client.get('/auth/profile');
      const profile = response.data;
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      return profile;
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        'Could not fetch profile';
      throw new Error(serverMsg);
    }
  }

  /**
   * Fetch Dashboard KPIs & Analytics - GET /api/orders/dashboard/stats
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await this.client.get('/orders/dashboard/stats');
      return response.data;
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch dashboard statistics';
      throw new Error(serverMsg);
    }
  }

  /**
   * Fetch Sales Orders List - GET /api/orders
   * @param statusFilter 'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
   * @param search Search keyword for SO/PO
   */
  async getOrders(statusFilter = 'ALL', search = ''): Promise<SalesOrder[]> {
    try {
      const params: Record<string, string> = {};
      if (statusFilter && statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (search && search.trim()) {
        params.search = search.trim();
      }

      const response = await this.client.get('/orders', { params });
      return response.data || [];
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to fetch sales orders list';
      throw new Error(serverMsg);
    }
  }

  /**
   * Fetch Single Sales Order Details with Lines - GET /api/orders/{id}
   */
  async getOrderById(orderId: number): Promise<SalesOrderDetail> {
    try {
      const response = await this.client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        `Could not fetch details for Order #${orderId}`;
      throw new Error(serverMsg);
    }
  }

  /**
   * Acknowledge Order Confirmation - POST /api/orders/{id}/acknowledge
   */
  async acknowledgeOrder(orderId: number): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.client.post(`/orders/${orderId}/acknowledge`);
      return response.data;
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to acknowledge order in Odoo';
      throw new Error(serverMsg);
    }
  }

  /**
   * Submit Dispatch and LR Tracking Details - POST /api/orders/{id}/dispatch
   */
  async submitDispatch(
    orderId: number,
    payload: DispatchPayload,
  ): Promise<{ success: boolean; message: string; status?: string }> {
    try {
      const response = await this.client.post(`/orders/${orderId}/dispatch`, payload);
      return response.data;
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to submit dispatch details';
      throw new Error(serverMsg);
    }
  }

  /**
   * Create / Submit Vendor Bill against confirmed PO - POST /api/orders/{id}/create-bill
   */
  async createBill(
    orderId: number,
    payload: CreateBillPayload,
  ): Promise<CreateBillResponse> {
    try {
      const response = await this.client.post(`/orders/${orderId}/create-bill`, payload);
      return response.data;
    } catch (error: any) {
      const serverMsg =
        error.response?.data?.message ||
        error.message ||
        'Failed to generate vendor bill in Odoo';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Get KPI Dashboard Summary
   */
  async getInventorySummary(): Promise<InventorySummary> {
    try {
      const response = await this.client.get('/inventory/summary');
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to fetch inventory summary';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Get Products with Live Stock
   */
  async getInventoryProducts(search?: string, categoryId?: number): Promise<InventoryProduct[]> {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (categoryId) params.categoryId = categoryId;
      const response = await this.client.get('/inventory/products', { params });
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to fetch products';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Create Product
   */
  async createInventoryProduct(payload: CreateProductPayload): Promise<InventoryProduct> {
    try {
      const response = await this.client.post('/inventory/products', payload);
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to create product';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Get UOM Categories
   */
  async getUomCategories(): Promise<UomCategoryItem[]> {
    try {
      const response = await this.client.get('/inventory/uom-categories');
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to fetch UOM categories';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Get UOMs
   */
  async getUoms(categoryId?: number): Promise<UomItem[]> {
    try {
      const params: any = {};
      if (categoryId) params.categoryId = categoryId;
      const response = await this.client.get('/inventory/uoms', { params });
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to fetch UOMs';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Get Product Categories
   */
  async getProductCategories(): Promise<ProductCategoryItem[]> {
    try {
      const response = await this.client.get('/inventory/categories');
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to fetch categories';
      throw new Error(serverMsg);
    }
  }

  /**
   * Standalone Inventory: Add Stock Inward (GRN)
   */
  async stockInward(payload: StockInwardPayload): Promise<any> {
    try {
      const response = await this.client.post('/inventory/stock/inward', payload);
      return response.data;
    } catch (error: any) {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to record stock inward';
      throw new Error(serverMsg);
    }
  }

  /**
   * Clear session
   */
  async logout(): Promise<void> {
    this.setToken(null);
    await AsyncStorage.removeItem(STORAGE_KEYS.USER).catch(() => {});
  }
}

export const apiService = new ApiService();
