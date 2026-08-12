import { LoginInput, RefreshTokenPayload, RegisterInput } from './auth.types.js'
import { createUser, deleteRefreshToken, getRefreshTokenByUserId, getUserByEmail, getUserById, saveRefreshToken } from './auth.repository.js'
import { ApiError } from '../../utils/ApiError.js';
import { hashPassword, comparePassword } from '../../utils/bcrypt.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';


export const auth = {
    register : async (body : RegisterInput) => {
        const { name, email, password } = body;
        const user = await getUserByEmail(email);
        
        if(user){
            throw new ApiError(400, "Email already exist")
        }

        const hashedPasswoed = await hashPassword(password);
        const newUser = await createUser(name, email, hashedPasswoed);
        const accessToken = generateAccessToken(newUser.id);
        const refreshToken = generateRefreshToken(newUser.id);
        const hashedRefreshToken = await hashPassword(refreshToken);

        const expiresAt = new Date(
            Date.now() + 7*24*60*60*1000
        );

        await saveRefreshToken(newUser.id, hashedRefreshToken, expiresAt);

        return {
            newUser,
            accessToken,
            refreshToken
        }
    },

    login : async (body : LoginInput)=>{
        const { email, password } = body;

        const user = await getUserByEmail(email);

        if(!user){
            throw new ApiError(400, "Invalid email or password");
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if(!isPasswordValid){
            throw new ApiError(400, "Invalid email or password");
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        const hashedRefreshToken = await hashPassword(refreshToken);

        const expiresAt = new Date(
            Date.now() + 7*24*60*60*1000
        );

        await saveRefreshToken(user.id, hashedRefreshToken, expiresAt);

        return {
            user,
            accessToken,
            refreshToken
        }
    },

    refresh : async (token : string) => {
        const payload = await verifyRefreshToken(token) as RefreshTokenPayload;
        const userId = payload.userId;
        const user = await getUserById(userId);

        if(!user){
            throw new ApiError(401, "Invalid refresh token");
        }

        const storedRefreshToken = await getRefreshTokenByUserId(userId);

        if(!storedRefreshToken){
            throw new ApiError(401, "Invalid refresh token");
        }

        const isRefreshTokenValid = await comparePassword(token, storedRefreshToken.hashedToken);

        if(!isRefreshTokenValid){
            throw new ApiError(401, "Invalid refresh token");
        }
        if (storedRefreshToken.expiresAt < new Date()) {
            await deleteRefreshToken(userId);
            throw new ApiError(401, "Refresh token expired, please log in again");
        }

        const accessToken = generateAccessToken(user.id);
        const refreshToken = generateRefreshToken(user.id);
        const hashedRefreshToken = await hashPassword(refreshToken);

        const expiresAt = new Date(
            Date.now() + 7*24*60*60*1000
        )

        await saveRefreshToken(user.id, hashedRefreshToken, expiresAt);

        return {
            user,
            accessToken,
            refreshToken
        }    
    },

    logout : async (userId : string)=>{
        await deleteRefreshToken(userId);
        return true;
    }
}