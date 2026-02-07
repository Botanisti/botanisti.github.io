# DnD Notes Vault

A fast, hierarchical note-taking application designed for DnD campaign management. Built with vanilla JavaScript and IndexedDB for local-first storage.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Core
- **Hierarchical Organization**: Unlimited nested folders and notes
- **Fast Search**: Command palette with instant results (Ctrl+K)
- **Rich Note Editor**: Markdown support with structured fields
- **Templates**: NPC, Location, Item, Quest, Monster, Faction
- **Local-First**: All data stored in IndexedDB
- **Export/Import**: Backup and restore your entire vault

### UI/UX
- Dark mode optimized for long sessions
- Keyboard-first workflow
- Drag-and-drop organization
- Breadcrumb navigation
- Tagging and internal linking

## Quick Start

### Running Locally

No build step required! Just serve the files with any static server:

```bash
# Using Python 3
python -m http.server 8080

# Using Node.js (npx)
npx serve .

# Using PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

### VS Code Live Server

If using VS Code with Live Server extension, just right-click `index.html` and select "Open with Live Server".

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open search/command palette |
| `Ctrl+N` | New note |
| `Ctrl+Shift+N` | New folder |
| `Ctrl+S` | Force save |
| `F2` | Rename selected node |
| `Del` | Delete selected node |
| `↑/↓` | Navigate tree or search results |
| `Enter` | Open selected |
| `Esc` | Close/cancel |

## Data Model

### Node (Folder or Leaf)
```typescript
interface Node {
  id: string;
  parentId: string | null;
  type: 'folder' | 'leaf';
  name: string;
  orderIndex: number;
  createdAt: number;
  updatedAt: number;
}
```

### Leaf Content
```typescript
interface Content {
  nodeId: string;
  icon: string;        // Emoji icon
  markdown: string;    // Markdown content
  fields: Record<string, string>;  // Structured fields
  tags: string[];
  links: string[];     // Internal links to other node IDs
  updatedAt: number;
}
```

## Templates

Templates provide predefined field sets for common DnD entities:

### NPC
- Role, Species, Alignment, Age
- Personality, Appearance
- Motivations, Secrets

### Location
- Type, Region, Climate
- Population, Ruler
- Notable Features

### Item
- Type, Rarity, Attunement
- Value, Weight, Properties

### Quest
- Status, Level, Giver
- Reward, Location, Objective

### Monster
- CR, AC, HP, Speed
- Abilities, Weaknesses, Resistances

### Faction
- Type, Alignment, Leader
- Headquarters, Goals, Notable Members

## Extending Templates

To add custom templates, edit the `getTemplateFields` method in `store.js`:

```javascript
getTemplateFields(template) {
  const templates = {
    // ... existing templates
    
    spell: {
      'Level': '',
      'School': '',
      'Casting Time': '',
      'Range': '',
      'Components': '',
      'Duration': '',
      'Description': ''
    }
  };
  
  return templates[template] || {};
}
```

Then add the template option to the HTML select elements in `index.html`:

```html
<option value="spell">Spell</option>
```

## Import/Export

### Export
Click the download button in the header to export your entire vault as a JSON file.

### Import
Click the upload button and select a previously exported JSON file. **Warning**: Importing will replace all current data.

### Export Format
```json
{
  "version": 1,
  "exportDate": "2024-01-15T10:30:00.000Z",
  "nodes": [...],
  "contents": [...]
}
```

## Architecture

```
app.js          - Main application, initialization, seed data
db.js           - IndexedDB wrapper
store.js        - Central state management, search index
tree.js         - Tree navigation component
editor.js       - Leaf node editor
search.js       - Command palette / search
styles.css      - All styling
index.html      - Main HTML structure
```

### Data Flow
1. User action → Event handler
2. Store update → Database persistence
3. State change → Component re-render
4. Auto-save with debouncing

## Browser Compatibility

- Chrome/Edge 80+
- Firefox 75+
- Safari 14+

Requires ES6 modules and IndexedDB support.

## Future Enhancements

- [ ] Server sync capability
- [ ] Markdown preview mode
- [ ] Dice roller integration
- [ ] Initiative tracker
- [ ] Calendar/timeline view
- [ ] Map attachments
- [ ] Collaborative editing

## License

MIT License - feel free to use for your campaigns!
