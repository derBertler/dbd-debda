const createError = require("http-errors");
const express = require("express");
const session = require("express-session");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const debug = require("debug")("dbd-debda:server");
const http = require("http");
const cors = require("cors");

require("dotenv").config();

const fs = require("fs");

require('fs').writeFileSync('/home/skyblock/dbd-turniere.de/startup-test.txt', 'app.js was loaded\n');

process.on("uncaughtException", (err) => {
  fs.appendFileSync("startup-error.log", `[uncaughtException]\n${err.stack}\n`);
  process.exit(1);
});

process.on("unhandledRejection", (err) => {
  fs.appendFileSync(
    "startup-error.log",
    `[unhandledRejection]\n${err.stack || err}\n`,
  );
  process.exit(1);
});

var app = express();
const publicPath = path.join(__dirname, "public");

app.locals.publicPath = publicPath;

// -- session stuff --
const MySQLStore = require("express-mysql-session")(session);

const sessionStore = new MySQLStore({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "dbdturniere",
  // optional settings:
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
  expiration: 1000 * 60 * 60 * 24 * 7, // 1 week
});

app.use(
  session({
    key: "dbdturniere.sid",
    secret: process.env.SESSION_SECRET || "your-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // true if HTTPS
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  }),
);

app.use((req, res, next) => {
  res.locals.isAdmin = req.session.isAdmin === true;
  if (req.session.user) {
    res.locals.user = {
      id: req.session.user.id,
      name: req.session.user.name,
      avatarUrl: req.session.user.avatarUrl || "/images/default_avatar.png",
    };
  } else {
    res.locals.user = null;
  }
  next();
});

// Call it like this if you need a parameter.
// var apiRouter = require('./src/routes/api')(publicPath);
var indexRouter = require("./src/routes/index")();
var authRouter = require("./src/routes/auth")();

var port = normalizePort(process.env.PORT || "3000");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");
app.set("port", port);

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(publicPath));

app.use("/api/auth", authRouter);
app.use("/", indexRouter);

app.use("/api", function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({
    message: "Something went wrong. Please try again.",
  });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "dev" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

if (require.main === module) {
  var server = http.createServer(app);

  fs.appendFileSync(
    "startup-error.log",
    `Starting app on PORT=${process.env.PORT}\n`,
  );

  server.listen(port, "127.0.0.1");
  server.on("error", onError);
  server.on("listening", onListening);
}

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
    default:
      throw error;
  }
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}

module.exports = app;
