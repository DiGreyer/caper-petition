const express = require("express");
const exphbs = require("express-handlebars");
const app = express();
const cookieSession = require("cookie-session");
const bcrypt = require("bcryptjs");
const spicedpg = require("spiced-pg");
const db = spicedpg("postgres:dsivkov:greyer@localhost:5432/caper-petition");

// cookie session and secret
app.use(
    cookieSession({
        name: "session",
        secret: "shhh",
        maxAge: 1000 * 60 * 60 * 24 * 14,
    })
);

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
    // checking if the user has already signed the petition, else redirecting to signing page
    if (req.session.signatureId) {
        // if user has already signed up redirecting to thanks page
        res.redirect("/thanks");
    } else {
        res.redirect("/petition");
    }
});

// petition signing page
app.get("/petition", function (req, res) {
    // checking if user has already signed the petition
    if (req.session.signature) {
        res.redirect("/thanks");
    } else {
        res.render("petition");
    }
});

// petition signing
app.post("/petition", function (req, res) {
    // getting data from user input
    const first = req.body.first;
    const last = req.body.last;
    const signature = req.body.signature;

    db.signUp(first, last, signature)
        .then((result) => {
            req.session.id = result.rows[0].id;
            res.redirect("/thanks");
        })
        .catch((err) => {
            console.log("eror in signUp ", err);
        });
});

//thanks page
app.get("/thanks", function (req, res) {
    // if cookie
    const { id } = req.session;
    let supporters;
    if (id) {
        db.signersCount()
            .then((result) => {
                console.log("count is : ", result);
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

app.listen(8080, () =>
    console.log("If nothing else, at least the server is running ...")
);
