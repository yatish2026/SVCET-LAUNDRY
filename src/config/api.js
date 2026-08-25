// GoDaddy Backend API Base URL (reads from .env or uses default)
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://rvsu.org/api/index.php';

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}?action=register`,
  LOGIN: `${API_BASE_URL}?action=login`,
  GET_BOOKINGS: `${API_BASE_URL}?action=get_bookings`,
  CREATE_BOOKING: `${API_BASE_URL}?action=create_booking`,
  UPDATE_STATUS: `${API_BASE_URL}?action=update_status`,
  GET_NOTIFICATIONS: `${API_BASE_URL}?action=get_notifications`,
  DELETE_ACCOUNT: `${API_BASE_URL}?action=delete_account`,
  GET_TICKETS: `${API_BASE_URL}?action=get_tickets`,
  CREATE_TICKET: `${API_BASE_URL}?action=create_ticket`,
  UPDATE_TICKET_STATUS: `${API_BASE_URL}?action=update_ticket_status`,
  RESET_PASSWORD: `${API_BASE_URL}?action=reset_password`,
  GET_STUDENTS_CENSUS: `${API_BASE_URL}?action=get_students_census`,
};

export default API_BASE_URL;
