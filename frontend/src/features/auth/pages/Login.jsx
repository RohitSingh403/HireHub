import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import AuthLayout from "../components/AuthLayout";
import RoleSelector from "../components/RoleSelector";
import { zodResolver } from "@hookform/resolvers/zod";
import loginSchema from "../schemas/authSchema";
import login from "../services/authService";
import useAuthStore from "../../../store/authStore";
import api from "../../../utils/api";

function Login() {
  const [selectedRole, setSelectedRole] = useState("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const loginUser = useAuthStore((state) => state.login);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data) {
    const loginData = {
      ...data,
      role: selectedRole,
      rememberMe: rememberMe,
    };
    setErrorMessage("");
    try {
      const response = await login(loginData);

      console.log(response);

      loginUser(response.token, response.user);
      console.log("Before /me request");
      const triggerInterceptor = await api.get("/api/auth/me");
      console.log("After /me request", triggerInterceptor);
      console.log(triggerInterceptor);


      // console.log(isAuthenticated)
    } catch (err) {
      const message = err.response?.data?.msg ?? "Internal server error";
      console.log(message);
      setErrorMessage(message);
    }
  }

  useEffect(
    function () {
      console.log("Authentication status", isAuthenticated);
    },
    [isAuthenticated],
  );

  function onError(errors) {
    console.log(errors);
  }

  return (
    <AuthLayout>
      <RoleSelector
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />

      <h2 className=" text-2xl font-semibold text-slate-900 mt-5.5">
        Welcome back!
      </h2>

      <p className="mt-2 text-slate-500">
        Sign in to continue your job search.
      </p>

      <div>
        <form
          onSubmit={handleSubmit(onSubmit, onError)}
          className="flex flex-col pt-4"
        >
          {errorMessage && <p className="text-red-600">{errorMessage}</p>}

          <label className="text-2xl text-gray-700 mb-2" htmlFor="email">
            Email
          </label>

          <div className="w-full bg-blue-50 p-5  h-15 rounded-sm flex justify-center items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="25"
              height="25"
              viewBox="0 0 24 24"
            >
              <path d="M 4 4 C 2.895 4 2 4.895 2 6 L 2 18 C 2 19.105 2.895 20 4 20 L 20 20 C 21.105 20 22 19.105 22 18 L 22 6 C 22 4.895 21.105 4 20 4 L 4 4 z M 4 6 L 20 6 L 20 7.0019531 L 12 12 L 4 7.0019531 L 4 6 z M 4 9.0019531 L 12 14 L 20 9.0019531 L 20 18 L 4 18 L 4 9.0019531 z"></path>
            </svg>
            <input
              className="w-full p-2 text-xl"
              {...register("email")}
              id="email"
              type="email"
              placeholder="name@company.com"
            />
          </div>
          {errors.email && (
            <p className="text-red-600">{errors.email?.message}</p>
          )}
          <div className=" flex justify-between mb-2 mt-4.5">
            <label className="text-2xl text-gray-700 " htmlFor="password">
              Password
            </label>
            <button type="button" className="cursor-pointer text-lg">
              <span className="text-blue-500">Forgot password?</span>
            </button>
          </div>

          <div className="w-full bg-blue-50 p-5 h-15 rounded-sm flex justify-center items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              width="25"
              height="25"
              viewBox="0 0 32 32"
            >
              <path d="M 16 3 C 12.144531 3 9 6.144531 9 10 L 9 13 L 6 13 L 6 29 L 26 29 L 26 13 L 23 13 L 23 10 C 23 6.144531 19.855469 3 16 3 Z M 16 5 C 18.773438 5 21 7.226563 21 10 L 21 13 L 11 13 L 11 10 C 11 7.226563 13.226563 5 16 5 Z M 8 15 L 24 15 L 24 27 L 8 27 Z M 12 20 C 11.449219 20 11 20.449219 11 21 C 11 21.550781 11.449219 22 12 22 C 12.550781 22 13 21.550781 13 21 C 13 20.449219 12.550781 20 12 20 Z M 16 20 C 15.449219 20 15 20.449219 15 21 C 15 21.550781 15.449219 22 16 22 C 16.550781 22 17 21.550781 17 21 C 17 20.449219 16.550781 20 16 20 Z M 20 20 C 19.449219 20 19 20.449219 19 21 C 19 21.550781 19.449219 22 20 22 C 20.550781 22 21 21.550781 21 21 C 21 20.449219 20.550781 20 20 20 Z"></path>
            </svg>
            <input
              className="w-full p-2 text-xl"
              {...register("password")}
              autoComplete="password"
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              <svg
                className="cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
                x="0px"
                y="0px"
                width="25"
                height="25"
                viewBox="0 0 24 24"
              >
                <path d="M 12 4 C 4 4 1 12 1 12 C 1 12 4 20 12 20 C 20 20 23 12 23 12 C 23 12 20 4 12 4 z M 12 6 C 17.3 6 19.900781 10.3 20.800781 12 C 19.900781 13.7 17.3 18 12 18 C 6.7 18 4.0992188 13.7 3.1992188 12 C 4.0992188 10.3 6.8 6 12 6 z M 12 8 C 9.8 8 8 9.8 8 12 C 8 14.2 9.8 16 12 16 C 14.2 16 16 14.2 16 12 C 16 9.8 14.2 8 12 8 z M 12 10 C 13.1 10 14 10.9 14 12 C 14 13.1 13.1 14 12 14 C 10.9 14 10 13.1 10 12 C 10 10.9 10.9 10 12 10 z"></path>
              </svg>
            </button>
          </div>

          {errors.password && (
            <p className="text-red-600">{errors.password?.message}</p>
          )}

          <div className=" flex items-center mt-5 text-xl ">
            <input
              className="w-5 h-5"
              id="checkbox"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label className="font-light pl-3" htmlFor="checkbox">
              Remember this device for 30 days
            </label>
          </div>

          <button
            type="submit"
            className="text-white text-2xl cursor-pointer w-full bg-[#2663eb] p-5 mt-5 h-15 rounded-sm flex justify-center items-center"
          >
            Sign in
          </button>
        </form>
        <div className="flex items-center justify-center">
          <hr className="mt-5  w-100 text-gray-300" />
        </div>

        <div className="flex justify-center items-center pt-3 text-[18px] gap-2">
          <p>Don't have an account?</p>
          <button className="text-blue-800 cursor-pointer">
            Create account
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default Login;
