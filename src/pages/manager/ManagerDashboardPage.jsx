import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader.jsx";
import StatCard from "../../components/common/StatCard.jsx";

const modules = [
  {
    title: "Reviews",
    path: "/manager/reviews",
    description: "Moderate user reviews and ratings.",
    icon: "",
  },
  {
    title: "Rooms & Seats",
    path: "/manager/rooms",
    description: "Manage cinema rooms and seat layouts.",
    icon: "",
  },
  {
    title: "Showtimes",
    path: "/manager/showtimes",
    description: "Schedule movie showtimes.",
    icon: "",
  },
];

function ManagerDashboardPage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Manager"
        title="Dashboard"
        description="Manage movies, reviews, rooms, and showtimes."
      />

      <div className="module-grid">
        {modules.map((m) => (
          <Link className="module-card" key={m.path} to={m.path}>
            <span style={{ fontSize: "2rem" }}>{m.icon}</span>
            <h2>{m.title}</h2>
            <p>{m.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ManagerDashboardPage;
