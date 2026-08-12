import { z } from 'zod'

export const registerSchema = z.object({
    name : z.string().min(2, "Name must be at least 2 characters"),
    email : z.email("Invalid email formet"),
    password : z.string().min(8, "Password must be at least 8 characters"),
})

export const loginSchema = z.object({
    email : z.email("Invalid email formet"),
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

// export type RegisterSchemaType = z.infer<typeof registerSchema>;
// export type LoginSchemaType = z.infer<typeof loginSchema>;
// export type RefreshSchemaType = z.infer<typeof refreshSchema>;