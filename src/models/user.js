import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Definición del esquema de usuario
const userSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email: { 
        type: String, 
        unique: true, 
        required: true, 
        match: [/^\S+@\S+\.\S+$/, 'Invalid email address'] // Validación de formato de email
    },
    password: { 
        type: String, 
        required: true, 
        minlength: 6 // Validación de longitud mínima
    }
});

// Middleware pre-save para hashear la contraseña antes de guardarla
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try {
            this.password = await bcrypt.hash(this.password, 10);
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Método para comparar contraseñas (útil para autenticación)
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
