import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const productSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    category: {
        type: String,
        required: true,
        trim: true,
    },
    stock: {  // Agregado el campo de stock
        type: Number,
        required: true,
        min: 0,  // Asegúrate de que no pueda ser negativo
    },
    available: {
        type: Boolean,
        required: true,
        default: true,
    }
}, {
    timestamps: true,
});

// Evitar sobrescribir el modelo si ya existe
const Product = mongoose.models.Product || model('Product', productSchema);

export default Product;
