import { API_ENDPOINTS } from '../config/api';

export const apiService = {
  // 1. User Registration
  async register(userData) {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Registration failed.');
    }
    return data;
  },

  // 2. User Login
  async login(email, password) {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Invalid email or password.');
    }
    return data;
  },

  // 3. Fetch All Bookings
  async getBookings() {
    const response = await fetch(API_ENDPOINTS.GET_BOOKINGS, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to fetch bookings.');
    }
    return data.bookings || [];
  },

  // 4. Create New Booking
  async createBooking(bookingData) {
    try {
      const response = await fetch(API_ENDPOINTS.CREATE_BOOKING, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error('Server returned non-JSON:', text);
        throw new Error(`Server response error: ${text.slice(0, 100)}`);
      }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create booking.');
      }
      return data.booking;
    } catch (err) {
      console.log('Error creating booking on GoDaddy API:', err);
      throw err;
    }
  },

  // 5. Update Order Status
  async updateStatus(bookingId, newStatus) {
    const response = await fetch(API_ENDPOINTS.UPDATE_STATUS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ booking_id: bookingId, status: newStatus }),
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error(data.error || 'Failed to update order status.');
    }
    return data;
  },

  // 6. Fetch Notifications
  async getNotifications() {
    try {
      const response = await fetch(API_ENDPOINTS.GET_NOTIFICATIONS, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      return data.notifications || [];
    } catch (e) {
      return [];
    }
  },
};

export default apiService;
