const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());

const pool = mysql.createPool({
    host: 'localhost:3306',
    user: 'root',
    password: 'root',
    database: 'Info22P2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

function handleDBError(res, err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
}