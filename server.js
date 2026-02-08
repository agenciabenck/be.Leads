const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('--- BeLeads Server Startup ---');
console.log('Time:', new Date().toISOString());
console.log('Environment:', process.env.NODE_ENV);
console.log('Current working directory:', process.cwd());

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
        timestamp: new Date().toISOString(),
        cwd: process.cwd()
    });
});

// Serve static files from the 'dist' directory
const distPath = path.resolve(__dirname, 'dist');
console.log('Static files path:', distPath);

if (fs.existsSync(distPath)) {
    console.log('Dist directory found. Files:', fs.readdirSync(distPath));
} else {
    console.error('CRITICAL: Dist directory NOT found at:', distPath);
}

app.use(express.static(distPath));

// Handle SPA routing: return entry.html for all non-static requests
app.get('*', (req, res) => {
    const entryFile = path.join(distPath, 'entry.html');
    if (!fs.existsSync(entryFile)) {
        console.error('CRITICAL: entry.html NOT found at:', entryFile);
    }
    res.sendFile(entryFile, (err) => {
        if (err) {
            console.error('Error sending entry.html:', err);
            res.status(500).send(`Erro no Servidor: Arquivo de entrada não encontrado na pasta dist. Caminho tentado: ${entryFile}`);
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`BeLeads Production Server running on port ${PORT}`);
    console.log('------------------------------');
});