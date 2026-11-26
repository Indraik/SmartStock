export const ROLES = {
  ADMIN: 'ADMIN',
  STAFF: 'STAFF',
  CUSTOMER: 'CUSTOMER',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_FLOW = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
];

export const NEXT_ORDER_STATUS = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PROCESSING',
  PROCESSING: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export const ADJUSTMENT_TYPES = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  ADJUST: 'ADJUST',
};

export const STOCK_STATUS = {
  IN_STOCK: 'IN_STOCK',
  LOW_STOCK: 'LOW_STOCK',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
};

export const TOKEN_STORAGE_KEY = 'smartstock_token';
export const CART_STORAGE_KEY = 'smartstock_cart';

export function getHomePathForRole(role) {
  switch (role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.STAFF:
      return '/staff/products';
    case ROLES.CUSTOMER:
      return '/customer/dashboard';
    default:
      return '/login';
  }
}
