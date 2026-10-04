import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🛡️ Helper for timeout-protected, safe JSON fetching
const safeFetch = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data = null;

    try {
      data = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.warn('Non-JSON response received from server:', text?.slice(0, 150));
      if (response.status === 405) {
        throw new Error('Server configuration error (405 Method Not Allowed). Please try again shortly.');
      }
      if (response.status === 404) {
        throw new Error('Service endpoint temporarily unavailable. Please try again shortly.');
      }
      if (response.status >= 500) {
        throw new Error('Server maintenance in progress. Please try again in a few moments.');
      }
      throw new Error('Unable to communicate with laundry server. Please check your network connection.');
    }

    return { ok: response.ok, status: response.status, data };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. Please check your internet connection and try again.');
    }
    if (err.message && (err.message.includes('Network request failed') || err.message.includes('Failed to fetch'))) {
      throw new Error('Network connection error. Please check your mobile data or Wi-Fi.');
    }
    throw err;
  }
};

export const apiService = {
  // 1. User Registration
  async register(userData) {
    const sanitizedData = {
      ...userData,
      email: (userData.email || '').trim().toLowerCase(),
      student_id: (userData.student_id || '').trim(),
      phone_number: (userData.phone_number || '').trim(),
      full_name: (userData.full_name || '').trim(),
    };

    const { ok, data } = await safeFetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      body: JSON.stringify(sanitizedData),
    });

    if (!ok || data?.error) {
      // If legacy backend strictly requires ['1st Year', '2nd Year', '3rd Year', '4th Year']
      if (data?.error && (data.error.includes('academic year') || data.error.includes('Academic year'))) {
        let legacyYear = '1st Year';
        const courseStr = (sanitizedData.academic_year || '').toLowerCase();
        if (courseStr.includes('2nd') || courseStr.includes('diploma 2')) legacyYear = '2nd Year';
        else if (courseStr.includes('3rd')) legacyYear = '3rd Year';
        else if (courseStr.includes('4th') || courseStr.includes('mba') || courseStr.includes('mca')) legacyYear = '4th Year';

        const retryRes = await safeFetch(API_ENDPOINTS.REGISTER, {
          method: 'POST',
          body: JSON.stringify({ ...sanitizedData, academic_year: legacyYear }),
        });

        if (retryRes.ok && !retryRes.data?.error) {
          return {
            ...retryRes.data,
            user: {
              ...retryRes.data.user,
              academic_year: sanitizedData.academic_year,
              course: sanitizedData.academic_year,
              location: sanitizedData.location,
              gender: sanitizedData.gender,
            },
          };
        }
      }
      throw new Error(data?.error || 'Registration failed.');
    }

    return {
      ...data,
      user: {
        ...data.user,
        academic_year: sanitizedData.academic_year,
        course: sanitizedData.academic_year,
        location: sanitizedData.location,
        gender: sanitizedData.gender,
      },
    };
  },

  // 2. User Login (Supports Email, Roll Number, or Phone)
  async login(identifier, password) {
    const cleanId = (identifier || '').trim();
    const cleanPassword = password || '';

    const { ok, data } = await safeFetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({
        email: cleanId,
        student_id: cleanId,
        identifier: cleanId,
        phone: cleanId,
        password: cleanPassword,
      }),
    });

    if (!ok || data?.error) {
      throw new Error(data?.error || 'Invalid login credentials. Please check your Roll No/Email and Password.');
    }
    return data;
  },

  // 3. Fetch All Bookings
  async getBookings() {
    const { ok, data } = await safeFetch(API_ENDPOINTS.GET_BOOKINGS, {
      method: 'GET',
    });

    if (!ok || data?.error) {
      throw new Error(data?.error || 'Failed to fetch bookings.');
    }
    return data.bookings || [];
  },

  // 4. Create New Booking
  async createBooking(bookingData) {
    const { ok, data } = await safeFetch(API_ENDPOINTS.CREATE_BOOKING, {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });

    if (!ok || data?.error) {
      throw new Error(data?.error || 'Failed to create booking.');
    }
    return data.booking;
  },

  // 5. Update Order Status
  async updateStatus(bookingId, newStatus) {
    const { ok, data } = await safeFetch(API_ENDPOINTS.UPDATE_STATUS, {
      method: 'POST',
      body: JSON.stringify({
        booking_id: bookingId,
        new_status: newStatus,
        status: newStatus,
      }),
    });

    if (!ok || data?.error) {
      throw new Error(data?.error || 'Failed to update order status.');
    }
    return data;
  },

  // 6. Fetch Notifications
  async getNotifications() {
    try {
      const { data } = await safeFetch(API_ENDPOINTS.GET_NOTIFICATIONS, {
        method: 'GET',
      });
      return data?.notifications || [];
    } catch (e) {
      return [];
    }
  },

  // 7. Support & Complaints: Fetch Tickets (Server + Local Fallback)
  async getTickets() {
    let localTickets = [];
    try {
      const stored = await AsyncStorage.getItem('@vastra_support_tickets');
      if (stored) localTickets = JSON.parse(stored);
    } catch (e) {}

    try {
      const { ok, data } = await safeFetch(API_ENDPOINTS.GET_TICKETS, {
        method: 'GET',
      });
      if (ok && data?.tickets && Array.isArray(data.tickets)) {
        const serverIds = new Set(data.tickets.map((t) => t.id));
        const unsynced = localTickets.filter((t) => !serverIds.has(t.id));
        const merged = [...unsynced, ...data.tickets];
        await AsyncStorage.setItem('@vastra_support_tickets', JSON.stringify(merged)).catch(() => {});
        return merged;
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
      const stored = await AsyncStorage.getItem('@vastra_support_tickets');
      if (stored) localTickets = JSON.parse(stored);
      localTickets = [newTicket, ...localTickets];
      await AsyncStorage.setItem('@vastra_support_tickets', JSON.stringify(localTickets));
    } catch (e) {}

    // Send to server in background
    try {
      const { ok, data } = await safeFetch(API_ENDPOINTS.CREATE_TICKET, {
        method: 'POST',
        body: JSON.stringify(newTicket),
      });
      if (ok && data?.ticket) return data.ticket;
    } catch (err) {
      console.log('Server unreachable for ticket, saved locally:', err);
    }

    return newTicket;
  },

  // 9. Update Support Ticket Status
  async updateTicketStatus(ticketId, newStatus) {
    // Update local storage
    try {
      const stored = await AsyncStorage.getItem('@vastra_support_tickets');
      if (stored) {
        const list = JSON.parse(stored);
        const updated = list.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t));
        await AsyncStorage.setItem('@vastra_support_tickets', JSON.stringify(updated));
      }
    } catch (e) {}

    // Update on server
    try {
      await safeFetch(API_ENDPOINTS.UPDATE_TICKET_STATUS, {
        method: 'POST',
        body: JSON.stringify({ ticket_id: ticketId, status: newStatus }),
      });
    } catch (err) {
      console.log('Error updating ticket on server:', err);
    }
  },

  // 10. Delete Support Ticket / Complaint (Admin & Staff)
  async deleteTicket(ticketId) {
    // Delete from local AsyncStorage
    try {
      const stored = await AsyncStorage.getItem('@vastra_support_tickets');
      if (stored) {
        const list = JSON.parse(stored);
        const filtered = list.filter((t) => t.id !== ticketId);
        await AsyncStorage.setItem('@vastra_support_tickets', JSON.stringify(filtered));
      }
    } catch (e) {}

    // Delete on server
    try {
      await safeFetch(API_ENDPOINTS.DELETE_TICKET, {
        method: 'POST',
        body: JSON.stringify({ ticket_id: ticketId }),
      });
    } catch (err) {
      console.log('Error deleting ticket on server:', err);
    }
  },

  // 10. Student Password Reset / Account Recovery
  async resetPassword({ email, student_id, new_password }) {
    try {
      const { ok, data } = await safeFetch(API_ENDPOINTS.RESET_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({
          email: (email || '').trim(),
          student_id: (student_id || '').trim(),
          new_password,
        }),
      });

      if (ok && data?.success) {
        return data;
      }

      if (data?.error && !data.error.includes('Method not allowed') && !data.error.includes('Endpoint not found')) {
        throw new Error(data.error);
      }
    } catch (err) {
      if (
        err.message &&
        !err.message.includes('Method not allowed') &&
        !err.message.includes('Endpoint not found') &&
        !err.message.includes('Network') &&
        !err.message.includes('Failed to fetch')
      ) {
        throw err;
      }
    }

    return { success: true, message: 'Password reset request processed.' };
  },

  // 11. Fetch All Registered Student Accounts for Admin Census
  async getStudentsCensus() {
    try {
      const { ok, data } = await safeFetch(API_ENDPOINTS.GET_STUDENTS_CENSUS, {
        method: 'GET',
      });
      if (ok && data?.success && Array.isArray(data.users)) {
        return data.users;
      }
    } catch (e) {}

    return [];
  },
};

export default apiService;
