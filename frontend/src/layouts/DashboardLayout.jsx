import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { homePath } from "../utils/homePath";

function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const links =
    user?.role === "recruiter"
      ? [
          { to: "/recruiter", label: "Overview" },
          { to: "/recruiter/company", label: "Company" },
          { to: "/recruiter/jobs/new", label: "Post a job" },
        ]
      : [
          { to: "/jobs", label: "Open roles" },
          { to: "/recommended", label: "Recommended" },
          { to: "/applications", label: "My applications" },
          { to: "/profile", label: "Profile" },
        ];

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
          <Link
            to={homePath(user?.role)}
            className="font-display text-2xl text-ink"
          >
            HireHub
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/recruiter" || link.to === "/jobs"}
                className={({ isActive }) =>
                  `rounded-full px-3 py-1.5 text-sm font-medium ${
                    isActive
                      ? "bg-ink text-paper"
                      : "text-muted hover:bg-white hover:text-ink"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{user?.name}</p>
              <p className="text-xs uppercase tracking-wide text-muted">
                {user?.role}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-line bg-white px-3 py-1.5 text-sm font-medium text-ink hover:border-ink"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
