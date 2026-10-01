import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/AuthLayout.jsx";
import { loginSchema } from "../schemas/authSchema.js";
import { login } from "../services/authService.js";
import useAuthStore, { useAuthHydrated } from "../../../store/authStore.js";
import Alert from "../../../components/Alert.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import apiError from "../../../utils/apiError.js";

const line = "Sign in with the admin email and password configured on the API.";

function AdminLogin() {
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

  if (hydrated && isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  async function onSubmit(data) {
    setErrorMessage("");
    setSubmitting(true);
    try {
      const response = await login({
        email: data.email,
        password: data.password,
        role: "admin",
      });
      if (response.user?.role !== "admin") {
        setErrorMessage("This sign-in is only for an admin account.");
        return;
      }
      loginUser(response.token, response.user);
      navigate("/admin", { replace: true });
    } catch (err) {
      setErrorMessage(apiError(err, "Could not sign in."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout line={line}>
      <h2 className="mt-8 font-display text-3xl text-ink">Admin sign in</h2>
      <p className="mt-2 text-muted">
        Use the email and password from the API environment. A successful sign-in opens the admin home.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Alert>{errorMessage}</Alert>

        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <input
            className={inputClass}
            {...register("email")}
            id="email"
            type="email"
            autoComplete="username"
            placeholder="admin@company.com"
          />
        </Field>

        <Field label="Password" htmlFor="password" error={errors.password?.message}>
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
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        The public register page cannot create this account.{" "}
        <Link to="/login" className="font-semibold text-pine">
          Candidate and recruiter sign-in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default AdminLogin;
