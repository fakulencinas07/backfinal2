import express from 'express';
import mongoose from 'mongoose';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import flash from 'connect-flash';
import { engine } from 'express-handlebars';
import User from './models/user.js'; 
import Cart from './models/Cart.js'; 

import userRoutes from './routes/userRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

import { MONGO_URI, PORT } from './config/config.js';
import './config/passportConfig.js';
import { isAdmin, isUser } from './middleware/authMiddleware.js'; 

dotenv.config();

const app = express();

// Configuración de Handlebars
app.engine('handlebars', engine({
    extname: '.handlebars',
    defaultLayout: 'main',
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true,
    }
}));
app.set('view engine', 'handlebars');
app.set('views', './src/views');  

// Middleware para parsear solicitudes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la sesión
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' ? true : false } 
}));

// Middleware de Passport
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());

// Configuración de flash
app.use(flash());

// Middleware para mensajes flash
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});


app.get('/', async (req, res) => {
    let cart = null;
    if (req.user) {
        
        cart = await Cart.findOne({ user: req.user._id }).populate('products.product');
    }
    res.render('home', { user: req.user, cart }); 
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/login', (req, res) => {
    res.render('login');
});

// Manejo del registro de usuario
app.post('/register', async (req, res) => {
    const { first_name, last_name, email, password } = req.body;

    try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'El usuario ya existe');
            return res.redirect('/register');
        }

        // Crear un nuevo usuario
        const newUser = new User({
            first_name,
            last_name,
            email,
            password 
        });

        await newUser.save();
        req.flash('success', 'Usuario registrado con éxito');
        res.redirect('/login');
    } catch (error) {
        console.error('Error al registrar el nuevo usuario:', error);
        req.flash('error', 'Error interno del servidor');
        res.redirect('/register');
    }
});

// Manejo del inicio de sesión
app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true 
}));

// Usar las rutas API
app.use('/api/users', userRoutes);
app.use('/api/products', isAdmin, productRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/sessions', sessionRoutes);

// Función para conectar a MongoDB
const connectToDB = async () => {
    try {
        await mongoose.connect(MONGO_URI,);
        console.log('Conectado a MongoDB');
    } catch (err) {
        console.error('Error al conectar a MongoDB', err);
    }
};

// Iniciar la conexión a la base de datos y al servidor
connectToDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
});
