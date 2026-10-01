import AuthBrandPanel from "./AuthBrandPanel";

function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-3xl border border-line bg-card shadow-sm md:min-h-[640px] md:grid-cols-2">
        <AuthBrandPanel />
        <section className="p-6 sm:p-10 md:p-12">{children}</section>
      </div>
    </main>
  );
}

export default AuthLayout;
