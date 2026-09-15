import AuthBrandPanel from "./AuthBrandPanel";

function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-162.5">
          <AuthBrandPanel></AuthBrandPanel>
          <section className="p-8 md:p-12">{children}</section>
        </div>
      </div>
    </main>
  );
}
export default AuthLayout;
