/**
 * Search / Command Palette Component
 */

import { store } from './store.js';

export class Search {
  constructor() {
    this.modal = document.getElementById('command-palette');
    this.input = document.getElementById('search-input');
    this.results = document.getElementById('search-results');
    this.selectedIndex = -1;
    this.currentResults = [];

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Open modal
    document.getElementById('search-trigger').addEventListener('click', () => {
      this.open();
    });

    // Close on overlay click
    this.modal.querySelector('.modal-overlay').addEventListener('click', () => {
      this.close();
    });

    // Input handling
    this.input.addEventListener('input', () => {
      this.performSearch();
    });

    this.input.addEventListener('keydown', (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.selectPrevious();
          break;
        case 'Enter':
          e.preventDefault();
          this.activateSelected();
          break;
        case 'Escape':
          this.close();
          break;
      }
    });
  }

  open() {
    this.modal.classList.remove('hidden');
    this.input.value = '';
    this.input.focus();
    this.selectedIndex = -1;
    this.performSearch();
  }

  close() {
    this.modal.classList.add('hidden');
    this.selectedIndex = -1;
  }

  performSearch() {
    const query = this.input.value.trim();
    this.results.innerHTML = '';
    this.selectedIndex = -1;
    this.currentResults = [];

    if (!query) {
      // Show recent/favorite nodes
      this.showRecentNodes();
      return;
    }

    // Search in store
    const searchResults = store.search(query, 15);

    for (const result of searchResults) {
      this.addResultItem(result);
    }

    // Add "Create new" option
    this.addCreateOption(query);

    this.currentResults = searchResults;

    if (searchResults.length === 0) {
      this.results.innerHTML = `
        <div class="no-results">
          No results found for "${this.escapeHtml(query)}"
        </div>
      `;
    }
  }

  showRecentNodes() {
    // Show recently updated leaf nodes
    const recentNodes = Array.from(store.nodes.values())
      .filter(n => n.type === 'leaf')
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 10);

    if (recentNodes.length === 0) {
      this.results.innerHTML = `
        <div class="no-results">
          Start typing to search your vault...
        </div>
      `;
      return;
    }

    for (const node of recentNodes) {
      this.addResultItem({
        node,
        path: store.getNodePath(node.id)
      });
    }
  }

  addResultItem(result) {
    const { node, path } = result;
    const el = document.createElement('div');
    el.className = 'search-result-item';
    el.dataset.id = node.id;

    const pathStr = path.map(p => p.name).join(' > ');
    const icon = node.type === 'folder' ? '📁' : (store.currentContent?.icon || '📄');

    el.innerHTML = `
      <div class="result-title">
        <span>${icon}</span>
        <span>${this.escapeHtml(node.name)}</span>
      </div>
      <div class="result-path">${this.escapeHtml(pathStr)}</div>
    `;

    el.addEventListener('click', () => {
      this.openNode(node.id);
    });

    this.results.appendChild(el);
  }

  addCreateOption(query) {
    const container = document.createElement('div');
    container.className = 'create-option';

    // Create folder option
    const folderOption = document.createElement('div');
    folderOption.className = 'search-result-item';
    folderOption.innerHTML = `
      <div class="result-title">
        <span>📁</span>
        <span>Create folder "${this.escapeHtml(query)}"</span>
      </div>
    `;
    folderOption.addEventListener('click', () => {
      this.createNode(query, 'folder');
    });

    // Create note option
    const noteOption = document.createElement('div');
    noteOption.className = 'search-result-item';
    noteOption.innerHTML = `
      <div class="result-title">
        <span>📄</span>
        <span>Create note "${this.escapeHtml(query)}"</span>
      </div>
    `;
    noteOption.addEventListener('click', () => {
      this.createNode(query, 'leaf');
    });

    container.appendChild(folderOption);
    container.appendChild(noteOption);
    this.results.appendChild(container);
  }

  selectNext() {
    const items = this.results.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
    this.updateSelection(items);
  }

  selectPrevious() {
    const items = this.results.querySelectorAll('.search-result-item');
    if (items.length === 0) return;

    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    this.updateSelection(items);
  }

  updateSelection(items) {
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.selectedIndex);
    });

    // Scroll selected into view
    const selected = items[this.selectedIndex];
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }

  activateSelected() {
    const items = this.results.querySelectorAll('.search-result-item');
    const selected = items[this.selectedIndex];

    if (selected) {
      selected.click();
    }
  }

  openNode(nodeId) {
    const node = store.getNode(nodeId);
    if (!node) return;

    this.close();

    // Expand all parents in path
    const path = store.getNodePath(nodeId);
    for (const parent of path) {
      if (parent.id !== nodeId && parent.type === 'folder') {
        store.expandedNodes.add(parent.id);
      }
    }

    store.selectNode(nodeId);
    store.emit('nodesChanged');
  }

  async createNode(name, type) {
    this.close();

    const node = await store.createNode({
      name,
      type,
      parentId: null
    });

    if (type === 'leaf') {
      store.selectNode(node.id);
    }

    store.emit('nodesChanged');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
