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

app.get('/EntidadeA', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('select * from EntidadeA');
        connection.release();
        res.json(rows);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.get('/EntidadeB', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('select * from EntidadeB');
        connection.release();
        res.json(rows);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.get('/EntidadeA/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('select * from EntidadeA where id = ?', [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }
        const [rowsB] = await connection.query('select * from EntidadeB where EntidadeA_id = ?', [id]);
        connection.release();
        const result = { ...rows[0], EntidadeB: rowsB };
        res.json(result);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.get('/EntidadeB/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('select * from EntidadeB where id = ?', [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }
        const [rowsA] = await connection.query('select * from EntidadeA where id = ?', [rows[0].EntidadeA_id]);
        connection.release();
        const result = { ...rows[0], EntidadeA: rowsA[0] };
        res.json(result);
    } catch (err) {
        handleDBError(res, err);
    }
});
