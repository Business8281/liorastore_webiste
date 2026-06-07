
import axios from 'axios';

const SHIPROCKET_API_URL = 'https://apiv2.shiprocket.in/v1/external';

class ShiprocketService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  async authenticate() {
    // Return cached token if still valid
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    try {
      const response = await axios.post(`${SHIPROCKET_API_URL}/auth/login`, {
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      });

      if (response.data && response.data.token) {
        this.token = response.data.token;
        // Shiprocket tokens are usually valid for 10 days, let's cache for 9 days
        this.tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
        return this.token;
      }
      throw new Error('Shiprocket authentication failed: No token received');
    } catch (error) {
      console.error('Shiprocket Auth Error:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Shiprocket');
    }
  }

  async createOrder(orderData) {
    if (!orderData) {
      throw new Error('Order data is undefined in shiprocket.createOrder');
    }

    const token = await this.authenticate();
    
    // Safety helpers
    const safeString = (val, fallback = '') => {
      if (val === undefined || val === null) return fallback;
      return val.toString();
    };

    const customer = orderData.customerDetails || {};
    
    // Transform LIORA order to Shiprocket format
    const payload = {
      order_id: safeString(orderData.orderNumber || orderData.id, `ORD-${Date.now()}`),
      order_date: new Date(orderData.createdAt || Date.now()).toISOString().split('T')[0],
      pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse',
      billing_customer_name: safeString(customer.fullName || 'Customer').split(' ')[0],
      billing_last_name: safeString(customer.fullName || '').split(' ').slice(1).join(' ') || 'Liora',
      billing_address: safeString(customer.address || 'Address Not Provided'),
      billing_city: safeString(customer.city || 'City'),
      billing_pincode: safeString(customer.postalCode || customer.zipCode || '000000').replace(/\D/g, '').slice(0, 6) || '000000',
      billing_state: safeString(customer.state || 'Telangana'),
      billing_country: 'India',
      billing_email: safeString(customer.email || 'admin@liorastore.in'),
      billing_phone: safeString(customer.phone || '0000000000').replace(/\D/g, '').slice(-10) || '0000000000',
      shipping_is_billing: true,
      order_items: (orderData.items || []).map(item => ({
        name: safeString(item?.title || 'Unknown Product'),
        sku: safeString(item?.handle || item?.id || `SKU-${Math.random().toString(36).substr(2, 7).toUpperCase()}`),
        units: parseInt(item?.quantity) || 1,
        selling_price: parseFloat(item?.price) || 0,
      })),
      payment_method: orderData.paymentMethod === 'cod' ? 'COD' : 'Prepaid',
      shipping_charges: 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: 0,
      sub_total: parseFloat(orderData.totalAmount) || 0,
      length: 10, 
      breadth: 10,
      height: 10,
      weight: 0.5,
    };

    try {
      const response = await axios.post(`${SHIPROCKET_API_URL}/orders/create/adhoc`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Shiprocket Order Creation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getTrackingDetails(shipmentId) {
    const token = await this.authenticate();
    try {
      const response = await axios.get(`${SHIPROCKET_API_URL}/courier/track/shipment/${shipmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
       console.error('Shiprocket Tracking Error:', error.response?.data || error.message);
       throw error;
    }
  }

  async cancelOrder(shiprocketOrderId) {
     const token = await this.authenticate();
     try {
       const response = await axios.post(`${SHIPROCKET_API_URL}/orders/cancel`, {
         ids: [shiprocketOrderId]
       }, {
         headers: { Authorization: `Bearer ${token}` }
       });
       return response.data;
     } catch (error) {
       console.error('Shiprocket Order Cancel Error:', error.response?.data || error.message);
       throw error;
     }
  }
}

const shiprocket = new ShiprocketService();
export default shiprocket;
