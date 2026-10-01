import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LogoLockup } from "../components/Logo.jsx";
import useAuthStore from "../store/authStore";
import { homePath } from "../utils/homePath";

const candidateLinks = [
  { to: "/jobs", label: "Open roles", end: true },
  { to: "/recommended", label: "Recommended", end: false },
  { to: "/applications", label: "My applications", end: true },
  { to: "/profile", label: "Profile", end: false },
];

const recruiterLinks = [
  { to: "/recruiter", label: "Overview", end: true },
  { to: "/recruiter/jobs", label: "Jobs", end: true },
  { to: "/recruiter/company", label: "Company", end: false },
  { to: "/recruiter/jobs/new", label: "Post a job", end: false },
];

function navClass(isActive) {
  return `rounded-xl px-3 py-2 text-sm font-medium ${
    isActive ? "bg-ink text-paper" : "text-muted hover:bg-paper hover:text-ink"
  }`;
}

function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const links = user?.role === "recruiter" ? recruiterLinks : candidateLinks;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="flex flex-col border-b border-line bg-card lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
        <div className="px-4 py-4">
          <LogoLockup to={homePath(user?.role)} />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => navClass(isActive)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-line px-4 py-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="text-xs uppercase tracking-wide text-muted">
              {user?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="shrink-0 rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-ink"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
