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
    stock: {  
        type: Number,
        required: true,
        min: 0,  
    },
    available: {
        type: Boolean,
        required: true,
        default: true,
    }
}, {
    timestamps: true,
});


const Product = mongoose.models.Product || model('Product', productSchema);

export default Product;
