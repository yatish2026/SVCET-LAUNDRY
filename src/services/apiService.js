import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  // 7. Support & Complaints: Fetch Tickets (Server + Local Fallback)
  async getTickets() {
    let localTickets = [];
    try {
      const stored = await AsyncStorage.getItem('@dobix_support_tickets');
      if (stored) localTickets = JSON.parse(stored);
    } catch (e) {}

    try {
      const response = await fetch(API_ENDPOINTS.GET_TICKETS, {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.tickets && Array.isArray(data.tickets)) {
          // Merge server tickets with any pending local tickets
          const serverIds = new Set(data.tickets.map((t) => t.id));
          const unsynced = localTickets.filter((t) => !serverIds.has(t.id));
          const merged = [...unsynced, ...data.tickets];
          await AsyncStorage.setItem('@dobix_support_tickets', JSON.stringify(merged)).catch(() => {});
          return merged;
        }
      }
    } catch (err) {
      console.log('Error fetching tickets from server, using local fallback:', err);
    }

    return localTickets;
  },

  // 8. Create Support Ticket / Complaint
  async createTicket(ticketData) {
    const newTicket = {
      id: `tkt_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      status: 'open',
      created_at: new Date().toISOString(),
      ...ticketData,
    };

    // Save locally first for instant offline/server-down resilience
    let localTickets = [];
    try {
      const stored = await AsyncStorage.getItem('@dobix_support_tickets');
      if (stored) localTickets = JSON.parse(stored);
      localTickets = [newTicket, ...localTickets];
      await AsyncStorage.setItem('@dobix_support_tickets', JSON.stringify(localTickets));
    } catch (e) {}

    // Send to server in background
    try {
      const response = await fetch(API_ENDPOINTS.CREATE_TICKET, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(newTicket),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.ticket) return data.ticket;
      }
    } catch (err) {
      console.log('Server unreachable for ticket, saved locally:', err);
    }

    return newTicket;
  },

  // 9. Update Support Ticket Status
  async updateTicketStatus(ticketId, newStatus) {
    // Update local storage
    try {
      const stored = await AsyncStorage.getItem('@dobix_support_tickets');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t));
        await AsyncStorage.setItem('@dobix_support_tickets', JSON.stringify(updated));
      }
    } catch (e) {}

    // Update on server
    try {
      await fetch(API_ENDPOINTS.UPDATE_TICKET_STATUS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ ticket_id: ticketId, status: newStatus }),
      });
    } catch (err) {
      console.log('Error updating ticket on server:', err);
    }
  },
};

export default apiService;
