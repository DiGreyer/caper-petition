// middleware for logn / register page - logged in user should NOT be allowed to view those pages

// function requireLoggedOutUser(req, res, next) {
//     //checks if the user is logged in
//     if (req.session.userId) {
//         res.redirect("/petition");
//     } else {
//         //runs if user is not logged in
//         next();
//     }
// }

////// ROUTES AND COOKIES MY BE CALLED DIFFERENTLY - CHECK  //////////

//exports the above function

module.exports.requreLoggedOutUser = function requireLoggedOutUser(
    req,
    res,
    next
) {
    //checks if the user is logged in
    if (req.session.userId) {
        res.redirect("/petition");
    } else {
        //runs if user is not logged in
        next();
    }
};

//middleware to check if the user has signed the petition. signed user should NOT be able to see the petition page

module.exports.requireNoSignature = function requreNoSignature(req, res, next) {
    //checks if user has signed the petition
    if (req.session.signatureId) {
        res.redirect("/thanks");
    } else {
        next();
    }
};

//middleware that requires a signed petitiopn before it shows to thanks / signers page

module.requres.requireSignature = function requireSignature(req, res, next) {
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        next();
    }
};


//middleware to check ifg user is loged in, not finished

function requireLopggedInUser(req,res, next) {
    if () {
        res.redirect('/register');
    } else {
        next();
    }
}