import mongoose from 'mongoose'
 
export default mongoose.model('Carrito',{
    usuarioid: String,
    productos: Array
});
