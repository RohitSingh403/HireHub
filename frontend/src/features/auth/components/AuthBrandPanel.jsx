function AuthBrandPanel({ line }) {
  return (
    <section className="hidden flex-col justify-between bg-ink p-10 text-paper lg:flex lg:p-14">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-paper/60">
        HireHub
      </p>
      <div>
        <h1 className="font-display text-5xl leading-tight">
          Find a role. Or fill one.
        </h1>
        <p className="mt-5 max-w-md text-lg leading-7 text-paper/80">{line}</p>
      </div>
      <p className="text-sm text-paper/60">
        Candidate and recruiter accounts stay separate.
      </p>
    </section>
  );
}

export default AuthBrandPanel;
