import { NavLink, Outlet } from "react-router-dom";
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
              <NavLink className="btn btn-outline-light btn-sm" to="/payment-history">
                Booking History
              </NavLink>
              <NavLink className="btn btn-danger btn-sm" to="/profile">
                {user?.fullName ?? user?.email ?? "Account"}
              </NavLink>
            </>
          ) : (
            <>
              <NavLink className="btn btn-outline-light btn-sm" to="/login">
                Sign in
              </NavLink>
              <NavLink className="btn btn-danger btn-sm" to="/register">
                Register
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
          <img src={Logo} alt={env.appName} className="brand-logo" />
        </div>
        <p>
          Fast ticket booking, member benefits, and constantly updated showtimes.
        </p>
        <small>
          © {new Date().getFullYear()} {env.appName}. All rights reserved.
        </small>
      </footer>
    </div>
  );
}

export default PublicLayout;
