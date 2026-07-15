export const mainNavigation = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Movies", path: "/movies" },
  { label: "Showtimes", path: "/showtimes" },
  { label: "Booking", path: "/booking" },
  { label: "My tickets", path: "/bookings" },
  { label: "Support", path: "/support" },
];

export const customerNavigation = [
  { label: "Profile", path: "/profile" },
  { label: "My voucher", path: "/vouchers" },
  { label: "Support", path: "/support" },
  { label: "Lịch sử thanh toán", path: "/payment-history" },
];

export const adminNavigation = [
  { label: "Admin", path: "/admin", roles: ["ADMIN"] },
  { label: "Rooms", path: "/admin/rooms", roles: ["ADMIN"] },
  { label: "Reviews", path: "/admin/reviews", roles: ["ADMIN"] },
  {
    label: "Users",
    path: "/admin/users",
    roles: ["ADMIN"],
    permissions: ["USER_VIEW_LIST"],
  },
  { label: "Reports", path: "/admin/reports", roles: ["ADMIN"] },
];

export const managerNavigation = [
  { label: "Dashboard", path: "/manager", end: true },
  { label: "Reviews", path: "/manager/reviews" },
  { label: "Rooms & Seats", path: "/manager/rooms" },
  { label: "Showtimes", path: "/manager/showtimes" },
];
