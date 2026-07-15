import { NavLink, Outlet } from "react-router-dom";
import ChatbotWidget from "../components/chat/ChatbotWidget.jsx";
import { env } from "../config/env.js";
import { useAuth } from "../hooks/useAuth.js";
import Logo from "../assets/gemini-svg.svg";

function PublicLayout() {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="public-shell">
      <header className="public-navbar">
        <NavLink to="/" className="brand" end>
          <img src={Logo} alt={env.appName} className="brand-logo" />
        </NavLink>
        <div className="public-nav-actions">
          {isAuthenticated ? (
            <>
              <NavLink className="btn btn-outline-light btn-sm" to="/bookings">
                Lịch sử đặt vé
              </NavLink>
              <NavLink className="btn btn-danger btn-sm" to="/profile">
                {user?.fullName ?? user?.email ?? "Tài khoản"}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink className="btn btn-outline-light btn-sm" to="/login">
                Đăng nhập
              </NavLink>
              <NavLink className="btn btn-danger btn-sm" to="/register">
                Đăng ký
              </NavLink>
            </>
          )}
        </div>
      </header>

      <main className="public-content">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="brand">
          <span className="brand-mark">FC</span>
          <span>{env.appName}</span>
        </div>
        <p>
          Đặt vé xem phim nhanh chóng, ưu đãi thành viên và lịch chiếu cập nhật
          liên tục.
        </p>
        <small>
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </small>
      </footer>

      <ChatbotWidget />
    </div>
  );
}

export default PublicLayout;
