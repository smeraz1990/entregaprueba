import mongoose from 'mongoose'
 
export default mongoose.model('Prefijopais',{
    codigo: String,
    pais: String
});
