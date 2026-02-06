const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    console.log(`Request received: ${req.method} ${req.url}`);

    if (req.url === '/diagnostic') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'diagnostic-alive',
            node_version: process.version,
            port: PORT,
            env: process.env.NODE_ENV || 'not set'
        }));
        return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
    <h1>Diagnóstico be.leads</h1>
    <p>O Node.js está funcionando corretamente neste servidor!</p>
    <p>Versão do Node: ${process.version}</p>
    <p>Porta: ${PORT}</p>
    <hr>
    <p>Se você vê esta mensagem, o problema anterior era provavelmente nas dependências (Express) ou no build.</p>
    <p>Tente acessar <a href="/diagnostic">/diagnostic</a> para dados JSON.</p>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Diagnostic server running on port ${PORT}`);
});