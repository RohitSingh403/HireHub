import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthLayout from "../components/AuthLayout.jsx";
import RoleSelector from "../components/RoleSelector.jsx";
import { registerSchema } from "../schemas/authSchema.js";
import { login, register as registerAccount } from "../services/authService.js";
import useAuthStore, { useAuthHydrated } from "../../../store/authStore.js";
import { homePath } from "../../../utils/homePath.js";
import Alert from "../../../components/Alert.jsx";
import Field, { inputClass } from "../../../components/Field.jsx";
import apiError from "../../../utils/apiError.js";

function Register() {
  const [selectedRole, setSelectedRole] = useState("candidate");
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
    resolver: zodResolver(registerSchema),
  });

  if (hydrated && isAuthenticated) {
    return <Navigate to={homePath(user?.role)} replace />;
  }

  async function onSubmit(data) {
    setErrorMessage("");
    setSubmitting(true);
    try {
      await registerAccount({
        name: data.name,
        email: data.email,
        password: data.password,
        role: selectedRole,
      });
      const response = await login({
        email: data.email,
        password: data.password,
        role: selectedRole,
      });
      loginUser(response.token, response.user);
      navigate(homePath(response.user.role), { replace: true });
    } catch (err) {
      setErrorMessage(apiError(err, "Could not create the account."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <RoleSelector
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />

      <h2 className="mt-8 font-display text-3xl text-ink">Create an account</h2>
      <p className="mt-2 text-muted">
        {selectedRole === "recruiter"
          ? "Post roles for a company you own."
          : "Browse open roles and apply once."}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 flex flex-col gap-4">
        <Alert>{errorMessage}</Alert>

        <Field label="Name" htmlFor="name" error={errors.name?.message}>
          <input
            className={inputClass}
            {...register("name")}
            id="name"
            autoComplete="name"
            placeholder="Your name"
          />
        </Field>

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
          <input
            className={inputClass}
            {...register("password")}
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
          />
        </Field>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full bg-pine px-4 py-3 text-sm font-semibold text-white hover:bg-pine-dark disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-pine">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}

export default Register;
