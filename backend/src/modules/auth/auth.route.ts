import { Router } from 'express'

import { authenticate } from '../../middleware/authenticate.js'
import { validate } from '../../middleware/validate.js'
import { register, login, refresh, logout } from './auth.controller.js'
import { accessSchema, loginSchema, refreshSchema, registerSchema } from './auth.validation.js';

const router = Router();

//Public route
router.post('/register', validate(registerSchema, "body"), register);
router.post('/login', validate(loginSchema, "body"), login);
router.get('/refresh', validate(refreshSchema, "cookies"), refresh);

// Protected route 
router.get('/logout', validate(accessSchema, "headers"), authenticate, logout);

export default router;