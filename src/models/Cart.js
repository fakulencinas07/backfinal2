import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// Esquema para un producto dentro del carrito
const productSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product', 
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1 
    }
}, { _id: false }); 

// Esquema para el carrito
const cartSchema = new Schema({
    user: { 
        type: Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    products: [productSchema], 
}, {
    timestamps: true 
});

// Crear el modelo del carrito y exportarlo
const Cart = model('Cart', cartSchema);



export default Cart;
