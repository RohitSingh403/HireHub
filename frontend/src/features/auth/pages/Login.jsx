import { useState } from "react";
import AuthLayout from "../components/AuthLayout";
import RoleSelector from "../components/RoleSelector";

function Login() {
  const [selectedRole, setSelectedRole] = useState("candidate");
  return (
    <AuthLayout>
      <RoleSelector selectedRole={selectedRole} setSelectedRole={setSelectedRole} />
      <h2 className=" text-2xl font-semibold text-slate-900">Welcome back!</h2>

      <p className="mt-2 text-slate-500">
        Sign in to continue to your HireHub account.
      </p>
    </AuthLayout>
  );
}

export default Login;
