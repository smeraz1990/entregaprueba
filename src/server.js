import express, { application } from 'express'
import session from "express-session"
import passport from 'passport';
import passportLocal from 'passport-local'
import router from '../routes/indexrouts.js';
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
import { schema, normalize } from 'normalizr';
import util from 'util';
import datosLogin from './LoginStategy.js'
//const routes = require("./routes");
import conectarDB from './controllersdb.js'
import routes from './routes.js'
import { engine } from 'express-handlebars';
import upload from './MulterConfig.js';


const yargsExecute = yargs(process.argv.slice(2))
const args = yargsExecute.alias({
    p:"puerto",    
}).default({
    puerto: "8080",
    iscluster: "fork"
}).argv;
app.use(compression())
fs.writeFileSync(`Messages/appMensajes.txt`,'')
app.use(express.static(path.join(__dirname, '../views')))
app.use(express.json());
app.use('/', router)
app.use(express.urlencoded({ extended: true }));
app.use(express.static('avatars'))
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

//Cambios para agregar cluster y fork
let servidor = ''
if (args.iscluster == "cluster" && cluster.isPrimary) {
    //console.log(`proceso principal ${process.pid}`)
    cpus.map(() => {
        cluster.fork();
    });
 } else {
     servidor = app.listen(process.env.PORT || 3000, () => { 
        datosLogin.logger.info(`Servidor conectado puerto info 3000 PID - ${process.pid}`)
    })
 }

const expressServer = servidor
const io = new Server(expressServer);
let ProductosDB = []
let messagesArray = []

function print(objeto)
{
    datosLogin.logger.info(util.inspect(objeto,false,12,true))
}

app.engine('hbs', engine({
    defaultLayout: path.join(__dirname, '../views/layouts/main.hbs'),
    layoutsDir: path.join(__dirname, '../views/layouts')}))
app.set('view engine', '.hbs');

//login
passport.use('register',datosLogin.registerStrategy)
passport.use('login',datosLogin.loginStrategy)

passport.serializeUser((user,done)=>{
    done(null,user._id)
})

passport.deserializeUser((id,done)=>{
    datosLogin.User.findById(id,done)
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
  "/register",upload.single('avatar'),
  passport.authenticate("register", { failureRedirect: "/failsignup" }),
  routes.postSignup
);

app.get("/profile", routes.getProfile);
app.get("/productos", routes.getProductos);
app.get("/carrito", routes.getCarrito);
app.post("/productos", routes.postProductos);
app.post("/productoscarrito", routes.postProductosCarrito);
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
  datosLogin.logger.info(user);
  res.send("<h1>Ruta OK!</h1>");
});

//  LOGOUT
app.get("/logout", routes.getLogout);

//  FAIL ROUTE
app.get("*", routes.failRoute);




conectarDB(config.database.dbUrl, (err) => {
  if (err) return datosLogin.logger.error("server.js error en conexión de base de datos", err);
  console.log("BASE DE DATOS CONECTADA");
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