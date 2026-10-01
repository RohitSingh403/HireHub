function RoleCards({ selectedRole, setSelectedRole }) {
  const roles = [
    {
      id: "candidate",
      title: "Candidate",
      text: "See open roles and follow your applications.",
    },
    {
      id: "recruiter",
      title: "Recruiter",
      text: "Post roles and move applicants through the pipeline.",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Account type">
      {roles.map((role) => {
        const selected = selectedRole === role.id;
        return (
          <button
            key={role.id}
            type="button"
            aria-pressed={selected}
            onClick={() => setSelectedRole(role.id)}
            className={`rounded-2xl border px-4 py-3 text-left ${
              selected
                ? "border-pine bg-pine/10"
                : "border-line bg-white hover:border-ink/30"
            }`}
          >
            <span className="block text-sm font-semibold">{role.title}</span>
            <span className="mt-1 block text-sm leading-5 text-muted">
              {role.text}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default RoleCards;
