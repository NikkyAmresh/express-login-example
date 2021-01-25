import { createRequire } from "module";
const require = createRequire(import.meta.url);
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;
import dbConnection from "./dbConnection.js";
import Seller from "./Model/Seller.js";
import { dbConfig } from "./dbConfig.js";
const bodyParser = require("body-parser");
const session = require("express-session");
const cookieParser = require("cookie-parser");
app.set("view engine", "pug");
app.use(bodyParser.json());
app.use(cookieParser());
app.use(
  session({
    secret: "theTopSecret",
    cookie: {
      maxAge: 3600 * 1000,
    },
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: true }));
const st = new dbConnection(dbConfig);

st.status()
  .then((res) => {
    console.log(res);
  })
  .catch((err) => {
    console.log(err);
  });

// const mysql = require("mysql");
// import {dbConfig} from './dbConfig.js';

// const con = mysql.createConnection(dbConfig);

// con.connect((err)=>{
//     if(err){
//         console.log(err);
//         console.log("error with connecting db")
//     }else{
//         console.log("connceted!")
//     }
// })

// async function getNews(){
//   return new Promise((res,rej)=>{
//     fetch('url')
//     .then((data)=>(data.json()))
//     .then((article)=>{
//       res(article)
//     })
//   });
// }

// app.get('/',async (req,res)=>{

//   let data = await getNews().catch((err)=>{
//     res.render('index',err);
//   });

//   res.render('index',data);
// })

// app.get('/m', function (req, res) {
//     res.render('index', { title: 'Hey', message: 'Hello there!' })
//   })

// app.get("/rest/default/V1/seller/:sellerId",function(req,res){
//     st.connection().query("select * from marketplace_seller where customer_id="+req.params.sellerId,(err,result)=>{
//         if(err){
//           console.log(err);
//             res.send("No seller found");
//         }else{
//             if(result.length){
//               let seller = new Seller(result[0]);
//               res.send(seller.seller);
//             }else{
//                 res.status(404).send("No seller found with "+req.params.sellerId);
//             }
//         }
//       });
// })

/**
 * @param {any} user
 */
async function login(user) {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM users WHERE email='${user.email}' AND password=md5('${user.password}')`;
    st.connection().query(sql, (err, result) => {
      // console.log(result);
      // console.log(err);
      if (err) {
        reject(2);
      } else {
        if (result.length == 0) {
          reject(0);
        } else {
          resolve(result[0]);
        }
      }
    });
  });
}

function generateToken() {
  let alphanum = "abcdefghijklmnopqrstuvwxyz1234567890";
  let token = "";
  while (token.length < 32) {
    let index = Math.floor(Math.random() * alphanum.length);
    token += alphanum[index];
  }
  return token;
}

/**
 * @param {BigInteger} userId
 * @param {String} [ip]
 */
async function createToken(userId, ip) {
  return new Promise((resolve, reject) => {
    let token = generateToken();
    let query = `SELECT token FROM userTokens WHERE token=md5('${token}')`;
    console.log(query + "0");
    st.connection().query(query, async (err, result) => {
      if (err) {
        reject("ERROR");
      }
      if (result.length == 0) {
        let expiry = "TIMESTAMPADD(HOUR, 7, TIMESTAMPADD(DAY, 10, CURDATE()))";
        query = `insert into userTokens (user_id,token,expiry,ip) values ('${userId}',md5('${token}'),${expiry},'${ip}')`;
        console.log(query);
        st.connection().query(query, async (err, result) => {
          if (err) {
            reject("ERROR");
          }
          if (result) {
            resolve(token);
          }
        });
      } else {
        let cT = await createToken(userId, ip);
        resolve(cT);
      }
    });
  });
}

/**
 * @param {String} token
 */
async function verifyToken(token) {
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM userTokens WHERE token=md5('${token}')`;
    console.log(query + "0");
    st.connection().query(query, async (err, result) => {
      if (err) {
        reject("ERROR1");
      }
      if (result.length == 0) {
        reject("ERROR2");
        if (err) {
          reject("ERROR3");
        }
      } else {
        resolve(result[0].user_id);
      }
    });
  });
}

app.get("/", function (req, res) {
  res.render("index", {
    title: "Home",
    user: req.session.isLoggedin ? req.session.loggedUser : "Guest",
    isLoggedIn: req.session.isLoggedin,
  });
});

app.get("/login", function (req, res) {
  if (req.session.isLoggedin) {
    res.redirect("/");
  } else {
    res.render("login");
  }
});

app.post("/loginPost", async (req, res) => {
  let result = await login(req.body).catch((err) => {
    res.send("Invalid Credentials");
  });
  if (result.name) {
    let token = await createToken(result.id, req.connection.remoteAddress);
    res.send(token);
  }
});

/**
 * @param {any} userId
 */
const getUser = async (userId) => {
  return new Promise((resolve, reject) => {
    let sql = `SELECT * FROM users WHERE id=${userId}`;
    st.connection().query(sql, (err, result) => {
      if (err) {
        reject(err);
      }
      if (result.length) {
        resolve(result[0]);
      } else {
        reject("No user found");
      }
    });
  });
};

app.get("/profile/me", async (req, res) => {
  let token = req.headers["authorization"];
  if (token.trim() != "") {
    token = token.split(" ")[1];
    let userId = await verifyToken(token).catch((err) => {
      res.status(401).send(err);
    });
    res.send("userId " + userId);
  } else {
    res.status(401).send("Invalid token");
  }
});

app.get("/profile", async (req, res) => {
  if (req.session.isLoggedin) {
    let userData = await getUser(req.session.loggedId).catch((err) =>
      console.log(err)
    );
    res.render("profile", { user: userData });
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", (req, res) => {
  req.session.isLoggedin = false;
  req.session.loggedUser = null;
  req.session.loggedId = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log("Running app at localhost:3000");
});

export default app;
