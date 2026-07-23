// ============================================================
// Shared TypeScript Interfaces
// ============================================================

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: 'Admin' | 'Sales' | 'Warehouse' | 'Accounts';
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Customer {
  id: number;
  customer_name: string;
  mobile_number: string;
  email: string | null;
  business_name: string | null;
  gst_number: string | null;
  customer_type: 'Retail' | 'Wholesale' | 'Distributor';
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  status: 'Lead' | 'Active' | 'Inactive';
  follow_up_date: string | null;
  notes: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  followups?: FollowUp[];
}

export interface FollowUp {
  id: number;
  customer_id: number;
  follow_up_date: string;
  notes: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface Product {
  id: number;
  product_name: string;
  sku: string;
  category: string;
  unit_price: number;
  current_stock: number;
  min_stock_alert: number;
  location_warehouse: string;
  description: string | null;
  is_active: boolean;
  is_low_stock?: boolean;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  product_name?: string;
  sku?: string;
  quantity_changed: number;
  movement_type: 'IN' | 'OUT';
  reason: string;
  reference_type: string | null;
  reference_id: number | null;
  stock_before: number;
  stock_after: number;
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface ChallanItem {
  id?: number;
  challan_id?: number;
  product_id: number;
  product_name_snapshot: string;
  sku_snapshot: string;
  unit_price_snapshot: number;
  category_snapshot: string;
  quantity: number;
  line_total: number;
  available_stock?: number;
}

export interface Challan {
  id: number;
  challan_number: string;
  customer_id: number;
  customer_name?: string;
  business_name?: string;
  customer_mobile?: string;
  customer_email?: string;
  customer_gst?: string;
  total_quantity: number;
  total_amount: number;
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  created_by: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  items?: ChallanItem[];
}

export interface DashboardStats {
  customers: number;
  products: number;
  lowStockProducts: number;
  totalChallans: number;
  draftChallans: number;
  confirmedChallans: number;
  recentChallans: Challan[];
  upcomingFollowups: any[];
}

export interface ApiResponseType<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  errors?: any;
}

export interface PaginatedResponse<T> extends ApiResponseType<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
