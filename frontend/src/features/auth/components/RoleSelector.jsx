function RoleSelector({ selectedRole, setSelectedRole }) {
  const roles = [
    { id: "candidate", label: "Candidate" },
    { id: "recruiter", label: "Recruiter" },
  ];

  return (
    <div
      className="grid grid-cols-2 rounded-full bg-[#efe8dc] p-1"
      role="group"
      aria-label="Account type"
    >
      {roles.map((role) => {
        const selected = selectedRole === role.id;
        return (
          <button
            key={role.id}
            type="button"
            className={`rounded-full px-3 py-2 text-sm font-medium ${
              selected ? "bg-ink text-paper" : "text-muted"
            }`}
            aria-pressed={selected}
            onClick={() => setSelectedRole(role.id)}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}

export default RoleSelector;
