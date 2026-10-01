import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/AuthLayout.jsx";
import RoleSelector from "../components/RoleSelector.jsx";

const lines = {
  candidate:
    "Save a profile, see why a role matches, and follow every application through the pipeline.",
  recruiter:
    "Post roles you own, rank applicants with the same match, and move each one stage at a time.",
};
import { loginSchema } from "../schemas/authSchema.js";
import { login } from "../services/authService.js";
import useAuthStore, { useAuthHydrated } from "../../../store/authStore.js";
import { homePath } from "../../../utils/homePath.js";
import Alert from "../../../components/Alert.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import apiError from "../../../utils/apiError.js";

function Login() {
  const [selectedRole, setSelectedRole] = useState("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const loginUser = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthHydrated();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  if (hydrated && isAuthenticated) {
    return <Navigate to={homePath(user?.role)} replace />;
  }

  async function onSubmit(data) {
    setErrorMessage("");
    setSubmitting(true);
    try {
      const response = await login({
        email: data.email,
        password: data.password,
        role: selectedRole,
      });
      loginUser(response.token, response.user);
      navigate(homePath(response.user.role), { replace: true });
    } catch (err) {
      setErrorMessage(apiError(err, "Could not sign in."));
    } finally {
      setSubmitting(false);
    }
  }

  const buttonLabel =
    selectedRole === "recruiter" ? "Sign in as recruiter" : "Sign in as candidate";

  return (
    <AuthLayout line={lines[selectedRole]}>
      <h2 className="mt-8 font-display text-3xl text-ink">Welcome back</h2>
      <p className="mt-2 text-muted">
        {selectedRole === "recruiter"
          ? "Sign in to manage your company and applicants."
          : "Sign in to see open roles and your applications."}
      </p>

      <div className="mt-6">
        <RoleSelector
          selectedRole={selectedRole}
          setSelectedRole={setSelectedRole}
        />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Alert>{errorMessage}</Alert>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            className={inputClass}
            {...register("email")}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
        >
          <div className="relative">
            <input
              className={`${inputClass} pr-16`}
              {...register("password")}
              autoComplete="current-password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Your password"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-pine"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-pine px-4 py-3 text-sm font-semibold text-white hover:bg-pine-dark disabled:opacity-60"
        >
          {submitting ? "Signing in…" : buttonLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        New to HireHub?{" "}
        <Link to="/register" className="font-semibold text-pine">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
