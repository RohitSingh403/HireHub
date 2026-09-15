function RoleSelector({ selectedRole, setSelectedRole }) {
  return (
    <div className="w-full bg-blue-50  h-15 rounded-sm flex justify-center items-center">
      <button
        className={` p-2 text-gray-700 rounded-sm w-58 text-[20px] cursor-pointer ${selectedRole === "candidate" ? " bg-[#2563EB] text-white " : " bg-blue-50 "}`}
        onClick={() => setSelectedRole("candidate")}
      >
        Candidate
      </button>
      <button
        className={` p-2 text-gray-700 rounded-sm w-58 text-[20px] cursor-pointer  ${selectedRole === "recruiter" ? " bg-[#2563EB] text-white " : " bg-blue-50 "}`}
        onClick={() => setSelectedRole("recruiter")}
      >
        Recruiter
      </button>
    </div>
  );
}

export default RoleSelector;
