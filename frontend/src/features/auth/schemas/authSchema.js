import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, {
      error: "Email is required",
    })
    .z.email({
      error: "Please enter a valid email address",
    }),
  password: z
    .string()
    .min(1, {
      error: "Password is required",
    })
    .min(8, {
      error: "Password must be at least 8 characters",
    }),
});

export default loginSchema;
