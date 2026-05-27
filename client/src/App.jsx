import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MobileTabBar from './components/MobileTabBar'
import Home from './pages/Home'
import Events from './pages/Events'
import Profile from './pages/Profile'
import RoleSelection from './pages/RoleSelection'
import UserAuth from './pages/UserAuth'
import CoordinatorAuth from './pages/CoordinatorAuth'
import CoordinatorDashboard from './pages/CoordinatorDashboard'
import CreateEvent from './pages/CreateEvent'
import EditEvent from './pages/EditEvent'
import CreatePost from './pages/CreatePost'
import EventManagement from './pages/EventManagement'
import EventDetail from './pages/EventDetail'
import Messages from './pages/Messages'
import Notifications from './pages/Notifications'
import SystemSettings from './pages/SystemSettings'
import Networking from './pages/Networking'
import Jobs from './pages/Jobs'
import Settings from './pages/Settings'
import Saved from './pages/Saved'
import Archive from './pages/Archive'
import Activity from './pages/Activity'
import Help from './pages/Help'
import HelpCenter from './pages/HelpCenter'
import SupportInbox from './pages/SupportInbox'
import ReportProblem from './pages/ReportProblem'
import SafetyCenter from './pages/SafetyCenter'
import AccountStatus from './pages/AccountStatus'
import About from './pages/About'
import PrivacyTerms from './pages/PrivacyTerms'
import TimeManagement from './pages/TimeManagement'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public / Welcome Routes */}
          <Route path="/welcome" element={<RoleSelection />} />
          <Route path="/auth/user" element={<UserAuth />} />
          <Route path="/auth/coordinator" element={<CoordinatorAuth />} />

          {/* Admin portal moved to separate port - redirect to admin portal */}
          <Route path="/auth/admin" element={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
              <h2>Admin Portal Moved</h2>
              <p>The admin portal now runs on a separate port for security.</p>
              <button 
                onClick={() => window.location.href = `http://${window.location.hostname}:5174/login`} 
                style={{ color: 'blue', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}
              >
                Go to Admin Portal
              </button>
            </div>
          } />

          {/* User Specific Routes */}
          <Route path="/" element={<ProtectedRoute allowedRoles={['user']}><Home /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute allowedRoles={['user']}><Events /></ProtectedRoute>} />
          <Route path="/profile/:id?" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Profile /></ProtectedRoute>} />
          <Route path="/event/:id" element={<ProtectedRoute allowedRoles={['user']}><EventDetail /></ProtectedRoute>} />
          <Route path="/networking" element={<ProtectedRoute allowedRoles={['user']}><Networking /></ProtectedRoute>} />
          <Route path="/jobs" element={<ProtectedRoute allowedRoles={['user']}><Jobs /></ProtectedRoute>} />
          <Route path="/messages" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Messages /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Notifications /></ProtectedRoute>} />

          {/* Coordinator Specific Routes */}
          <Route path="/coordinator" element={<ProtectedRoute allowedRoles={['coordinator']}><CoordinatorDashboard /></ProtectedRoute>} />
          <Route path="/create-event" element={<ProtectedRoute allowedRoles={['coordinator']}><CreateEvent /></ProtectedRoute>} />
          <Route path="/edit-event/:id" element={<ProtectedRoute allowedRoles={['coordinator']}><EditEvent /></ProtectedRoute>} />
          <Route path="/manage-event/:id" element={<ProtectedRoute allowedRoles={['coordinator']}><EventManagement /></ProtectedRoute>} />

          {/* Admin routes removed - now handled by admin-server on port 5001 */}

          <Route path="/create-post" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><CreatePost /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Settings /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Saved /></ProtectedRoute>} />
          <Route path="/archive" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Archive /></ProtectedRoute>} />
          <Route path="/activity" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Activity /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><Help /></ProtectedRoute>} />
          <Route path="/help-center" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><HelpCenter /></ProtectedRoute>} />
          <Route path="/support" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><SupportInbox /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><ReportProblem /></ProtectedRoute>} />
          <Route path="/safety" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><SafetyCenter /></ProtectedRoute>} />
          <Route path="/account-status" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><AccountStatus /></ProtectedRoute>} />
          <Route path="/about" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><About /></ProtectedRoute>} />
          <Route path="/privacy" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><PrivacyTerms /></ProtectedRoute>} />
          <Route path="/terms" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><PrivacyTerms /></ProtectedRoute>} />
          <Route path="/time-management" element={<ProtectedRoute allowedRoles={['user', 'coordinator']}><TimeManagement /></ProtectedRoute>} />
        </Routes>
        <MobileTabBar />
      </div>
    </Router>
  )
}

export default App
