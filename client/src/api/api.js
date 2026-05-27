import axios from 'axios';

// ── API base URLs ──
// 🔁 SWITCH: Set to your Railway/Render deployed URL for production APK
// 👉 Replace the URL below with your actual deployed backend URL
const PRODUCTION_URL = 'https://YOUR-RAILWAY-URL.up.railway.app'; // ← PASTE YOUR URL HERE

// For local development (browser), use the machine IP. For APK, use production.
const isMobileApp = window.location.hostname === 'localhost' || window.location.protocol.includes('capacitor');
const host = isMobileApp ? null : window.location.hostname;

export const BASE_URL = isMobileApp ? PRODUCTION_URL : `http://${host}:5000`;
const API_URL  = `${BASE_URL}/api`;
const ML_BASE  = isMobileApp ? PRODUCTION_URL.replace(':5000', ':8000') : `http://${host}:8000`;

export const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^uploads\//, '').replace(/^uploads\\/, '').replace(/\\/g, '/');
  return `${BASE_URL}/uploads/${cleanPath}`;
};

const api = axios.create({
  baseURL: API_URL,
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const eventAPI = {
  getEvents: () => api.get('/events'),
  getEventById: (id) => api.get(`/events/${id}`),
  createEvent: (data) => api.post('/events', data),
  updateEvent: (id, data) => api.put(`/events/${id}`, data),
  enrollEvent: (id) => api.post(`/events/${id}/enroll`),
  removeParticipant: (eventId, participantId) => api.delete(`/events/${eventId}/participants/${participantId}`),
  getParticipants: (id) => api.get(`/events/${id}/participants`),
  approveEvent: (id) => api.put(`/events/${id}/approve`),
  deleteModeratedEvent: (id) => api.delete(`/events/${id}`),
  deleteEvent: (id) => api.delete(`/events/${id}`),
  notifyParticipants: (id, message) => api.post(`/events/${id}/notify`, { message }),
};

export const storyAPI = {
  getStories: () => api.get('/stories'),
  createStory: (formData) => api.post('/stories', formData),
  deleteStory: (id) => api.delete(`/stories/${id}`),
  likeStory: (id) => api.post(`/stories/${id}/like`),
  commentStory: (id, text) => api.post(`/stories/${id}/comment`, { text }),
  replyToStory: (id, text) => api.post(`/stories/${id}/reply`, { text }),
};

export const postAPI = {
  getPosts: () => api.get('/posts'),
  getUserPosts: () => api.get('/posts/my-posts'),
  getUserPostsById: (id) => api.get(`/posts/user/${id}`),
  createPost: (data) => api.post('/posts', data),
  likePost: (id) => api.put(`/posts/${id}/like`),
  votePoll: (id, optionIndex) => api.put(`/posts/${id}/vote`, { optionIndex }),
  commentPost: (id, text) => api.post(`/posts/${id}/comment`, { text }),
  updatePost: (id, data) => api.put(`/posts/${id}`, data),
  deletePost: (id) => api.delete(`/posts/${id}`),
  savePost: (id) => api.put(`/posts/${id}/save`),
  getSavedPosts: () => api.get('/posts/saved'),
  getUserInteractions: () => api.get('/posts/interactions'),
  repostPost: (id) => api.put(`/posts/${id}/repost`),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updateAvatar: (formData) => api.post('/users/profile/avatar', formData),
  getSuggestedUsers: () => api.get('/users/suggested'),
  followUser: (id) => api.post(`/users/${id}/follow`),
  connectUser: (id) => api.post(`/users/${id}/connect`),
  handleConnectionRequest: (requestId, status) => api.put(`/users/connections/${requestId}`, { status }),
  getUserById: (id) => api.get(`/users/profile/${id}`),
  getNetworkingNotificationsCount: () => api.get('/users/notifications/networking/count'),
  markNetworkingNotificationsRead: () => api.put('/users/notifications/networking/read'),
  getNotifications: () => api.get('/users/notifications'),
  markAllNotificationsRead: () => api.put('/users/notifications/read-all'),
  toggleBlockUser: (id) => api.post(`/users/${id}/block`),
  toggleMuteUser: (id) => api.post(`/users/${id}/mute`),
  toggleCloseFriend: (id) => api.post(`/users/${id}/close-friend`),
};

export const reportAPI = {
  createReport: (data) => api.post('/reports', data),
  getReports: () => api.get('/reports'),
  updateReportStatus: (id, status) => api.put(`/reports/${id}`, { status }),
};

export const chatAPI = {
  sendMessage: (recipientId, data) => {
    if (data instanceof FormData) {
      return api.post('/chats', data);
    }
    return api.post('/chats', { recipientId, text: data });
  },
  getMessages: (userId) => api.get(`/chats/${userId}`),
  getChatList: () => api.get('/chats/list'),
  markAsRead: (userId) => api.put(`/chats/read/${userId}`),
  getUnreadCount: () => api.get('/chats/unread-count'),
  editMessage: (messageId, text) => api.put(`/chats/${messageId}`, { text }),
  deleteMessage: (messageId) => api.delete(`/chats/${messageId}`),
  deleteChat: (userId) => api.delete(`/chats/conversation/${userId}`),
};

export const systemAPI = {
  getHealth: () => api.get('/health'),
};

export const jobAPI = {
  getMyJobs: () => api.get('/jobs/my-jobs'),
  searchJobs: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.type) params.append('type', filters.type);
    if (filters.remote !== undefined) params.append('remote', filters.remote);
    if (filters.location) params.append('location', filters.location);
    if (filters.salary) params.append('salary', filters.salary);
    if (filters.category) params.append('category', filters.category);
    return api.get(`/jobs/search?${params.toString()}`);
  },
  saveJob: (data) => api.post('/jobs/save', data),
  applyJob: (data) => api.post('/jobs/apply', data),
};

// -------- Feed Ranking API (FastAPI ML service) --------
const ML_URL = ML_BASE;

export const feedAPI = {
  rankFeed: (user, posts) =>
    fetch(`${ML_URL}/rank-feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, posts }),
    }).then(res => {
      if (!res.ok) throw new Error('ML service unavailable');
      return res.json();
    }),

  checkHealth: () =>
    fetch(`${ML_URL}/health`).then(res => res.json()),
};

export default api;




