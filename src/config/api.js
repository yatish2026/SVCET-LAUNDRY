// GoDaddy Backend API Base URL
export const API_BASE_URL = 'https://rvsu.org/api/index.php';

export const API_ENDPOINTS = {
  REGISTER: `${API_BASE_URL}?action=register`,
  LOGIN: `${API_BASE_URL}?action=login`,
  GET_BOOKINGS: `${API_BASE_URL}?action=get_bookings`,
  CREATE_BOOKING: `${API_BASE_URL}?action=create_booking`,
  UPDATE_STATUS: `${API_BASE_URL}?action=update_status`,
  GET_NOTIFICATIONS: `${API_BASE_URL}?action=get_notifications`,
};

export default API_BASE_URL;
