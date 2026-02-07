# Fast Preview for VS Code

Quick preview setup that opens the **currently active file**!

## 🚀 Recommended: Preview CURRENT FILE (Node.js)

**One-time setup:** None needed! Works with built-in Node.js.

**Usage:**
1. Open any HTML file in the editor (e.g., `lakeuden/index.html`)
2. Press `Ctrl+Shift+P` → type "Tasks: Run Task"
3. Select `🚀 Preview Current File (Node.js)`
4. Browser opens automatically with **that exact file**

Or press `F5` and select `🎯 Chrome: Current File (file://)` for instant preview without server.

**Features:**
- ✅ Opens **whichever file is currently active**
- ✅ Zero dependencies (uses built-in Node.js)
- ✅ Auto-opens browser
- ✅ Works with any HTML file in your project

---

## 🐍 Alternative: Python HTTP Server

If you prefer Python or don't have Node.js:

1. `Ctrl+Shift+P` → "Tasks: Run Task" → `🐍 Preview Current File (Python)`
2. Browser opens automatically with your current file

Or start server first:
1. `Ctrl+Shift+P` → "Tasks: Run Task" → `🖥️ Start Server Only (Node.js)`
2. `Ctrl+Shift+P` → "Tasks: Run Task" → `🌐 Open Current File in Browser`

---

## 🌐 Option: Built-in VS Code Preview Extensions

Install extensions for integrated preview:

### Option A: Live Server (ms-vscode.live-server)
- Recommended by VS Code
- No configuration needed
- Click "Go Live" in status bar
- Auto-refreshes on save

### Option B: Live Preview (ms-vscode.live-preview)
- Built-in preview panel (no browser needed)
- Works offline
- Press `Ctrl+Shift+P` → "Live Preview: Start Server"

Install via: `Ctrl+Shift+P` → "Extensions: Install Recommended Extensions"

---

## 🔧 Debug Launch Configurations (F5)

Press `F5` or go to Run → Start Debugging to choose:

| Configuration | Description |
|--------------|-------------|
| `🎯 Chrome: Current File (file://)` | Opens **currently active file** directly (fastest, no server) |
| `🌐 Chrome: Current File (localhost:8080)` | Opens current file via server (requires server running) |
| `🚀 Chrome: Server + Current File` | Starts server THEN opens current file |
| `🎯 Edge: Current File` | Opens current file in Microsoft Edge |
| `📄 Chrome: lakeudena/index2.html` | Specific file (legacy) |

---

## 📋 Quick Command Reference

| Task | Command |
|------|---------|
| **Preview current file** | `Ctrl+Shift+P` → "Tasks: Run Task" → `🚀 Preview Current File (Node.js)` |
| Preview lakeudena/index2 | `Ctrl+Shift+P` → "Tasks: Run Task" → `🚀 Preview: lakeudena/index2.html` |
| Preview lakeuden/index | `Ctrl+Shift+P` → "Tasks: Run Task" → `🚀 Preview: lakeuden/index.html` |
| Python preview | `Ctrl+Shift+P` → "Tasks: Run Task" → `🐍 Preview Current File (Python)` |
| Open current in browser | `Ctrl+Shift+P` → "Tasks: Run Task" → `🌐 Open Current File in Browser` |
| Stop server | `Ctrl+Shift+P` → "Tasks: Run Task" → `🛑 Stop Preview Server` |
| **Quick F5 options** | `F5` → Select `🎯 Chrome: Current File (file://)` |

---

## 🛠️ Manual Server Commands

```bash
# Node.js - with specific file
node preview-server-simple.js 8080 lakeuden/index.html

# Node.js - default (lakeudena/index2.html)
node preview-server-simple.js 8080

# Python 3
python3 -m http.server 8080

# Python (Windows)
python -m http.server 8080

# PHP
php -S localhost:8080
```

Then open: http://localhost:8080/lakeuden/index.html (or whatever file you're working on)
