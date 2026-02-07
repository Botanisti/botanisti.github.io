#!/usr/bin/env node
/**
 * Simple Preview Server - No dependencies required
 * 
 * Usage:
 *   node preview-server-simple.js [port] [filepath]
 *   node preview-server-simple.js 8080 lakeuden/index.html
 *   node preview-server-simple.js 8080 "current file"
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.argv[2] || 8080;
const ROOT_DIR = path.resolve('.');
const CUSTOM_PATH = process.argv[3]; // Optional: specific file to open

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return MIME_TYPES[ext] || 'application/octet-stream';
}

// Determine the default file to serve
function getDefaultPath() {
    if (CUSTOM_PATH && CUSTOM_PATH !== 'index.html') {
        // If a custom path was provided, use it
        return CUSTOM_PATH.startsWith('/') ? CUSTOM_PATH : '/' + CUSTOM_PATH;
    }
    // Default fallback
    return '/lakeudena/index2.html';
}

const DEFAULT_PATH = getDefaultPath();

const server = http.createServer((req, res) => {
    // Decode URL to handle spaces and special characters
    let urlPath = decodeURIComponent(req.url);
    
    // Default route
    if (urlPath === '/') {
        urlPath = DEFAULT_PATH;
    }
    
    let filePath = path.join(ROOT_DIR, urlPath);
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        return;
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + urlPath);
        return;
    }
    
    // Handle directories
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
        const indexPath = path.join(filePath, 'index.html');
        if (fs.existsSync(indexPath)) {
            filePath = indexPath;
        } else {
            // Generate directory listing
            const files = fs.readdirSync(filePath);
            const list = files.map(f => {
                const isDir = fs.statSync(path.join(filePath, f)).isDirectory();
                return `<li><a href="${urlPath.replace(/\/$/, '')}/${f}">${f}${isDir ? '/' : ''}</a></li>`;
            }).join('');
            
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(`<!DOCTYPE html>
<html>
<head><title>Index of ${urlPath}</title>
<style>body{font-family:sans-serif;max-width:800px;margin:40px auto;padding:0 20px}li{margin:5px 0}a{text-decoration:none;color:#0066cc}</style>
</head>
<body><h1>Index of ${urlPath}</h1><ul>${list}</ul></body></html>`);
            return;
        }
    }
    
    // Serve file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Server Error');
            return;
        }
        
        res.writeHead(200, { 
            'Content-Type': getMimeType(filePath),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        });
        res.end(data);
    });
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}${DEFAULT_PATH}`;
    console.log(`
╔═══════════════════════════════════════════════════════╗
║         🚀 Fast Preview Server Running                 ║
╠═══════════════════════════════════════════════════════╣
║  Root: ${ROOT_DIR}
║  URL:  ${url}
╠═══════════════════════════════════════════════════════╣
║  Press Ctrl+C to stop                                 ║
╚═══════════════════════════════════════════════════════╝
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
    }, 800);
});
