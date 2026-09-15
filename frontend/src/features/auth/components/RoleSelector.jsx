import { useState } from "react";

function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState("candidate");

  function changeCurrentRole(role) {
    setSelectedRole(role);
  }

  return (
    <div className="w-full bg-blue-50  h-15 rounded-sm flex justify-center items-center">
    <button className={` p-2 text-gray rounded-sm w-58 text-[20px]  ${selectedRole === "candidate" ? " bg-[#2563EB] text-white " : " bg-blue-50 "}`} onClick={() => changeCurrentRole("candidate")}>Candidate</button>
      <button className={` p-2 text-gray rounded-sm w-58 text-[20px]  ${selectedRole === "recruiter" ? " bg-[#2563EB] text-white " : " bg-blue-50 "}`} onClick={() => changeCurrentRole("recruiter")}>Recruiter</button>

    </div>
  );
}

export default RoleSelector;
