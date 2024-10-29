// src/routes/sessionRoutes.js

import express from 'express';
import passport from 'passport';

const router = express.Router();

// Ruta GET para mostrar el formulario de inicio de sesión
router.get('/login', (req, res) => {
    res.render('login');
});

// Ruta POST para manejar el inicio de sesión
router.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true 
}));

// Ruta para cerrar sesión
router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

export default router;
