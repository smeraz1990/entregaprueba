import mongoose from 'mongoose'
 
export default mongoose.model('Products',{
    name: String,
    price: String,
    thumbnail: String
});
