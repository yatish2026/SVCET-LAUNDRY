import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import { calculateYearSchedule } from '../constants/schedule';

const LaundryContext = createContext({});

export const LaundryProvider = ({ children }) => {
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isServerConnected, setIsServerConnected] = useState(true);
  const [serverStatusMessage, setServerStatusMessage] = useState('GoDaddy Server Connected');

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
      setServerStatusMessage('GoDaddy rvsu.org Live');
    } catch (err) {
      console.log('Error refreshing GoDaddy data:', err);
      setIsServerConnected(false);
      setServerStatusMessage('Connecting to GoDaddy...');
    }
  }, []);

  // Poll server every 10 seconds for real-time updates across devices
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [refreshData]);

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

  // Advance booking wash stage
  const advanceBookingStatus = async (bookingId, newStatus) => {
    try {
      await apiService.updateStatus(bookingId, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err) {
      console.log('Error updating status:', err);
    }
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
        isLoading,
        isServerConnected,
        serverStatusMessage,
        grandTotalClothes,
        yearWiseStats,
        refreshData,
        createBooking,
        advanceBookingStatus,
        markNotificationRead,
        clearAllNotifications,
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
