const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Heartbeat route to check if Node.js is alive
app.get('/status-check', (req, res) => {
    res.json({ status: 'alive', time: new Date().toISOString() });
});

// Serve static files from the 'dist' directory
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Handle SPA routing: return entry.html for all non-static requests
app.get('*', (req, res) => {
    const entryPath = path.join(distPath, 'entry.html');
    res.sendFile(entryPath, (err) => {
        if (err) {
            console.error('Error sending entry.html:', err);
            res.status(500).send('Erro no servidor: Arquivo entry.html não encontrado na pasta dist. Por favor, verifique se o build foi concluído.');
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});