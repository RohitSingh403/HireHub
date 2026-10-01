import { z } from "zod";

const emailField = z
  .string()
  .min(1, { error: "Email is required" })
  .pipe(z.email({ error: "Please enter a valid email address" }));

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, { error: "Password is required" }),
});

const registerSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  email: emailField,
  password: z.string().min(8, { error: "Use at least 8 characters" }),
});

export { loginSchema, registerSchema };
