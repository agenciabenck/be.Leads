const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'dist' directory
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// Handle SPA routing: return vite-dev-entry.html for all non-static requests
app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'vite-dev-entry.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});