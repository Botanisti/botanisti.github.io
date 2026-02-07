#!/usr/bin/env node
/**
 * Fast Preview Server for VS Code
 * Lightweight HTTP server with live reload capability
 * 
 * Usage:
 *   node preview-server.js [port] [directory]
 *   node preview-server.js 8080 lakeudena
 * 
 * Or from VS Code: Ctrl+Shift+P -> "Tasks: Run Task" -> "Preview: lakeudena/index2.html"
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.argv[2] || 8080;
const ROOT_DIR = path.resolve(process.argv[3] || '.');

const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

function injectLiveReload(html) {
    const script = `
<script>
(function() {
    const ws = new WebSocket('ws://localhost:${parseInt(PORT) + 1}');
    ws.onmessage = function() { location.reload(); };
})();
</script>`;
    return html.replace('</body>', script + '</body>');
}

const server = http.createServer((req, res) => {
    let filePath = path.join(ROOT_DIR, req.url === '/' ? '/lakeudena/index2.html' : req.url);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Default to index.html for directories
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found: ' + req.url);
            } else {
                res.writeHead(500);
                res.end('Server error');
            }
            return;
        }
        
        const mimeType = getMimeType(filePath);
        res.writeHead(200, { 
            'Content-Type': mimeType,
            'Cache-Control': 'no-cache'
        });
        
        if (mimeType === 'text/html') {
            res.end(injectLiveReload(data.toString()));
        } else {
            res.end(data);
        }
    });
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}/lakeudena/index2.html`;
    console.log(`
╔════════════════════════════════════════════════════════╗
║          🚀 Fast Preview Server Running                 ║
╠════════════════════════════════════════════════════════╣
║  📁 Root: ${ROOT_DIR.padEnd(44)} ║
║  🌐 URL:  ${url.padEnd(44)} ║
╠════════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop                                  ║
╚════════════════════════════════════════════════════════╝
    `);
    
    // Auto-open browser
    const platform = process.platform;
    const command = platform === 'win32' ? `start ${url}` :
                   platform === 'darwin' ? `open ${url}` :
                   `xdg-open ${url}`;
    
    setTimeout(() => {
        exec(command, (err) => {
            if (err) console.log('Could not auto-open browser. Please open manually.');
        });
    }, 500);
});

// Simple WebSocket server for live reload (basic implementation)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: parseInt(PORT) + 1 });

let clients = [];
wss.on('connection', (ws) => {
    clients.push(ws);
    ws.on('close', () => {
        clients = clients.filter(c => c !== ws);
    });
});

// Watch for file changes
const chokidar = require('chokidar');
const watcher = chokidar.watch(ROOT_DIR, {
    ignored: /(^|[\/\\])\../,
    persistent: true
});

watcher.on('change', () => {
    clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send('reload');
        }
    });
});

console.log('Live reload enabled (WebSocket on port ' + (parseInt(PORT) + 1) + ')');
