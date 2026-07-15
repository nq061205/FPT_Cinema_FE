import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext.jsx'
import AppLayout from '../layouts/AppLayout.jsx'
import AuthLayout from '../layouts/AuthLayout.jsx'
import PublicLayout from '../layouts/PublicLayout.jsx'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.jsx'
import ReportsPage from '../pages/admin/ReportsPage.jsx'
import RoomManagementPage from '../pages/admin/RoomManagementPage.jsx'
import UserManagementPage from '../pages/admin/UserManagementPage.jsx'
import LoginPage from '../pages/auth/LoginPage.jsx'
import RegisterPage from '../pages/auth/RegisterPage.jsx'
import BookingFlowPage from '../pages/booking/BookingFlowPage.jsx'
import BookingHistoryPage from '../pages/booking/BookingHistoryPage.jsx'
import MovieDetailPage from '../pages/movies/MovieDetailPage.jsx'
import MovieListPage from '../pages/movies/MovieListPage.jsx'
import PaymentHistoryPage from '../pages/payment/PaymentHistoryPage.jsx'
import ProfilePage from '../pages/profile/ProfilePage.jsx'
import VoucherPage from '../pages/promotions/VoucherPage.jsx'
import DashboardPage from '../pages/public/DashboardPage.jsx'
import HomePage from '../pages/public/HomePage.jsx'
import NotFoundPage from '../pages/public/NotFoundPage.jsx'
import SupportChatPage from '../pages/public/SupportChatPage.jsx'
import ShowtimeListPage from '../pages/showtimes/ShowtimeListPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<HomePage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="movies/:movieId" element={<MovieDetailPage />} />
            </Route>
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="movies" element={<MovieListPage />} />
              <Route path="showtimes" element={<ShowtimeListPage />} />
              <Route path="booking" element={<BookingFlowPage />} />
              <Route path="bookings" element={<BookingHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="vouchers" element={<VoucherPage />} />
              <Route path="payment-history" element={<PaymentHistoryPage />} />
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
