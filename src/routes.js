import path from 'path';
import {fileURLToPath} from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getRoot(req, res) {}
import yargs  from "yargs";
import {fork} from 'child_process'
import cluster from "cluster";
import os from "os";
const  cpus = os.cpus();
import logger from './winstonconfig.js';
const yargsExecute = yargs(process.argv.slice(2))
const args = yargsExecute.alias({
    p:"puerto"
}).default({
    puerto: "8080"
}).argv;

function getLogin(req, res) {
  var user = {username: "Se omite login"};
    logger.info("user logueado");
    res.render("login-ok", {
      usuario: user.username
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

function getSignup(req, res) {
  res.sendFile(path.join(__dirname,"../views/signup.html"));
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
  req.logout();
  res.sendFile(path.join(__dirname,"../views/index.html"));
}

function failRoute(req, res) {
  const {url , method} = req
  logger.warn(`Ruta ${method}${url} no existe`)
  res.status(404).render("routing-error", {});
}

export default {
  getRoot,
  getLogin,
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
