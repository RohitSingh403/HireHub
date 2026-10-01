import AuthBrandPanel from "./AuthBrandPanel";
import { LogoLockup } from "../../../components/Logo.jsx";

function AuthLayout({ children, line }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <AuthBrandPanel line={line} />
      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <LogoLockup to="/" />
          <p className="mt-4 text-sm leading-6 text-muted lg:hidden">{line}</p>
          {children}
        </div>
      </section>
    </main>
  );
}

export default AuthLayout;
