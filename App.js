const express = require('express');
const mysql = require('mysql2/promise');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'info22p2',
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
        const [rows] = await connection.query('SELECT * FROM EntidadeA');
        connection.release();
        res.json(rows);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.get('/EntidadeB', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM EntidadeB');
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
        const [rows] = await connection.query('SELECT * FROM EntidadeA WHERE id = ?', [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }
        const [rowsB] = await connection.query('SELECT * FROM EntidadeB WHERE EntidadeA_id = ?', [id]);
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
        const [rows] = await connection.query('SELECT * FROM EntidadeB WHERE id = ?', [id]);
        if (rows.length === 0) {
            res.status(404).json({ error: 'Registro não encontrado' });
            return;
        }
        const [rowsA] = await connection.query('SELECT * FROM EntidadeA WHERE id = ?', [rows[0].EntidadeA_id]);
        connection.release();
        const result = { ...rows[0], EntidadeA: rowsA[0] };
        res.json(result);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.get('/EntidadeA/buscar', async (req, res) => {
    const { atributo } = req.query;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM EntidadeA WHERE nome = ?', [atributo]);
        const result = await Promise.all(rows.map(async (row) => {
            const [rowsB] = await connection.query('SELECT * FROM EntidadeB WHERE EntidadeA_id = ?', [row.id]);
            return { ...row, EntidadeB: rowsB };
        }));
        connection.release();
        res.json(result);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.get('/EntidadeB/buscar', async (req, res) => {
    const { atributo } = req.query;
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM EntidadeB WHERE descricao = ?', [atributo]);
        const result = await Promise.all(rows.map(async (row) => {
            const [rowsA] = await connection.query('SELECT * FROM EntidadeA WHERE id = ?', [row.EntidadeA_id]);
            return { ...row, EntidadeA: rowsA[0] };
        }));
        connection.release();
        res.json(result);
    } catch (err) {
        handleDBError(res, err);
    }
});

app.post('/EntidadeA', async (req, res) => {
    const { nome, EntidadeB } = req.body;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const [resultA] = await connection.query('INSERT INTO EntidadeA (nome) VALUES (?)', [nome]);
        const entidadeAId = resultA.insertId;

        await Promise.all(EntidadeB.map(async (item) => {
            await connection.query('INSERT INTO EntidadeB (descricao, EntidadeA_id) VALUES (?, ?)', [item.descricao, entidadeAId]);
        }));

        await connection.commit();
        connection.release();
        res.status(201).json({ message: 'Registro criado com sucesso' });
    } catch (err) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        handleDBError(res, err);
    }
});

app.post('/EntidadeB', async (req, res) => {
    const { descricao, EntidadeA_id } = req.body;
    try {
        const connection = await pool.getConnection();
        const [result] = await connection.query('INSERT INTO EntidadeB (descricao, EntidadeA_id) VALUES (?, ?)', [descricao, EntidadeA_id]);
        connection.release();
        res.status(201).json({ message: 'Registro criado com sucesso', id: result.insertId });
    } catch (err) {
        handleDBError(res, err);
    }
});

app.delete('/EntidadeA/:id', async (req, res) => {
    const id = req.params.id;
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        await connection.query('DELETE FROM EntidadeB WHERE EntidadeA_id = ?', [id]);
        await connection.query('DELETE FROM EntidadeA WHERE id = ?', [id]);

        await connection.commit();
        connection.release();
        res.json({ message: 'Registro excluído com sucesso' });
    } catch (err) {
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        handleDBError(res, err);
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
