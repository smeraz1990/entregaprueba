import mongoose from 'mongoose'
 
export default mongoose.model('Users',{
    username: String,
    password: String,
    nombre: String,
    direccion: String,
    edad: String,
    telefono: String,
    avatar: String
});
