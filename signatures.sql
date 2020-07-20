DROP TABLE IF EXISTS signatures;


CREATE TABLE signatures(
    id SERIAL PRIMARY KEY,
    first VARCHAR(255) NOT NULL CHECK (first != ''),
    last VARCHAR(255) NOT NULL CHECK (last != ''),
    signature TEXT NOT NULL CHECK (signature != ''),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);