import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import "./admin-theme.css";

const ADMIN_ROUTES = [
  "/AdminLogin",
  "/Dashboard",
  "/Rooms",
  "/Booking",
  "/Guest",
  "/AddGuest",
  "/Users",
  "/Profile",
  "/Sales",
];

function AdminTheme({ children }) {
  const location = useLocation();
  const isAdminRoute = ADMIN_ROUTES.includes(location.pathname);
  const showThemeToggle = location.pathname === "/Profile";
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("adminTheme") !== "light";
  });

  useEffect(() => {
    document.body.classList.toggle("admin-mode", isAdminRoute);
    document.body.classList.toggle("admin-dark", isAdminRoute && isDark);
    document.body.classList.toggle("admin-light", isAdminRoute && !isDark);

    return () => {
      document.body.classList.remove("admin-mode", "admin-dark", "admin-light");
    };
  }, [isAdminRoute, isDark]);

  const toggleTheme = () => {
    setIsDark((current) => {
      const nextValue = !current;
      localStorage.setItem("adminTheme", nextValue ? "dark" : "light");
      return nextValue;
    });
  };

  return (
    <>
      {showThemeToggle && (
        <button
          className="admin-theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
          title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
          <span aria-hidden="true">{isDark ? "☀" : "☾"}</span>
          <span>{isDark ? "Light" : "Dark"}</span>
        </button>
      )}
      {children}
    </>
  );
}

export default AdminTheme;