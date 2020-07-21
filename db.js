// db.js

const spicedPg = require("spiced-pg");
// const db = spicedPg("postgres:greyer:greyer@localhost:5432/caper-petition");

const db = spicedPg(
    process.env.DATABASE_URL || "postgres:caper:caper@localhost:5432/petition3"
);

//sign the petition
module.exports.signUp = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id;`,
        [signature, user_id]
    );
};

//get signature
module.exports.signature = (id) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = $1;`, [id])
        .then((result) => {
            // console.log("result from db is:", result);
            return result.rows[0].signature;
        });
};

// check signature
module.exports.checkSignature = (id) => {
    return db.query(`SELECT id FROM signatures WHERE user_id = $1;`, [id]);
};

//count
module.exports.signersCount = () => {
    return db.query(`SELECT COUNT(*) FROM signatures`).then((result) => {
        // console.log("results is : ", result);
        return result.row[0].count;
    });
};

/// display user
module.exports.displayInfo = (user_id) => {
    return db.query(
        `SELECT users.first AS user_firstname, users.last AS user_lastname, users.email AS user_email, user_profiles.age AS user_age, user_profiles.city AS user_city, user_profiles.url AS user_url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1;`,
        [user_id]
    );
};

//update profile (no pw)
module.exports.updateAccountNoPw = (first, last, email, id) => {
    return db.query(
        `UPDATE users SET first = $1, last = $2, email = $3 WHERE id = $4;`,
        [first, last, email, id]
    );
};

//update full account
module.exports.updateFullAccount = (first, last, email, password, id) => {
    return db.query(
        `UPDATE users SET first = $1, last = $2, email = $3, password = $4 WHERE id = $5;`,
        [first, last, email, password, id]
    );
};

module.exports.whoSigned = () => {
    return db.query(`SELECT first, last FROM signatures;`);
};

//register
module.exports.registerUser = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id;`,
        [first, last, email, password]
    );
};

//add profile info
module.exports.profileInfo = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4);`,
        [age, city, url, user_id]
    );
};

// get supporters
module.exports.getSupporters = () => {
    return db.query(`
        SELECT users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON user_profiles.user_id = signatures.user_id;
    `);
};

/////login

// module.exports.login = (email) => {
//     return db.query(`SELECT * FROM users WHERE email = '${email}';`);
// };
module.exports.login = (email) => {
    return db.query(`SELECT * FROM users WHERE email = $1;`, [email]);
};

//user by city
module.exports.supportersCity = (city) => {
    return db.query(
        `
        SELECT users.first AS user_firstName, users.last AS user_lastName, user_profiles.age AS user_age, user_profiles.city AS user_city, user_profiles.url AS user_url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON user_profiles.user_id = signatures.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1);
        `,
        [city]
    );
};

//delete signatures
module.exports.deleteSignature = (user_id) => {
    return db.query(`DELETE FROM signatures WHERE user_id = $1;`, [user_id]);
};
