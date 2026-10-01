function AuthBrandPanel() {
  return (
    <section className="flex flex-col justify-between bg-ink p-8 text-paper md:p-12">
      <div>
        <p className="font-display text-3xl">HireHub</p>
        <h1 className="mt-10 font-display text-4xl leading-tight md:text-5xl">
          Find a role. Or fill one.
        </h1>
        <p className="mt-4 max-w-sm text-paper/75">
          Candidates apply once. Recruiters review the people who did, and move
          them from applied to hired.
        </p>
      </div>
      <p className="mt-12 text-sm text-paper/60">
        Candidate and recruiter accounts stay separate.
      </p>
    </section>
  );
}

export default AuthBrandPanel;
