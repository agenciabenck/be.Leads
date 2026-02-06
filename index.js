const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for basic logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Heartbeat route to confirm the server is running
app.get('/health', (req, res) => {
    res.json({
        status: 'online',
        message: 'BeLeads Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve static files from the 'dist' directory
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Handle SPA routing: return entry.html for all non-static requests
app.get('*', (req, res) => {
    const entryFile = path.join(distPath, 'entry.html');
    res.sendFile(entryFile, (err) => {
        if (err) {
            console.error('Error sending entry.html:', err);
            res.status(500).send('Erro no Servidor: Arquivo de entrada não encontrado na pasta dist. Certifique-se de que o build foi concluído com sucesso.');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`BeLeads Production Server running on port ${PORT}`);
});