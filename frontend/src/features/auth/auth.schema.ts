import { z } from 'zod';

/* Messages mirror backend/src/modules/auth/auth.validation.ts so the client and
   the server never disagree about why a form was rejected. */

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const RegisterSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(80, 'Name must be 80 characters or fewer'),
    email: z.string().email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must be 128 characters or fewer'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });
