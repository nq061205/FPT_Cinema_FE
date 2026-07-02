import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import ReportsPage from '../pages/admin/ReportsPage.jsx'
import RoomManagementPage from '../pages/admin/RoomManagementPage.jsx'
import UserManagementPage from '../pages/admin/UserManagementPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import RegisterPage from '../pages/auth/RegisterPage.jsx'
import BookingFlowPage from '../pages/booking/BookingFlowPage.jsx'
import BookingHistoryPage from '../pages/booking/BookingHistoryPage.jsx'
import MovieListPage from '../pages/movies/MovieListPage.jsx'
import ProfilePage from '../pages/profile/ProfilePage.jsx'
import DashboardPage from '../pages/public/DashboardPage.jsx'
import NotFoundPage from '../pages/public/NotFoundPage.jsx'
import SupportChatPage from '../pages/public/SupportChatPage.jsx'
import ShowtimeListPage from '../pages/showtimes/ShowtimeListPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="movies" element={<MovieListPage />} />
              <Route path="showtimes" element={<ShowtimeListPage />} />
              <Route path="booking" element={<BookingFlowPage />} />
              <Route path="bookings" element={<BookingHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="support" element={<SupportChatPage />} />

              <Route element={<ProtectedRoute roles={['ADMIN', 'MANAGER']} />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/rooms" element={<RoomManagementPage />} />
                <Route path="admin/reports" element={<ReportsPage />} />
              </Route>

              <Route element={<ProtectedRoute permissions={['USER_VIEW_LIST']} />}>
                <Route path="admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
