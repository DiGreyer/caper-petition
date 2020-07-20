// db.js

const spicedPg = require("spiced-pg");
// const db = spicedPg("postgres:greyer:greyer@localhost:5432/caper-petition");

const db = spicedPg("postgres:caper:caper@localhost:5432/petition3");

module.exports.signUp = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id;`,
        [signature, user_id]
    );
};

module.exports.signature = (id) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = ${id};`)
        .then((result) => {
            // console.log("result from db is:", result);
            return result.rows[0].signature;
        });
};

module.exports.signersCount = () => {
    return db.query(`SELECT COUNT (*) FROM signatures`).then((result) => {
        console.log("results is : ", result);
        return result.row[0].signature;
    });
};

module.exports.whoSigned = () => {
    return db.query(`SELECT first, last FROM signatures;`);
};

module.exports.registerUser = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id;`,
        [first, last, email, password]
    );
};

module.exports.login = (email) => {
    return db.query(`SELECT * FROM users WHERE email = '${email}';`);
};
