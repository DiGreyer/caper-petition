// db.js

const spicedPg = require("spiced-pg");
const db = spicedPg("postgres:dsivkov:greyer@localhost:5432/caper-petition");

module.exports.signUp = (first, last, signature) => {
    return db.query(
        `INSERT INTO signatures (first, last, signature) VALUES ($1, $2, $3) RETURNING id;`,
        [first, last, signature]
    );
};

module.exports.signature = (id) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = ${id};`)
        .then((result) => {
            console.log("result from db is:", result);
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
