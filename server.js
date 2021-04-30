const express = require("express");
const { pool } = require("./dbConfig");
const bcrypt = require("bcrypt");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
require("dotenv").config();
const app = express();
const cors = require("cors")

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'prayforchulatinder@gmail.com',
    pass: 'chulatinder'
  }
});

const PORT = process.env.PORT || 3000;

const initializePassport = require("./passportConfig");
app.use(cors());


initializePassport(passport);

// Middleware

// Parses details from a form
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(
  session({
    // Key we want to keep secret which will encrypt all of our information
    secret: process.env.SESSION_SECRET,
    // Should we resave our session variables if nothing has changes which we dont
    resave: false,
    // Save empty value if there is no vaue which we do not want to do
    saveUninitialized: false
  })
);
// Funtion inside passport which initializes passport
app.use(passport.initialize());
// Store our variables to be persisted across the whole session. Works with app.use(Session) above
app.use(passport.session());
app.use(flash());

app.get("/", (req, res) => {
  res.render("index.ejs");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
  res.render("register.ejs");

});

// app.get("/users/login", checkAuthenticated, (req, res) => {
app.get("/users/login", checkAuthenticated, (req, res) => {
  // flash sets a messages variable. passport sets the error message
  // console.log(req.session.flash.error);
  res.render("login.ejs");
});

app.get("/users/forgotPassword", checkAuthenticated, (req, res) => {
  res.render("forgotPassword.ejs");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
  console.log(req.isAuthenticated());
  res.render("dashboard.ejs", { user: req.user.name });
});

app.get("/users/location", checkNotAuthenticated, (req, res) => {
  // console.log(req.isAuthenticated());
  let locationID = req.body;
  pool.query(
    `SELECT * FROM public."workspace"
      WHERE $1 = workspaceID`,
      [locationID],
      (err, results) => {
        if (err) {
          throw err;
        }
          console.log("reaches here");
          console.log(results);
          for(x = 0; x < results.rowCount; x++){
            console.log(x);
            var result = Object.values(results.rows[x]);
            str = str+result[0]+','+result[1]+','+result[2]+','+result[3]+','+result[4]+','+result[5]+','+result[6]+'|\n';
          }
          res.render("location.ejs", { name: results.wsname, des: results.ws_des, lat: results.ws_lat, long: results.ws_long, seat : result.totalseat, outlet: results.poweroutlet, wifi: results.wifi  });
      }
  )
});

app.get("/users/home", checkNotAuthenticated, (req, res) => {
  // var str = '';
  pool.query(
  `SELECT * FROM public."workspace"`,
    (err, results) => {
      if (err) {
        throw err;
      }
      // for(x = 0; x < results.rowCount; x++){
      //   console.log(x);
      //   var result = Object.values(results.rows[x]);
      //   str = str+result[0]+','+result[1]+','+result[2]+','+result[3]+','+result[4]+','+result[5]+','+result[6]+'|\n';
      // }
      res.render('home.ejs', {location : results.rows, count : results.rowCount});
    }
  )
});

app.get("/users/favorite", checkNotAuthenticated, (req, res) => {
  // var str = '';
  let wsID = new Array();
  pool.query(
  `SELECT * FROM public."favorite"
    WHERE email = $1`,
    [req.user.email],
    (err, results) => {
      if (err) {
        throw err;
      }
      for(i = 0; i < results.rowCount; i++){
        console.log(i);
        var result = Object.values(results.rows[i]);
        wsID.push (result[1]);
      }
      console.log(wsID);

      for(z = 0; z < wsID.length; z++){
        pool.query(
        `SELECT * FROM public."workspace"
          WHERE workspaceid = $1`,
          [wsID[z]],
          (err, results) => {
            if (err) {
              throw err;
            }
            // for(x = 0; x < results.rowCount; x++){
            //   console.log(x);
            //   var result = Object.values(results.rows[x]);
            //   str = str + '\n'+result[0]+','+result[1]+','+result[2]+','+result[3]+','+result[4]+','+result[5]+','+result[6]+'\n'+'|';
            // }
            // console.log(str);
            res.render('favorite.ejs', {location : results.rows});
          }
        )
      }
    }
  )
});

app.get("/users/profile", checkNotAuthenticated, (req, res) => {
  // console.log(req.isAuthenticated());
  res.render("profile.ejs", { user: req.user.uname, email: req.user.email });
});

app.get("/users/profileManage/changeEmail", checkNotAuthenticated, (req, res) => {
  // console.log(req.isAuthenticated());
  res.render("profileManage/changeEmail.ejs");
});

app.get("/users/profileManage/changePassword", (req, res) => {
  // console.log(req.isAuthenticated());
  let str = '/users/profileManage/changePassword?email='+req.user.email;
  console.log(str);
  res.render(str);
});

app.get("/users/profileManage/changeUsername", checkNotAuthenticated, (req, res) => {
  // console.log(req.isAuthenticated());
  res.render("profileManage/changeUsername.ejs");
});

app.get("/users/profileManage/changetype", checkNotAuthenticated, (req, res) => {
  // console.log(req.isAuthenticated());
  res.render("profileManage/changeType.ejs");
});

app.get("/users/profileManage/deleteUser", checkNotAuthenticated, (req, res) => {
  // console.log(req.isAuthenticated());
  res.render("profileManage/deleteUser.ejs");
});

app.get("/users/logout", (req, res) => {
  req.logout();
  res.render("index", { message: "You have logged out successfully" });
});

app.post("/users/home", async (req, res) => {
  let { heart } = req.body;

  console.log({
    email
  });
  pool.query(
    `INSERT INTO public."favorite" (email, workspaceid)
      VALUES ($1, $2)`,
    [email, heart],
    (err, results) => {
      if (err) {
        throw err;
      }
        console.log("reaches here");
        console.log(results);
        req.flash("success_msg", "Your favorite place has been updated!");
    }
  );
});

app.post("/users/forgotPassword", async (req, res) => {
  let { email } = req.body;
  let errors = [];
  console.log({
    email
  });
  if (!email) {
    errors.push({ message: "Please enter your email"});
  }

  if (errors.length > 0) {
    res.render("forgotPassword.ejs", { errors, email});
  }
  else{
      // Validation passed
      transporter.sendMail({from:"prayforchulatinder@gmail.com",
                            to: email,
                            subject:"Findspace Password reset",
                            html: `<h1>Click the link below you stupid</h1><a href="http://localhost:3000/users/profileManage/changePassword?email=${email}">LINK</a>`
                          }, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
          res.redirect("/users/login");
        }
      });
  }
});

app.post("/users/profileManage/changePassword", async (req, res) => {
  let { password, password2 } = req.body;
  let email = req.params.email;

  let errors = [];
  console.log({
    password,
    password2
  });

  if (!password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("profileManage/changePassword.ejs", { errors, password, password2 });
  } 
  else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed

    pool.query(
      `UPDATE public."user"
        SET pwd = $1
        WHERE email = $2`,
      [hashedPassword, email],
      (err, results) => {
        if (err) {
          throw err;
        }
          console.log("reaches here");
          console.log(results);
          req.flash("success_msg", "Your password has been updated!");
          res.redirect("/users/profile");
      }
    );
  }
});

app.post("/users/profileManage/changePassword/:email", async (req, res) => {
  let { password, password2 } = req.body;

  let errors = [];
  let email = req.params.email;
  console.log('cat'+email);
  console.log({
    password,
    password2
  });

  if (!password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("profileManage/changePassword.ejs", { errors, password, password2 });
  } 
  else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed

    pool.query(
      `UPDATE public."user"
        SET pwd = $1
        WHERE email = $2`,
      [hashedPassword, email],
      (err, results) => {
        if (err) {
          throw err;
        }
          console.log("reaches here");
          console.log(results);
          req.flash("success_msg", "Your password has been updated!");
          res.redirect("/users/profile");
      }
    );
  }
});

app.post("/users/profileManage/changeUsername", async (req, res) => {
  let { name } = req.body;

  let errors = [];
  let email = req.user.email;
  console.log({
    name
  });

  if (!name) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.render("profileManage/changeUsername.ejs", { errors, name });
  } 
  else {
    // Validation passed
    pool.query(
      `UPDATE public."user"
        SET uname = $1
        WHERE email = $2`,
      [name, email],
      (err, results) => {
        if (err) {
          throw err;
        }
          console.log("reaches here");
          console.log(results);
          req.flash("success_msg", "Your username has been updated!");
          res.redirect("/users/profile");
      }
    );
  }
});

app.post("/users/profileManage/changeEmail", async (req, res) => {
  let { newEmail } = req.body;

  let errors = [];
  let email = req.user.email;
  console.log({
    newEmail
  });

  if (!newEmail) {
    errors.push({ message: "Please enter all fields" });
  }

  if (errors.length > 0) {
    res.render("profileManage/changeEmail.ejs", { errors, email });
  } 
  else {
    // Validation passed
    pool.query(
      `SELECT * FROM public."user"
        WHERE email = $1`,
      [newEmail],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          console.log("Email already registered");
          return res.render("profileManage/changeEmail", {
            message: "Email already registered"
          });
        } else {
          let temp = email;
          req.logout();
          pool.query(
            `UPDATE public."user"
              SET email = $1
              WHERE email = $2`,
            [newEmail, temp],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log("reaches here");
              console.log(results);
              req.flash("success_msg", "Your email has been updated!");
              res.render("index");
            }
          );
        }
      }
    );
  }
});
app.post("/users/profileManage/changeType", async (req, res) => {
  let { type } = req.body;

  let email = req.user.email;
  console.log({
    type
  });
    pool.query(
      `UPDATE public."user"
        SET utype = $1
        WHERE email = $2`,
      [type, email],
      (err, results) => {
        if (err) {
          throw err;
        }
        console.log("reaches here");
        console.log(results);
        req.flash("success_msg", "Your type has been updated!");
        res.redirect("/users/profile");
      }
    );
});

app.post("/users/profileManage/deleteUser", async (req, res) => {
  let { email }= req.body;

  let errors = [];
  console.log({
    email
  });
  if (!email) {
    errors.push({ message: "Please enter email" });
  }

  if (email != req.user.email) {
    errors.push({ message: "Please enter the correct email" });
  }

  if (errors.length > 0) {
    res.render("profileManage/deleteUser.ejs", { errors, password});
  } 
  else {
    req.logout();
    pool.query(
      `DELETE FROM public."user"
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          throw err;
        }
          console.log("reaches here");
          console.log(results);
          req.flash("success_msg", "Your account has been succesfully deleted.");
          res.render("index");
      }
    );
  }
});

app.post("/users/register", async (req, res) => {
  let { name, email, password, password2 } = req.body;

  let errors = [];

  console.log({
    name,
    email,
    password,
    password2
  });

  if (!name || !email || !password || !password2) {
    errors.push({ message: "Please enter all fields" });
  }

  if (password.length < 6) {
    errors.push({ message: "Password must be a least 6 characters long" });
  }

  if (password !== password2) {
    errors.push({ message: "Passwords do not match" });
  }

  if (errors.length > 0) {
    res.render("register", { errors, name, email, password, password2 });
  } else {
    hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);
    // Validation passed
    pool.query(
      `SELECT * FROM public."user"
        WHERE email = $1`,
      [email],
      (err, results) => {
        if (err) {
          console.log(err);
        }
        console.log(results.rows);

        if (results.rows.length > 0) {
          return res.render("register", {
            message: "Email already registered"
          });
        } else {
          pool.query(
            `INSERT INTO public."user" (uname, email, pwd, utype)
                VALUES ($1, $2, $3, $4)
                RETURNING email, pwd`,
            [name, email, hashedPassword, 'user'],
            (err, results) => {
              if (err) {
                throw err;
              }
              console.log("reaches here");
              console.log(results.rows);
              req.flash("success_msg", "You are now registered. Please log in");
              res.redirect("/users/login");
            }
          );
        }
      }
    );
  }
});

app.post("/users/login",
  passport.authenticate("local", {
    successRedirect: "/users/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true
  })
);

function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect("/users/dashboard");
  }
  next();
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
