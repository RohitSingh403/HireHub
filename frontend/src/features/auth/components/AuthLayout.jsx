function AuthLayout({ children }) {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-162.5">
          <section className=" bg-blue-50 p-8 md:p-12">
            <div className="flex items-center gap-2">
              <img className="h-13 " src="/Hire-Hub_logo.png" alt="logo" />
              <h1 className="text-2xl font-bold text-slate-900 w-24 h-auto">
                HireHub
              </h1>
            </div>
          </section>
          <section className="p-8 md:p-12">{children}</section>
        </div>
      </div>
    </main>
  );
}
export default AuthLayout;
