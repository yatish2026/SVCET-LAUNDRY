import { API_ENDPOINTS } from '../config/api';

export const apiService = {
  // 1. User Registration
  async register(userData) {
    try {
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
        // If legacy backend strictly requires ['1st Year', '2nd Year', '3rd Year', '4th Year']
        if (data.error && (data.error.includes('academic year') || data.error.includes('Academic year'))) {
          let legacyYear = '1st Year';
          const courseStr = (userData.academic_year || '').toLowerCase();
          if (courseStr.includes('2nd') || courseStr.includes('diploma 2')) legacyYear = '2nd Year';
          else if (courseStr.includes('3rd')) legacyYear = '3rd Year';
          else if (courseStr.includes('4th') || courseStr.includes('mba') || courseStr.includes('mca')) legacyYear = '4th Year';

          const retryRes = await fetch(API_ENDPOINTS.REGISTER, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ ...userData, academic_year: legacyYear }),
          });
          const retryData = await retryRes.json();
          if (retryRes.ok && !retryData.error) {
            return {
              ...retryData,
              user: {
                ...retryData.user,
                academic_year: userData.academic_year,
                course: userData.academic_year,
                location: userData.location,
                gender: userData.gender,
              },
            };
          }
        }
        throw new Error(data.error || 'Registration failed.');
      }

      return {
        ...data,
        user: {
          ...data.user,
          academic_year: userData.academic_year,
          course: userData.academic_year,
          location: userData.location,
          gender: userData.gender,
        },
      };
    } catch (err) {
      throw err;
    }
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
      body: JSON.stringify({
        booking_id: bookingId,
        new_status: newStatus,
        status: newStatus,
      }),
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
