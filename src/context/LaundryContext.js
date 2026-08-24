import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/apiService';
import { calculateYearSchedule } from '../constants/schedule';

const LaundryContext = createContext({});

export const LaundryProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [serverStatusMessage, setServerStatusMessage] = useState('RVS University Live');

  // Load Support Tickets from storage
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const stored = await AsyncStorage.getItem('@dobix_support_tickets');
        if (stored) {
          setTickets(JSON.parse(stored));
        } else {
          const sampleTickets = [
            {
              id: 'TKT-1001',
              user_id: 'usr_sample',
              student_name: 'Rahul Sharma',
              student_id: '21RVS045',
              student_email: 'student@rvs.edu.in',
              room_number: '204',
              hostel_block: 'Block A (Boys Hostel)',
              phone_number: '9876543210',
              category: 'Clothes Missing / Delay',
              subject: 'Blue Hoodie not returned in Friday wash',
              description: 'I submitted 5 clothes on Wednesday intake, but the navy blue hoodie was not in the returned laundry bag. Please check with the laundry counter.',
              photos: [],
              status: 'in_progress', // 'open' | 'in_progress' | 'resolved'
              created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
              admin_reply: 'Our team is checking the Friday wash batch records and will update you shortly.',
            },
          ];
          setTickets(sampleTickets);
          await AsyncStorage.setItem('@dobix_support_tickets', JSON.stringify(sampleTickets));
        }
      } catch (e) {
        console.log('Error loading tickets:', e);
      }
    };
    loadTickets();
  }, []);

  // Fetch all bookings and notifications from GoDaddy API
  const refreshData = useCallback(async () => {
    try {
      const [fetchedBookings, fetchedNotifs] = await Promise.all([
        apiService.getBookings(),
        apiService.getNotifications(),
      ]);

      setBookings(fetchedBookings);
      setNotifications(fetchedNotifs);
      setIsServerConnected(true);
      setServerStatusMessage('RVS University Live');
    } catch (err) {
      console.log('Error refreshing data:', err);
      setIsServerConnected(false);
      setServerStatusMessage('Connecting...');
    }
  }, []);

  // Poll server every 10 seconds for real-time updates across devices
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Create a new support complaint ticket
  const createTicket = async (ticketData) => {
    const newTicket = {
      id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'open',
      created_at: new Date().toISOString(),
      admin_reply: '',
      photos: [],
      ...ticketData,
    };
    const updated = [newTicket, ...tickets];
    setTickets(updated);
    try {
      await AsyncStorage.setItem('@dobix_support_tickets', JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving ticket:', e);
    }
    return newTicket;
  };

  // Update ticket status & reply (Staff / Admin)
  const updateTicketStatus = async (ticketId, newStatus, adminReply = '') => {
    const updated = tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: newStatus,
            admin_reply: adminReply || t.admin_reply,
            resolved_at: newStatus === 'resolved' ? new Date().toISOString() : t.resolved_at,
          }
        : t
    );
    setTickets(updated);
    try {
      await AsyncStorage.setItem('@dobix_support_tickets', JSON.stringify(updated));
    } catch (e) {
      console.log('Error updating ticket:', e);
    }
  };

  // Create a new laundry booking
  const createBooking = async ({
    student_name,
    student_id,
    academic_year = '1st Year',
    hostel_block,
    room_number,
    phone_number,
    items,
    total_items,
    photos = [],
    special_instructions = '',
  }) => {
    setIsLoading(true);
    const schedule = calculateYearSchedule(academic_year);

    const bookingPayload = {
      student_name,
      student_id,
      academic_year,
      hostel_block,
      room_number,
      phone_number,
      items,
      total_items,
      photos,
      status: 'pending_approval',
      dropoff_slot_time: `${schedule.dropoffDay} (08:00 AM - 11:30 AM)`,
      pickup_slot_time: `${schedule.pickupDay} (Guaranteed Pickup after 2 days)`,
      special_instructions,
    };

    try {
      const newBooking = await apiService.createBooking(bookingPayload);
      setBookings((prev) => [newBooking, ...prev]);
      setIsLoading(false);
      return newBooking;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  // Advance booking wash stage (Optimistic UI update)
  const advanceBookingStatus = async (bookingId, newStatus) => {
    // 1. Instantly update UI optimistically
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );

    // 2. Send update to GoDaddy API in background
    try {
      await apiService.updateStatus(bookingId, newStatus);
    } catch (err) {
      console.log('Error updating status on server:', err);
    }
  };

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    return advanceBookingStatus(bookingId, 'cancelled');
  };

  const markNotificationRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, is_read: 1 } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Grand Total calculation
  const grandTotalClothes = bookings.reduce(
    (sum, b) => sum + (parseInt(b.total_items, 10) || 0),
    0
  );

  // Year-wise stats
  const yearWiseStats = {
    '1st Year': { totalClothes: 0, studentCount: 0, activeCount: 0 },
    '2nd Year': { totalClothes: 0, studentCount: 0, activeCount: 0 },
    '3rd Year': { totalClothes: 0, studentCount: 0, activeCount: 0 },
    '4th Year': { totalClothes: 0, studentCount: 0, activeCount: 0 },
  };

  bookings.forEach((b) => {
    const yr = b.academic_year || '1st Year';
    if (yearWiseStats[yr]) {
      yearWiseStats[yr].totalClothes += parseInt(b.total_items, 10) || 0;
      yearWiseStats[yr].studentCount += 1;
      if (b.status !== 'completed' && b.status !== 'cancelled') {
        yearWiseStats[yr].activeCount += 1;
      }
    }
  });

  return (
    <LaundryContext.Provider
      value={{
        bookings,
        notifications,
        tickets,
        isLoading,
        isServerConnected,
        serverStatusMessage,
        grandTotalClothes,
        yearWiseStats,
        refreshData,
        createBooking,
        advanceBookingStatus,
        cancelBooking,
        markNotificationRead,
        clearAllNotifications,
        createTicket,
        updateTicketStatus,
      }}
    >
      {children}
    </LaundryContext.Provider>
  );
};

export const useLaundry = () => {
  const context = useContext(LaundryContext);
  if (!context) {
    throw new Error('useLaundry must be used within a LaundryProvider');
  }
  return context;
};

export default LaundryContext;
