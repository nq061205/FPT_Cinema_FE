import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { env } from "../config/env.js";
import { managerNavigation } from "../config/navigation.js";
import { useAuth } from "../hooks/useAuth.js";

function ManagerLayout() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/manager" className="brand">
          <span className="brand-mark">FC</span>
          <span>{env.appName} Manager</span>
        </NavLink>

        <nav className="nav-stack" aria-label="Manager navigation">
          {managerNavigation.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.end}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="nav-label">
            {user?.fullName ?? user?.email ?? "Manager"}
          </span>
          <button
            className="btn btn-outline-dark btn-sm"
            type="button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="workspace">
        <Outlet />
      </div>
    </div>
  );
}

export default ManagerLayout;
