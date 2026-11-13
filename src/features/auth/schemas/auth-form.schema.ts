import { z } from "zod";
import { mobilePattern, normalizeMobile } from "@/lib/validation/formats";

export const loginFormSchema = z.object({
  orgId: z
    .string()
    .trim()
    .regex(/^\d{1,3}$/)
    .refine((value) => Number(value) >= 1 && Number(value) <= 127),
  username: z.string().trim().min(1).max(100),
  password: z.string().min(1).max(100),
});

export const forgotPasswordFormSchema = z.object({
  identifier: z.string().trim().min(3).max(100),
});

export const registerFormSchema = z
  .object({
    fullName: z.string().trim().min(1).max(100),
    empId: z.string().trim().min(1).max(50),
    mobile: z
      .string()
      .trim()
      .transform(normalizeMobile)
      .refine((value) => mobilePattern.test(value)),
    email: z.string().trim().email().max(100),
    designation: z.string().trim().min(1),
    branch: z.string().trim().min(1),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
    accepted: z.literal(true),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
  });
