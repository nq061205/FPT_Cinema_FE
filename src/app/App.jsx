import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../contexts/AuthContext.jsx";
import AppLayout from "../layouts/AppLayout.jsx";
import AuthLayout from "../layouts/AuthLayout.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import ManagerLayout from "../layouts/ManagerLayout.jsx";

import ProtectedRoute from "../components/common/ProtectedRoute.jsx";
import RoleHomeGuard from '../components/common/RoleHomeGuard.jsx';

import AdminDashboardPage from "../pages/admin/AdminDashboardPage.jsx";
import AccessManagementPage from '../pages/admin/AccessManagementPage.jsx';
import MovieManagementPage from '../pages/admin/MovieManagementPage.jsx';
import ProductManagementPage from '../pages/admin/ProductManagementPage.jsx';
import RefundManagementPage from '../pages/admin/RefundManagementPage.jsx';
import ReportsPage from '../pages/admin/ReportsPage.jsx';
import SeatManagementPage from '../pages/admin/SeatManagementPage.jsx';
import UserManagementPage from '../pages/admin/UserManagementPage.jsx';
import RoomManagementPage from "../pages/admin/RoomManagementPage.jsx";

import ManagerDashboardPage from "../pages/manager/ManagerDashboardPage.jsx";
import ShowtimeManagementPage from "../pages/manager/ShowtimeManagementPage.jsx";
import ManagerRoomManagementPage from "../pages/manager/RoomManagementPage.jsx";
import ReviewManagementPage from "../pages/manager/ReviewManagementPage.jsx";

import LoginPage from "../pages/auth/LoginPage.jsx";
import RegisterPage from "../pages/auth/RegisterPage.jsx";

import BookingFlowPage from "../pages/booking/BookingFlowPage.jsx";
import BookingHistoryPage from "../pages/booking/BookingHistoryPage.jsx";

import MovieDetailPage from "../pages/movies/MovieDetailPage.jsx";
import MovieListPage from "../pages/movies/MovieListPage.jsx";

import PaymentHistoryPage from "../pages/payment/PaymentHistoryPage.jsx";
import PaymentReturnPage from '../pages/payment/PaymentReturnPage.jsx';
import PaymentResultPage from '../pages/payment/PaymentResultPage.jsx';

import ProfilePage from "../pages/profile/ProfilePage.jsx";
import VoucherPage from "../pages/promotions/VoucherPage.jsx";

import DashboardPage from "../pages/public/DashboardPage.jsx";
import HomePage from "../pages/public/HomePage.jsx";
import NotFoundPage from "../pages/public/NotFoundPage.jsx";
import SupportChatPage from "../pages/public/SupportChatPage.jsx";

import ShowtimeListPage from "../pages/showtimes/ShowtimeListPage.jsx";

import CheckTicketPage from '../pages/staff/CheckTicketPage.jsx';
import CounterBookingPage from '../pages/staff/CounterBookingPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<RoleHomeGuard><HomePage /></RoleHomeGuard>} />

            <Route element={<ProtectedRoute />}>
              <Route path="movies" element={<MovieListPage />} />
              <Route path="movies/:movieId" element={<MovieDetailPage />} />
              <Route path="showtimes" element={<ShowtimeListPage />} />
              <Route path="booking" element={<BookingFlowPage />} />
            </Route>
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route path="/payment/result" element={<PaymentResultPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="bookings" element={<BookingHistoryPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="vouchers" element={<VoucherPage />} />
              <Route path="payment/return" element={<PaymentReturnPage />} />
              <Route path="payment-history" element={<PaymentHistoryPage />} />
              <Route path="support" element={<SupportChatPage />} />

              <Route element={<ProtectedRoute roles={["ADMIN"]} />}>
                <Route path="admin" element={<AdminDashboardPage />} />
                <Route path="admin/rooms" element={<RoomManagementPage />} />
                <Route path="admin/rooms/:roomId/seats" element={<SeatManagementPage />} />
                <Route path="admin/products" element={<ProductManagementPage />} />
                <Route path="admin/movies" element={<MovieManagementPage />} />
                <Route path="admin/showtimes" element={<ShowtimeManagementPage />} />
                <Route path="admin/reports" element={<ReportsPage />} />
                <Route path="admin/reviews" element={<ReviewManagementPage />} />
                <Route path="admin/refunds" element={<RefundManagementPage />} />
                <Route path="admin/access" element={<AccessManagementPage />} />
              </Route>

              <Route element={<ProtectedRoute permissions={['USER_VIEW_LIST']} roles={['ADMIN']} />}>
                <Route path="admin/users" element={<UserManagementPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['STAFF', 'ADMIN', 'MANAGER']} />}>
                <Route path="staff/check-ticket" element={<CheckTicketPage />} />
                <Route path="staff/counter-booking" element={<CounterBookingPage />} />
              </Route>
            </Route>

            {/* Manager route */}
            <Route element={<ProtectedRoute roles={["MANAGER"]} />}>
              <Route element={<ManagerLayout />}>
                <Route path="manager" element={<ManagerDashboardPage />} />
                <Route path="manager/reviews" element={<ReviewManagementPage />} />
                <Route path="manager/rooms" element={<ManagerRoomManagementPage />} />
                <Route path="manager/showtimes" element={<ShowtimeManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
