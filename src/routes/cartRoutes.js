import { Router } from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Ticket from '../models/Ticket.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Middleware para verificar la autenticación del usuario
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ message: 'No estás autorizado' });
};

// Ruta para obtener un carrito por su ID
router.get('/:cartId', isAuthenticated, async (req, res) => {
    const { cartId } = req.params;

    try {
        // Buscar el carrito por ID y poblar los productos
        const cart = await Cart.findById(cartId).populate('products.product');
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        // Devolver el carrito como JSON
        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al obtener el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para crear un nuevo carrito
router.post('/', isAuthenticated, async (req, res) => {
    const userId = req.user._id;

    try {
        // Verificar si el usuario ya tiene un carrito
        const existingCart = await Cart.findOne({ user: userId });
        if (existingCart) {
            return res.status(400).json({ message: 'El carrito ya existe para este usuario' });
        }

        // Crear un nuevo carrito
        const newCart = new Cart({
            user: userId,
            products: []
        });

        await newCart.save();
        res.status(201).json({ message: 'Carrito creado con éxito', cart: newCart });
    } catch (error) {
        console.error('Error al crear el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Ruta para agregar un producto al carrito
router.post('/:cartId/products', isAuthenticated, async (req, res) => {
    const { cartId } = req.params;
    const { productId, quantity } = req.body;

    try {
        // Buscar el carrito por ID
        const cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        // Verificar si el producto existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Verificar si el producto ya está en el carrito
        const existingProduct = cart.products.find(item => item.product.toString() === productId);

        if (existingProduct) {
            // Si el producto ya existe, actualizar la cantidad
            existingProduct.quantity += quantity;
        } else {
            // Si no existe, agregarlo al carrito
            cart.products.push({ product: productId, quantity });
        }

        await cart.save();
        res.status(200).json({ message: 'Producto agregado al carrito', cart });
    } catch (error) {
        console.error('Error al agregar producto al carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Función para finalizar la compra
const purchaseCart = async (req, res) => {
    const { cartId } = req.params;
    const userId = req.user._id;

    try {
        // Buscar el carrito por ID y poblar los productos
        const cart = await Cart.findById(cartId).populate('products.product');

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado' });
        }

        console.log('Carrito poblado:', cart);

        let totalAmount = 0;
        const productsUnavailable = [];

        for (let item of cart.products) {
            const product = item.product;

            if (!product) {
                console.error('Producto no encontrado:', item);
                continue;
            }

            console.log(`Verificando stock del producto: ${product.name}`); // Asegúrate de que `product` no sea undefined
            console.log(`Stock actual: ${product.available ? 'Disponible' : 'No disponible'}, Cantidad solicitada: ${item.quantity}`);
            

            // Verificar el stock y descontar si es suficiente
            if (product.stock >= item.quantity) {
                totalAmount += product.price * item.quantity;
                product.stock -= item.quantity; // Reducir el stock
                await product.save(); // Guardar el producto actualizado
            } else {
                productsUnavailable.push({
                    id: product._id,
                    requestedQuantity: item.quantity,
                    availableStock: product.stock
                });
            }
        }

        // Si hay productos no disponibles, enviar un mensaje
        if (productsUnavailable.length > 0) {
            return res.status(400).json({
                message: 'Algunos productos no están disponibles',
                productsUnavailable
            });
        }

        // Si se puede completar la compra
        if (totalAmount > 0) {
            const ticket = new Ticket({
                code: uuidv4(),
                purchase_datetime: new Date(),
                amount: totalAmount,
                purchaser: req.user.email
            });
            await ticket.save();

            // Vaciar el carrito después de la compra
            cart.products = [];
            await cart.save();

            return res.status(200).json({
                message: 'Compra realizada con éxito',
                ticket
            });
        } else {
            return res.status(400).json({ message: 'No hay productos disponibles para completar la compra' });
        }

    } catch (error) {
        console.error('Error al procesar la compra:', error);
        res.status(500).json({ message: 'Error al procesar la compra' });
    }
};

// Ruta para finalizar la compra
router.post('/:cartId/purchase', isAuthenticated, purchaseCart);

export default router;
