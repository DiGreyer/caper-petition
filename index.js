const express = require("express");
const exphbs = require("express-handlebars");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const spicedpg = require("spiced-pg");
// const db = spicedpg("postgres:dsivkov:greyer@localhost:5432/caper-petition");
const db = require("./db.js");

// cookie session and secret
app.use(
    cookieSession({
        name: "session",
        secret: "greyer",
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

// body parser..
app.use(
    express.urlencoded({
        extended: false,
    })
);

// use static files cs, img and so on for later on..
app.use(express.static("public"));

// home redirect
app.get("/", function (req, res) {
    // console.log("Seesion cookie home", req.session);
    // checking if the user has already signed the petition, else redirecting to signing page
    if (req.session.signatureId) {
        // if user has already signed up redirecting to thanks page
        res.redirect("/thanks");
    } else {
        // res.redirect("/petition");

        res.redirect("/login");
    }
});

//////// SIGN Up PAGE //////////

// register form page
app.get("/register", function (req, res) {
    res.render("register"); //, { query: req.query });
});

app.post("/register", function (req, res) {
    let user = req.body;
    // encrypting password
    let salt = bcrypt.genSaltSync(10);
    let hash = bcrypt.hashSync(user.password, salt);
    user.password = hash;
    // saving user to db
    // let array = [user.first, user.last, user.email, user.password];

    db.registerUser(user.first, user.last, user.email, user.password)
        .then((result) => {
            // console.log("req.ses.userId:", req.session);
            req.session.userId = result.rows[0].id;

            // console.log("new req.ses:", req.session.userId);
            res.redirect("/petition");
        })
        .catch((err) => {
            console.log("error in Regiser:", err);
        });
});

// petition signing page
app.get("/petition", function (req, res) {
    // checking if user has already signed the petition

    console.log("user has signed", req.session.signature);
    if (req.session.signature) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

// petition signing
app.post("/petition", function (req, res) {
    // getting data from user input
    // const first = req.body.first;  we have them in register
    // const last = req.body.last;

    // console.log("session on petition:", req.session);
    const signature = req.body.signature;

    const userId = req.session.userId;

    db.signUp(signature, userId)
        .then((result) => {
            req.session.id = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("eror in signUp ", err);
        });
});

/////// OLD CODE ///////
// app.post("/petition", function (req, res) {
//     // checking if signature data uri is in the req.body
//     if (req.body.signature) {
//         //inserting new signature query
//         var query =
//             "INSERT INTO signatures(signature, user_id) values('" +
//             req.body.signature +
//             "','" +
//             req.session.id +
//             "') RETURNING id;";

//         db.query(query, (err, response) => {
//             if (err) {
//                 res.redirect("/petition?err=Something wrong with data");
//             } else {
//                 // adding signatureId into session
//                 req.session.signatureId = response.rows[0].id;
//                 // redirecting to thanks page
//                 res.redirect("/petition/signed");
//             }
//         });
//     } else {
//         // redirecting to signature page if data uri from req.body missing
//         res.redirect("/petition?err=signature Missing");
//     }
// });

//////////  END of OLD CODE //////////////////////

//thanks page
app.get("/thanks", function (req, res) {
    // if cookie
    const { id } = req.session;
    let supporters;
    if (id) {
        db.signersCount()
            .then((result) => {
                // console.log("count is : ", result);
                supporters = result;
            })
            .catch((err) => {
                console.log("Error count: ", err);
            });
        db.signature(id)
            .then((result) => {
                res.render("thanks", {
                    signature: result,
                    number: supporters,
                });
            })
            .catch((err) => {
                console.log("Error in signature: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

//listing all signed users
app.get("/signers", function (req, res) {
    // checking if user has signed already
    if (req.session.signatureId) {
        db.whoSigned()
            .then((result) => {
                return result.rows;
            })
            .then((results) => {
                res.render("signers", { supporters: results });
            })
            .catch((err) => {
                console.log("Error in whoSigned: ", err);
            });
    } else {
        res.redirect("/petition");
    }
});

//////// LOGIN FORM PAGE //////////////

app.get("/login", function (req, res) {
    // checking if there is user logged or petition was signed?
    // if (req.session.id) {
    //     if (req.session.signatureId) {
    //         res.redirect("/thanks");
    //     } else {
    //         res.redirect("/petition");
    //     }
    // } else {
    res.render("login");
    // }
});

app.post("/login", function (req, res) {
    //used entered data and compare with db  - email / password
    var credentials = req.body;

    db.login(credentials.email)
        .then((result) => {
            let passwordCompare = bcrypt.compareSync(
                credentials.password,
                result.rows[0].password
            );
            return passwordCompare;
            // console.log("passwordCOmpare is :", passwordCompare);
        })
        .then((matchId) => {
            if (matchId) {
                // console.log("user id should be :", req.session.userId);
                res.redirect("/petition");
            } else {
                console.log("user not found!!");
                res.redirect("/login");
            }
        })
        .catch((err) => {
            console.log("error in login", err);
        });
});
//     if (passwordCompare) {
//         let foundUser = req.session;
//     }

// })
////////////////////////
//// OLD CODE /////////
////////////////////

// var findquery =
//     "SELECT * from users WHERE email = '" + credentials.email + "' LIMIT 1";

// db.query(findquery, (err, response) => {
//     if (err) {
//         console.log("err", err);
//         res.redirect("/login?err=Something wrong with data");
//     } else {
//         var founduser = response.rows[0];

//         if (founduser && founduser.id) {
//             var passwordCompare = bcrypt.compareSync(
//                 credentials.password,
//                 founduser.password
//             );
//             if (passwordCompare) {
//                 req.session = founduser;

//                 // has user signed ?
//                 var findsignature =
//                     "SELECT * from signatures WHERE user_id = '" +
//                     founduser.id +
//                     "' LIMIT 1";
//                 db.query(findsignature, (err, response) => {
//                     var foundsignature = response.rows[0];
//                     if (foundsignature && foundsignature.id) {
//                         req.session.signatureId = foundsignature.id;
//                         res.redirect("/petition/signed"); // if signature exists
//                     } else {
//                         res.redirect("/petition");
//                     }
//                 });
//             } else {
//                 console.log("wrong password");
//                 res.redirect("/login?err=Wrong Password");
//             }
//         } else {
//             console.log("err: ", err);
//             res.redirect("/login?err=Something wrong with data");
//         }
//     }
// });
// });

//// ////////////////
/////    OLD CODE ////////
////////////////////////////

// var query =
//     "INSERT INTO users(first, last, email, password) values($1, $2, $3, $4) RETURNING id;";
// db.query(query, array, (err, response) => {
//     if (err) {
//         console.log("err: ", err);
//         res.redirect("/register?err=Something wrong with data");
//     } else {
//         req.session.userId = response.rows[0].id; // saving registered user's id into session
//         res.redirect("/register/profile"); // update profile
//     }
//     // });
// });

app.listen(8080, () =>
    console.log("If nothing else, at least the server is running ...")
);
