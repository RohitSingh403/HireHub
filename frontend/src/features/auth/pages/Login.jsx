import AuthLayout from "../components/AuthLayout";

function Login() {
  return (
    <AuthLayout>
      <h2 className=" text-2xl font-semibold text-slate-900">
        Welcome back!
      </h2>

      <p className="mt-2 text-slate-500">
        Sign in to continue to your HireHub account.
      </p>
    </AuthLayout>
  );
}

export default Login;
