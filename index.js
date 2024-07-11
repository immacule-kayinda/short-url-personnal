// const articles = require("./data/db.json");
const express = require("express");
const app = express();
const ejs = require("ejs");
const fs = require("fs");
const PORT = process.env.PORT || 3000;
const passport = require("passport");
const LocalStategy = require("passport-local");
const path = require("path");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { check, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const session = require("express-session");
const SQLiteStore = require("connect-sqlite3")(session);
const PgSession = require('connect-pg-simple')(session);
const db = require('./db');
const pg = require('pg');


const pool = new pg.Pool({
  user: 'immacule.kayinda',
  host: 'localhost',
  database: 'shortlink',
  password: '',
  port: 5432,
});

// app.use(session({
//   store: new PgSession({
//     pool: pool,
//     tableName: 'sessions', // Nom de la table dans votre base de données pour stocker les sessions
//   }),
//   secret: 'votre_cle_secrete_session',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 1000 * 60 * 60 * 24 * 7, // Durée de vie de la session en millisecondes (1 semaine dans cet exemple)
//     httpOnly: true,
//     secure: false, // Réglez sur true si votre site utilise HTTPS
//   },
// }));

app.use(
  session({
    secret: "kadea academy",
    resave: false,
    saveUninitialized: false,
    store: new SQLiteStore({ db: "sessions.db", dir: "./var/db" }),
  })
);

app.use(passport.authenticate("session"));

function findUserIndex(id, arr) {
  return arr.findIndex((el) => el.id === id);
}
function verify(email, password, cb) {
  const user = users.find((user) => user.email === email);

  if (!user) {
    return cb(null, false, { message: "Incorrect email or password" });
  }

  bcrypt.compare(password, user.password, function (err, result) {
    if (err) {
      return cb(err);
    }
    if (result) {
      return cb(null, user);
    }
    return cb(null, false, { message: "Incorrect email" });
  });
}

function ensureLoggedin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/login");
}

function authenticate(req, res, next) {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(400).json({ error: info.message });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.redirect("/auth/profile");
    });
  })(req, res, next);
}



function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    next();
  } else {
    res.redirect("/login");
  }
}

const users = [];
const dataBase = [];
const ourLInk = `http://localhost:${PORT}/`;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.static(__dirname + "/public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", isAuthenticated, (req, res) => {
  const userLinks = dataBase.filter(
    (data) => data.userId === req.session.userId
  );
  console.log(
    dataBase.filter((data) => data.userId === req.session.userId),
    "userLinks",
    req.session.userId
  );
  res.render("index", { userId: req.session.userId, data: userLinks });
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((user) => user.username === username);
  console.log(typeof username, password);
  if (!user) {
    return res.status(401).send("Utilisateur non trouvé.");
  }

  // Vérifier le mot de passe
  if (user.password !== password) {
    return res.status(403).send("Mot de passe incorrect.");
  }
  req.session.userId = username;
  // Si l'utilisateur est trouvé et le mot de passe correspond, rediriger vers la page souhaitée
  res.redirect("/index");
});
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  const params = req.body;
  console.log("signup", req.body);
  console.log(req.body);
  if (users.some((user) => user.username === params.username)) {
    res.status(404).send("user already exists.");
  } else {
    req.session.userId = params.username;

    users.push(params);
    res.status(200).send("Utilisateur crée avec succes.");
  }
});

// Route de déconnexion
app.post("/logout", (req, res) => {
  // Supprime l'identifiant de session
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Logout failed");
    } else {
      res.clearCookie("sessionId");
      res.status(200).send("Logged out successfully");
    }
  });
});

app.get("/dashboard", isAuthenticated, (req, res) => {
  res.render("dashboard");
});

app.post(
  "/create-link",
  [
    check("destination")
      .not()
      .isEmpty()
      .escape()
      .withMessage("La destination est requise"),
    check("custom_back_half")
      .not()
      .isEmpty()
      .escape()
      .withMessage("Le back-half est requis"),

    async function ensureUniqueness(req, res, next) {
      const linkCreated = req.body;
      const existingDestination = dataBase.some(
        (dbLink) => dbLink.destination === linkCreated.destination
      );
      const existingBackHalf = dataBase.some(
        (dbLink) => dbLink.custom_back_half === linkCreated.custom_back_half
      );

      if (existingDestination || existingBackHalf) {
        return res
          .status(400)
          .send("La destination ou le back-half existe déjà.");
      }
      next();
    },
  ],
  async (req, res) => {
    const linkCreated = req.body;
    linkCreated.destination = req.body.destination.replace( /&#x2F;/g, "/");
    linkCreated.metrics = {};
    console.log(req.body);
    const id = uuidv4().split("-").at(-1);
    linkCreated.url = ourLInk + "redirect/" + id;
    linkCreated.userId = req.session.userId;
    console.log(linkCreated.qr);
    linkCreated.id = id;
    console.log(linkCreated)
    const existingDestination = dataBase.some(
      (dbLink) => dbLink.destination === linkCreated.destination
    );
    if (existingDestination) {
      dataBase.find(
        (dbLink) => dbLink.destination === linkCreated.destination
      ).isDeleted = false;
      return res.status(400).send("La destination existe déjà.");
    }

    const existingBackHalf = dataBase.some(
      (dbLink) => dbLink.custom_back_half === linkCreated.custom_back_half
    );
    if (existingBackHalf) {
      return res.status(400).send("Le back-half existe déjà.");
    }

    if (linkCreated.custom_back_half === "") {
      linkCreated.custom_back_half = id;
    } else {
      const el = dataBase.find(
        (element) => element.custom_back_half === linkCreated.custom_back_half
      );
      if (el) {
        return res.status(400).send("The back-half already exist");
      }
    }
    linkCreated.metrics.visited = 0;

    let qrString;
    try {
      qrString = await QRCode.toString(linkCreated.url, { type: "svg" });
      linkCreated.qr = qrString;
    } catch (err) {
      return res.status(500).send("Failed to generate QR code");
    }
    try {
      // add  link in the link table of the database that has this structure: id, url_shortened, base_url, qr_generated, is_deleted, visitors, id_user)
      const result = await db.query(`
      INSERT INTO public.links(
        url_shortened, base_url, qr_generated, is_deleted, visitors, id_user
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
    `, [linkCreated.url, linkCreated.base_url, linkCreated.qr, linkCreated.is_deleted, linkCreated.metrics.visited, linkCreated.userId]);    } catch (error) {
      
    }
    dataBase.push(linkCreated);
    res.status(200).send("Link created successfully");
  }
);

app.get("/download-qrcode/:id", async (req, res) => {
  const id = req.params.id;
  const link = dataBase.find((link) => link.id === id);

  if (!link) {
    return res.status(404).send("Link not found");
  }

  const url = ourLInk + id; // Construit l'URL à encoder dans le QR Code
  const fileName = "qr_" + id + ".png"; // Nom du fichier pour le QR Code

  try {
    // Générer le QR code en tant qu'image PNG et le sauvegarder dans un tampon
    const qrBuffer = await QRCode.toBuffer(url, { type: "png" });

    // Configurer les en-têtes de réponse pour le téléchargement
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Envoyer l'image au client
    res.send(qrBuffer);
  } catch (error) {
    console.error("Erreur lors de la génération du QR code:", error);
    res.status(500).send("Erreur lors de la génération du QR code.");
  }
});

app.get("/redirect/:backhalf", (req, res) => {
  const backHalf = req.params.backhalf;
  const link = dataBase.find((link) => link.id === backHalf);

  if (link && link.url !== "") {
    link.metrics.visited++;
    res.render("redirect", { link: link.destination });
  } else {
    res.status(404).render("404LinkNotFound");
  }
});

app.get("/redirect/:backhalf", isAuthenticated, (req, res) => {
  const backHalf = req.params.backhalf;
  const link = dataBase.find((link) => link.id === backHalf);
  res.status(200).send(link.metrics.visited);
});

app.delete("/delete-link/:id", isAuthenticated, (req, res) => {
  const id = req.body.id;
  const index = dataBase.findIndex((link) => link.id === id);
  if (index === -1) res.status(404).send("404");
  dataBase[index].isDeleted = true;
  res.status(200).send("ok");
});

app.get("/check-id/:id", (req, res) => {
  const id = req.params.id;
  console.log(link.url);
  const link = dataBase.find((link) => link.url === `${ourLInk}/${id}`);
  if (link) {
    res.render("link", { link });
  } else {
    res.status(404).render("404");
  }
});

app.get("/*", (req, res) => {
  res.status(200).render("404");
});

app.listen(PORT, () => {
  console.log(
    `Welcome to ${__dirname} we arte listening from http://localhost:${PORT}`
  );
});
