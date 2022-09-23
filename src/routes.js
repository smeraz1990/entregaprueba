import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getRoot(req, res) {}
import yargs  from "yargs";
import os from "os";
const  cpus = os.cpus();
import logger from './winstonconfig.js';
const yargsExecute = yargs(process.argv.slice(2))
const args = yargsExecute.alias({
    p:"puerto"
}).default({
    puerto: "8080"
}).argv;
import PrefInt from './prefijosInternacionales.js'
import Products from './modelsProductos.js'
import Carrito from './modelsCarrito.js'
let ProductosDB = []

/* function getLogin(req, res) {
  var user = {username: "Se omite login"};
    logger.info("user logueado");
    res.render("login-ok", {
      usuario: user.username
    });
  } */

function getLogin(req, res) {
  if (req.isAuthenticated()) {
    var user = req.user;
    console.log("user logueado");
    console.log("datos login",user._id.toString())
    res.render("login-ok", {
      usuario: user.username
    });
  } else {
    console.log("user NO logueado");
    res.sendFile(path.join(__dirname,"../views/login.html"));
  }
}

function getProfile(req, res) {
  console.log("datos login",req.user)
  let datosnuevos = req.user

  res.render("profile", datosnuevos );
}

async function getProductos(req, res) {
  const productosArray = []
  console.log(req.user)
  const productos = await Products.find().lean()
  for (let i = 0; i < productos.length; i++)
  {
    productosArray.push({
      id: productos[i]._id.toString(),
      name: productos[i].name,
      price: productos[i].price,
      thumbnail: productos[i].thumbnail
    })
  }
  console.log(productosArray)
  res.render("productosList", {ProductosDB:productosArray} );
}

async function getCarrito(req, res) {
  const productosArray = []
  console.log(req.user)
  const usuarioid = '632cc9bf33883f520c6092c5'

  const ProductosCarrito = await Carrito.find({ usuarioid: usuarioid},{ productos: 1, _id: 0 })  
  //console.log(ProductosCarrito[0].productos)
  res.render("productosCarrito", {ProductosDB:ProductosCarrito[0].productos} );
}

async function postProductos (req,res)
{
  const { name, price, thumbnail } = req.body
  const newProduct = new Products({
    name,
    price: Number(price),
    thumbnail,
 });

 await newProduct.save();
 res.redirect('/productos');
}

async function postProductosCarrito (req,res)
{
  //console.log(req.user)
  //const usuarioid = req.user._id.toString()
  const usuarioid = '632cc9bf33883f520c6092c5'
  const { ProductoId } = req.body
  //const ProductoExiste = await Carrito.find({ usuarioid: usuarioid, "productos.productoid": { $eq: ProductoId } }).lean()
  //const ProductoExiste = await Carrito.find({productos: {$elemMatch: {productoid:ProductoId}}})

  const ProductoExiste = await Carrito.find({ usuarioid: usuarioid})
  //console.log("Producto Existente", ProductoExiste[0].productos)

  const arrayProductos = ProductoExiste[0].productos?.filter(producto => {
      return producto.productoid === ProductoId
  })
  //console.log("Producto Existente unico", arrayProductos)

  if(arrayProductos.length == 0)
  {
      const productonew = await Products.findById(ProductoId)
      //console.log("producto nuevo para agregar", productonew)

        ProductoExiste[0].productos.push({
          productoid: productonew._id.toString(),
          name: productonew.name,
          price: productonew.price,
          qry: 1
        })
  }
  else{
      const indexDatos = ProductoExiste[0].productos.findIndex(object => {
          return object.productoid === ProductoId;
      });
      ProductoExiste[0].productos[indexDatos].qry = ProductoExiste[0].productos[indexDatos].qry + 1
  }

  //console.log("Nuevo carrito productos", ProductoExiste[0].productos)

  const UpdateProductosCarrito = await Carrito.updateOne({ usuarioid: usuarioid},{ $set: { productos : ProductoExiste[0].productos }})

//console.log(UpdateProductosCarrito)
}



function getRandoms(req, res) {
  let { cant } = req.query
  if (!cant) {
    cant = 100000000
  }

//const cant = 50
let NumerosRandom = []
    for(let i=1; i<=cant; i++)
    {
        let existeNumero = 0
        let NumeroGenerado = generateRandomNumber(1,1000)

        if(NumerosRandom.length == 0){
            NumerosRandom.push({
                random: NumeroGenerado,
                cantidad: 1
            })
        }

        else{
            existeNumero = NumerosRandom?.filter(numero => {
                return numero.random === NumeroGenerado
            })
            //console.log(existeNumero.length,":", NumeroGenerado)
            if(existeNumero.length == 0)
            {
                NumerosRandom.push({
                    random: NumeroGenerado,
                    cantidad: 1
                })
            }
            else{
                const indexDatos = NumerosRandom.findIndex(object => {
                    return object.random === NumeroGenerado;
                });
                NumerosRandom[indexDatos].cantidad = NumerosRandom[indexDatos].cantidad+1
            }
        }
    
    }   
    //res.send(`los catos randoms son: ${msg}`);
    res.render("randoms", {
      datosRandom: NumerosRandom
    });

    
}

function generateRandomNumber (min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/*Child process comentado para realizar la consigna 16 

function getRandoms(req, res) {
  let { cant } = req.query
  if (!cant) {
    cant = 100000000
  }
  const forked = fork('src/childRandom.js')
  forked.send(cant);
  forked.on("message", (msg) => {
    //res.send(`los catos randoms son: ${msg}`);
    res.render("randoms", {
      datosRandom: msg
    });
  }); 
  

    
}*/

//--------------------Agregado ruta info-------------->

//Titulo del proceso: ${process.title}

function getInfo(req, res) {
    //console.log("Aqui esta la info");
    //console.log(JSON.stringify(args).split(','))
    //console.log(JSON.stringify(process.memoryUsage()))
    res.render("Info", {
      argumentos: JSON.stringify(args).split(','),
      plataforma: process.platform,
      versionnode: process.version,
      memory: JSON.stringify(process.memoryUsage()).split(','),
      procesoid: process.pid,
      Carpeta: process.cwd(),
      CarpetaPath: process.execPath,
      NumeroPrecesarodes: cpus.length
    });
  // if (req.isAuthenticated()) {
  //   var user = req.user;
  //   console.log("user logueado");
  //   res.render("login-ok", {
  //     usuario: user.username
  //   });
  // } else {
  //   console.log("user NO logueado");
  //   res.sendFile(path.join(__dirname,"../views/login.html"));
  // }
}

async function getSignup (req, res) {
  const arrayPrefijos = await PrefInt.find().lean()
  //console.log(arrayPrefijos)
  res.render("signup", {arrayPrefijos});
}

function postLogin(req, res) {
  var user = req.user;

  res.sendFile(path.join(__dirname,"../views/index.html"));
}

function postSignup(req, res) {
  var user = req.user;

  res.sendFile(path.join(__dirname,"../views/index.html"));
}

function getFaillogin(req, res) {
  const {url , method} = req
  logger.error(`Ruta ${method}${url} error en login`);
  res.render("login-error", {});
}

function getFailsignup(req, res) {
  const {url , method} = req
  logger.error(`Ruta ${method}${url} error en signup`);
  res.render("signup-error", {});
}

function getLogout(req, res) {
  req.logout(function(err) {
    if (err) { return next(err); }
    //res.redirect('/');
    res.sendFile(path.join(__dirname,"../views/index.html"));
  });
}

function failRoute(req, res) {
  const {url , method} = req
  logger.warn(`Ruta ${method}${url} no existe`)
  res.status(404).render("routing-error", {});
}

export default {
  getRoot,
  getLogin,
  getProfile,
  getProductos,
  postProductos,
  postProductosCarrito,
  getCarrito,
  postLogin,
  getFaillogin,
  getLogout,
  failRoute,
  getSignup,
  postSignup,
  getFailsignup,
  getInfo,
  getRandoms
};
