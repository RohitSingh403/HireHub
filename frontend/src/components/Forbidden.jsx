import { Link } from "react-router-dom";
import { LogoLockup } from "./Logo.jsx";
import useAuthStore from "../store/authStore.js";
import { homePath } from "../utils/homePath.js";

function Forbidden() {
  const user = useAuthStore((state) => state.user);
  const home = homePath(user?.role === "admin" ? "candidate" : user?.role);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <LogoLockup to={home} />
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-pine">
        403
      </p>
      <h1 className="mt-2 font-display text-4xl text-ink">You do not have access</h1>
      <p className="mt-3 text-muted">
        The admin pages are limited to the admin account.
      </p>
      <Link to={home} className="mt-6 text-sm font-semibold text-pine">
        Back to your home
      </Link>
    </main>
  );
}

export default Forbidden;
