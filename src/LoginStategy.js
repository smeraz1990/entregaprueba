import {Strategy as LocalStrategy}  from 'passport-local'
import logger from './winstonconfig.js';
import User from './models.js'
import Carrito from './modelsCarrito.js'
import bcrypt from 'bcrypt'

function hashPassword(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(10))
}

function isvalidpassword(reqPassword,dbPassword){
    return bcrypt.compareSync(reqPassword,dbPassword)
}

const registerStrategy = new LocalStrategy({passReqToCallback:true},
async (req,username,password,done)=>{
    //console.log("dato 1", username)
    //console.log("muestra datos", req.body)
const{nombre,direccion,edad,telefono} = req.body
    const {url , method, file} = req
    try{
        const existingUser = await User.findOne({username})
        if(existingUser)
        {
            return done(null,null)   
        }
        const newUser = {
            username,
            password: hashPassword(password),
            nombre,
            direccion,
            edad,
            telefono,
            avatar: `${file.path}`
        }

        //console.log("dato existente", newUser)

        const createdUser = await User.create(newUser)
        const newCarrito = {
            usuarioid: createdUser._id.toString(),
            productos: [],
        }
        const createCarrito = await Carrito.create(newCarrito)
        done(null,createdUser)
    } catch(error){
        logger.error(` Ruta ${method}${url} error al registrar usuario`)
        done(null,null)
    }
})

const loginStrategy = new LocalStrategy(async (username,password,done)=>{
    try{
        const user = await User.findOne({username})

        if(!user || !isvalidpassword(password,user.password)){
            return done(null)
        }

        done(null,user)

    }catch(error)
    {
        logger.error('server.js error login')
        done('Error login',null)
    }

})

export default {
    registerStrategy,
    loginStrategy,
    logger,
    User
}
    