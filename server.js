import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const app = express();
const PORT = 3000;

// Configuración para servir archivos estáticos (Dashboard)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors());
app.use(express.json());

// Conexión y creación de la Base de Datos Local (SQLite)
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error('Error al abrir la BD:', err.message);
    else console.log('Conectado a la base de datos local SQLite.');
});

// Crear tabla si no existe
db.run(`
    CREATE TABLE IF NOT EXISTS lecturas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_usuario TEXT,
        temperatura REAL,
        humedad REAL,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// ==========================================
// RUTA POST: Guarda los datos en la BD
// ==========================================
app.post('/api/lecturas', (req, res) => {
    const { nombre_usuario, temperatura, humedad } = req.body;

    if (!nombre_usuario || temperatura === undefined || humedad === undefined) {
        return res.status(400).json({ status: "error", message: "Datos incompletos" });
    }

    const sql = `INSERT INTO lecturas (nombre_usuario, temperatura, humedad) VALUES (?, ?, ?)`;
    
    db.run(sql, [nombre_usuario, temperatura, humedad], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ status: "error", message: "Error al guardar en BD" });
        }
        
        console.log(`[BD] Guardado ID: ${this.lastID} | ${nombre_usuario} -> T: ${temperatura}°C, H: ${humedad}%`);
        res.status(201).json({ status: "success", id: this.lastID });
    });
});

// ==========================================
// RUTA GET: Devuelve las últimas 30 lecturas para el Dashboard
// ==========================================
app.get('/api/lecturas', (req, res) => {
    const sql = `SELECT * FROM lecturas ORDER BY fecha DESC LIMIT 30`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ status: "error", message: err.message });
        }
        // Invertimos el orden para que en la gráfica se muestren cronológicamente (de izquierda a derecha)
        res.json({ status: "success", data: rows.reverse() });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor IoT corriendo en el puerto ${PORT}`);
});