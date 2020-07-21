const express = require("express");
const exphbs = require("express-handlebars");
const app = express();
const cookieSession = require("cookie-session");
const csurf = require("csurf");
const bcrypt = require("bcryptjs");
const spicedpg = require("spiced-pg");
// const db = spicedpg("postgres:dsivkov:greyer@localhost:5432/caper-petition");
const db = require("./db.js");

// cookie session and secret
app.use(
    cookieSession({
        name: "session",
        secret: "something",
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

// // imports the fucntion into index .js
// const {
//     requireLoggedOutUser,
//     requireNoSignature,
//     requireSignature,
// } = require("/middleware");

// the fucntion below  runs a middleware (above) on the get request

// app.get('/register', requireLoggedOutUser, (req,res) => {

// });

// session values to hb
app.use(function (req, res, next) {
    res.locals.session = req.session;
    next();
});

// setting up handlesbars as default view engine
app.engine("handlebars", exphbs());
app.set("view engine", "handlebars");

// use static files cs, img and so on for later on..
app.use(express.static("public"));

// body parser..
app.use(
    express.urlencoded({
        extended: false,
    })
);

/// CSURF ... not sure how it works ...
// app.use(csurf());

// // Prevent to be loaded in a frame

// app.use((req, res, next) => {
//     res.set("X-Frame-Options", "deny");
//     // add csrfToken with Token value to empty res.locals object
//     res.locals.csrfToken = req.csrfToken();
//     next();
// });

// HOME PAGE
app.get("/", function (req, res) {
    //check for cookie..
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.redirect("/register");
    }
});

//////// SIGN Up PAGE //////////

// register form page
app.get("/register", function (req, res) {
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.render("register");
    }
});

app.post("/register", function (req, res) {
    let user = req.body;
    //check for empty string
    if (
        user.first != "" &&
        user.last != "" &&
        user.email != "" &&
        user.password != ""
    ) {
        // encrypting password
        let salt = bcrypt.genSaltSync(10);
        let hash = bcrypt.hashSync(user.password, salt);
        user.password = hash;
        // saving user to db

        db.registerUser(user.first, user.last, user.email, user.password)
            .then((result) => {
                // console.log("req.ses.userId:", req.session);
                req.session.user = {
                    firstName: user.first,
                    lastName: user.last,
                    userId: result.rows[0].id,
                };
                res.redirect("/profile");

                // // console.log("new req.ses:", req.session.userId);
                // res.redirect("/petition");
            })
            .catch((err) => {
                console.log("error in Regiser:", err);
                res.render("register", { error: true });
            });
    } else if (
        // the values are empty
        user.first == "" ||
        user.last == "" ||
        user.email == "" ||
        user.password == ""
    ) {
        // render the register template with error helper
        res.render("register", { error: true });
    }
});

/// Profile page
app.get("/profile", (req, res) => {
    // the good old cookie spiel
    const { user } = req.session;
    if (user) {
        res.render("profile");
    } else {
        res.redirect("/register");
    }
});

// POST /profile

app.post("/profile", (req, res) => {
    let { age, city, url } = req.body;
    const { user } = req.session;
    // check for empty string
    if (age == "" && city == "" && url == "") {
        // if the user has not entered anything,
        // redirect to petition
        res.redirect("/petition");
    } else {
        db.profileInfo(age, city, url, user.userId)
            .then(() => {
                res.redirect("/petition");
            })
            .catch((err) => {
                console.log("Error in addProfileInfo: ", err);
                res.render("profile", { error: true });
            });
    }
});

//////// LOGIN FORM PAGE //////////////

app.get("/login", (req, res) => {
    const { user } = req.session;
    if (user) {
        res.redirect("/petition");
    } else {
        res.render("login");
    }
});

app.post("/login", function (req, res) {
    //used entered data and compare with db  - email / password
    var credentials = req.body;
    var first;
    var last;
    var dbPass;
    var id;

    db.login(credentials.email)
        .then((result) => {
            //get profile data
            first = result.rows[0].first;
            last = result.rows[0].last;
            dbPass = result.rows[0].password;
            id = result.rows[0].id;
            return dbPass;
        })
        .then((dbPass) => {
            return bcrypt.compare(credentials.password, dbPass);
        })
        .then((matchValue) => {
            if (matchValue) {
                // create user cookie object and
                // give it the full name and user
                // ID stored from checkLogin
                req.session.user = {
                    firstName: first,
                    lastName: last,
                    userId: id,
                };
                return req.session.user.userId;
            } else if (!matchValue) {
                res.render("login", { error: true });
            }
        })
        .then((userId) => {
            // check for signature with user ID
            db.checkSignature(userId).then((sigId) => {
                if (sigId.rows[0].id) {
                    // store the signature ID in the cookie
                    req.session.user.sigId = sigId.rows[0].id;
                    res.redirect("/thanks");
                } else if (!sigId.rows[0].id) {
                    res.redirect("/petition");
                }
            });
        })
        .catch((err) => {
            console.log("Error in checkLogin: ", err);
            res.render("login", { error: true });
        });
});

// petition signing page
app.get("/petition", (req, res) => {
    // check for signature ID cookie
    const { user } = req.session;
    if (user.sigId) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

app.post("/petition", function (req, res) {
    // console.log("session on petition:", req.session);
    const signature = req.body.signature;
    const { user } = req.session;

    //check to see if signed
    if (signature != "") {
        db.signUp(signature, user.userId)
            .then((result) => {
                user.sigId = result.rows[0].id;
                // console.log('signititure cookie:', user.sigId);
                res.redirect("/thanks");
            })
            .catch((err) => {
                console.log("eror in signUp ", err);
            });
    } else {
        res.render("petition", { error: true });
    }
});

////thanks page //////

app.get("/thanks", (req, res) => {
    const { user } = req.session;
    let supportNumbers;

    //check to see if signed
    if (user.sigId) {
        db.signersCount()
            .then((result) => {
                supportNumbers = result;
            })
            .catch((err) => {
                console.log("Error in signersCount: ", err);
            });
        db.signature(user.sigId)
            .then((result) => {
                // check for edit cookie
                if (user.edit) {
                    // delete the edit cookie
                    delete user.edit;
                    res.render("thanks", {
                        first: user.firstName,
                        last: user.lastName,
                        signature: result,
                        number: supportNumbers,
                        update: true,
                    });
                } else {
                    // normal thanks render
                    res.render("thanks", {
                        first: user.firstName,
                        last: user.lastName,
                        signature: result,
                        number: supportNumbers,
                    });
                }
            })
            .catch((err) => {
                console.log("Error in getSignature: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

//////// DELETE SIGNATURE /////////
app.post("/thanks/delete", (req, res) => {
    const { user } = req.session;
    db.deleteSignature(user.userId)
        .then(() => {
            // delete signature ID cookie
            delete user.sigId;
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("Error in deleteSignature: ", err);
        });
});

//listing all signed users
app.get("/signers", (req, res) => {
    //check for cookie
    const { user } = req.session;
    if (user) {
        // check for signature
        if (user.sigId) {
            db.getSupporters()
                .then((result) => {
                    return result.rows;
                })
                .then((results) => {
                    res.render("signers", { supporters: results });
                })
                .catch((err) => {
                    console.log("Error in getSupporters: ", err);
                });
        } else {
            // promt t osign if no signature
            res.redirect("/petition");
        }
        // if no user cookie, back to login
    } else {
        res.redirect("/login");
    }
});

app.listen(8080, () =>
    console.log("If nothing else, at least the server is running ...")
);
