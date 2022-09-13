import express, { application } from 'express'
import bcrypt from 'bcrypt'
import session from "express-session"
import passport from 'passport';
import passportLocal from 'passport-local'
import router from '../routes/indexrouts.js';
import hbs from 'express-handlebars'
import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from "fs"
import { Server } from "socket.io";
import config from './config.js';
import yargs  from "yargs" ;
import cluster from "cluster";
import os from "os";
const app = express()
const  cpus = os.cpus();
import compression from 'compression'
import logger from './winstonconfig.js';

//--------------------------------Agregado para variables------------------->
const yargsExecute = yargs(process.argv.slice(2))
const args = yargsExecute.alias({
    p:"puerto",    
}).default({
    puerto: "8080",
    iscluster: "fork"
}).argv;
app.use(compression())

//console.log('variables args',args)
//console.log('Variables env',config)
//--------------------------------Fin variables------------------->

//Cambios para agregar cluster y fork

let servidor = ''
if (args.iscluster == "cluster" && cluster.isPrimary) {
    //console.log(`proceso principal ${process.pid}`)
    cpus.map(() => {
        cluster.fork();
    });
 } else {
     servidor = app.listen(args.puerto || 3000, () => { 
        logger.info(`Servidor conectado puerto info ${args.puerto} PID - ${process.pid}`)
    })
 }

const expressServer = servidor

const io = new Server(expressServer);
import { schema, normalize } from 'normalizr';
import util from 'util';
import {Strategy as LocalStrategy}  from 'passport-local'
//const routes = require("./routes");
import conectarDB from './controllersdb.js'
import User from './models.js'
import routes from './routes.js'
import { engine } from 'express-handlebars';
import { url } from 'inspector';



function print(objeto)
{
    logger.info(util.inspect(objeto,false,12,true))
}

function hashPassword(password){
    return bcrypt.hashSync(password,bcrypt.genSaltSync(10))
}

function isvalidpassword(reqPassword,dbPassword){
    return bcrypt.compareSync(reqPassword,dbPassword)
}


app.engine('hbs', engine({
    defaultLayout: path.join(__dirname, '../views/layouts/main.hbs'),
    layoutsDir: path.join(__dirname, '../views/layouts')}))
app.set('view engine', '.hbs');






let ProductosDB = []
let messagesArray = []
fs.writeFileSync(`Messages/appMensajes.txt`,'')
app.use(express.static(path.join(__dirname, '../views')))
app.use(express.json());
app.use('/', router)
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: config.api.apisecret,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie:{
        httpOnly:false,
        secure: false,
        maxAge: config.api.tiemposession,
    }
}))

app.use(passport.initialize());
app.use(passport.session());

const registerStrategy = new LocalStrategy({passReqToCallback:true},
    async (req,username,password,done)=>{
        const {url , method} = req
        try{
        const existingUser = await User.findOne({username})
        if(existingUser)
        {
            return done(null,null)   
        }

        const newUser = {
            username,
            password: hashPassword(password)
        }

        const createdUser = await User.create(newUser)
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

    passport.use('register',registerStrategy)
    passport.use('login',loginStrategy)

    passport.serializeUser((user,done)=>{
        done(null,user._id)
    })

    passport.deserializeUser((id,done)=>{
        User.findById(id,done)
    })


    app.get("/", routes.getRoot);

//------------------------------Agregado para ruta info--------->
app.get("/info", routes.getInfo);

app.get("/api/randoms", routes.getRandoms);


//  LOGIN
app.get("/login", routes.getLogin);
app.post(
  "/login",
  passport.authenticate("login", { failureRedirect: "/faillogin" }),
  routes.postLogin
);
app.get("/faillogin", routes.getFaillogin);

//  REGISTER
app.get("/register", routes.getSignup);
app.post(
  "/register",
  passport.authenticate("register", { failureRedirect: "/failsignup" }),
  routes.postSignup
);
app.get("/failsignup", routes.getFailsignup);

function checkAuthentication(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.get("/ruta-protegida", checkAuthentication, (req, res) => {
  const { user } = req;
  logger.info(user);
  res.send("<h1>Ruta OK!</h1>");
});

//  LOGOUT

app.get("/logout", routes.getLogout);

//  FAIL ROUTE
app.get("*", routes.failRoute);




conectarDB(config.database.dbUrl, (err) => {
  if (err) return logger.error("server.js error en conexión de base de datos", err);
  //console.log("BASE DE DATOS CONECTADA");
})



io.on('connection', async socket => {
    //console.log(`Nuevo usuario conectado ${socket.id}`)
    socket.on('client:product', async productInfo => {
        ProductosDB= productInfo
        //ProductosDB = await qryRead.ReadProductos()
        io.emit('server:productos', ProductosDB)
            //console.log('si llegue primero', ProductosDB)
    })
    socket.emit('server:productos', ProductosDB)
        //Socket Mensajes
    socket.emit('server:mensajes', messagesArray)
    socket.on('client:menssage', async messageInfo => {
        let MensajesExistentesFile = await fs.promises.readFile(`Messages/appMensajes.txt`)
        
        if(MensajesExistentesFile != '')
        {
            messagesArray = JSON.parse(MensajesExistentesFile)
        }
        messageInfo.id = messagesArray.length+1
        messagesArray.push(messageInfo)
        
        await fs.promises.writeFile(`Messages/appMensajes.txt`,JSON.stringify(messagesArray))
        //await qryInsert.InsertMensajes(messageInfo)
        //messagesArray = await qryRead.ReadMensajes()
        //normalizar para enviar al front
        const author = new schema.Entity('author',{},{idAtrribute:'id'})
        const mensaje = new schema.Entity('mensaje',{author: author},{idAtrribute:"id"})
        const schemamensajes = new schema.Entity('mensajes',{
            mensajes:[mensaje]
        },{idAtrribute:"id"})

        const nomalizePost = normalize({id:'mensajes',mensajes:messagesArray},schemamensajes)
        //console.log(messagesArray)
        //print(nomalizePost)
        io.emit('server:mensajes', nomalizePost)
            //console.log(messageInfo)
    })
})