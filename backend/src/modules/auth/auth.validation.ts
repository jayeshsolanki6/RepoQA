import { z } from 'zod'

export const registerSchema = z.object({
    name : z.string().min(2, "Name must be at least 2 characters").max(80, "Name must be 80 characters or fewer"),
    email : z.email("Enter a valid email address"),
    password : z.string().min(8, "Password must be at least 8 characters").max(128, "Password must be 128 characters or fewer"),
})

export const loginSchema = z.object({
    email : z.email("Enter a valid email address"),
    password : z.string().min(8, "Password must be at least 8 characters")
})

export const refreshSchema = z.object({
    refreshToken : z.string().min(1, "Refresh token is required")
})

export const accessSchema = z.object({
    authorization : z
        .string("Authorization header is required")
        .refine((val) => val.startsWith("Bearer "), "Authorization header must use Bearer scheme")
})
