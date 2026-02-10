/**
 * Leaf Node Editor Component
 */

import { store } from './store.js';
import { db } from './db.js';

export class Editor {
  constructor() {
    this.nodeId = null;
    this.debounceTimer = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Title
    document.getElementById('editor-title').addEventListener('input', () => {
      this.scheduleSave();
    });

    // Icon picker
    document.getElementById('node-icon').addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('icon-dropdown').classList.toggle('hidden');
    });

    document.querySelectorAll('.icon-grid span').forEach(span => {
      span.addEventListener('click', () => {
        const icon = span.dataset.icon;
        document.getElementById('node-icon').textContent = icon;
        document.getElementById('icon-dropdown').classList.add('hidden');
        this.scheduleSave();
      });
    });

    // Template
    document.getElementById('apply-template').addEventListener('click', () => {
      this.applyTemplate();
    });

    // Add field
    document.getElementById('add-field').addEventListener('click', () => {
      this.addField('', '');
    });

    // Markdown
    document.getElementById('markdown-editor').addEventListener('input', () => {
      this.scheduleSave();
    });

    // Tags
    document.getElementById('tag-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addTag(e.target.value.trim());
        e.target.value = '';
      }
    });

    document.getElementById('tag-input').addEventListener('blur', (e) => {
      if (e.target.value.trim()) {
        this.addTag(e.target.value.trim());
        e.target.value = '';
      }
    });

    // Actions
    document.getElementById('save-btn').addEventListener('click', () => {
      this.forceSave();
    });

    document.getElementById('toggle-active-btn').addEventListener('click', () => {
      this.toggleActive();
    });

    document.getElementById('close-editor-btn').addEventListener('click', () => {
      this.closeEditor();
    });

    document.getElementById('duplicate-btn').addEventListener('click', () => {
      if (this.nodeId) {
        store.duplicateNode(this.nodeId);
      }
    });

    document.getElementById('delete-btn').addEventListener('click', () => {
      if (this.nodeId) {
        this.showDeleteConfirmation(this.nodeId);
      }
    });

    // Links
    document.getElementById('add-link').addEventListener('click', () => {
      this.showLinkModal();
    });

    // Save when leaving page (important for mobile)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.nodeId) {
        this.forceSave();
      }
    });

    // Save on beforeunload
    window.addEventListener('beforeunload', () => {
      if (this.nodeId) {
        this.forceSave();
      }
    });
  }

  async load(nodeId) {
    this.nodeId = nodeId;
    const node = store.getNode(nodeId);

    // Get content directly without triggering selectionChanged event
    const content = await db.getContent(nodeId);

    if (!node || !content) return;

    // Load basic info
    document.getElementById('node-icon').textContent = content.icon || '📄';
    document.getElementById('editor-title').value = node.name;

    // Load template selection
    document.getElementById('template-select').value = this.detectTemplate(content.fields) || '';

    // Load fields
    this.renderFields(content.fields || {});

    // Load markdown
    document.getElementById('markdown-editor').value = content.markdown || '';

    // Load tags
    this.renderTags(content.tags || []);

    // Load links
    this.renderLinks(content.links || []);

    // Update active button state
    this.updateActiveButton(node.active);

    // Clear save indicator
    this.showSaveIndicator(false);
  }

  toggleActive() {
    if (!this.nodeId) return;
    store.toggleActive(this.nodeId);
  }

  updateActiveButton(isActive) {
    const btn = document.getElementById('toggle-active-btn');
    const icon = btn.querySelector('i');
    if (isActive) {
      btn.classList.add('active');
      btn.title = 'Mark as Inactive (Ctrl+B)';
      icon.classList.remove('fa-regular');
      icon.classList.add('fa-solid');
    } else {
      btn.classList.remove('active');
      btn.title = 'Mark as Active (Ctrl+B)';
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    }
  }

  renderFields(fields) {
    const container = document.getElementById('fields-list');
    container.innerHTML = '';

    for (const [key, value] of Object.entries(fields)) {
      this.addField(key, value, false);
    }
  }

  addField(key = '', value = '', focus = true) {
    const container = document.getElementById('fields-list');

    const fieldEl = document.createElement('div');
    fieldEl.className = 'field-item';
    fieldEl.innerHTML = `
      <label>
        <input type="text" class="field-key" value="${this.escapeHtml(key)}" placeholder="Field name">
        <button type="button" class="remove-field" title="Remove field"><i class="fas fa-times"></i></button>
      </label>
      <textarea class="field-value" placeholder="Value">${this.escapeHtml(value)}</textarea>
    `;

    container.appendChild(fieldEl);

    // Event listeners
    const keyInput = fieldEl.querySelector('.field-key');
    const valueInput = fieldEl.querySelector('.field-value');
    const removeBtn = fieldEl.querySelector('.remove-field');

    keyInput.addEventListener('input', () => this.scheduleSave());
    valueInput.addEventListener('input', () => this.scheduleSave());
    removeBtn.addEventListener('click', () => {
      fieldEl.remove();
      this.scheduleSave();
    });

    if (focus) {
      keyInput.focus();
    }
  }

  renderTags(tags) {
    const container = document.getElementById('tags-list');
    container.innerHTML = '';

    for (const tag of tags) {
      const tagEl = document.createElement('span');
      tagEl.className = 'tag';
      tagEl.innerHTML = `
        ${this.escapeHtml(tag)}
        <button type="button" data-tag="${this.escapeHtml(tag)}"><i class="fas fa-times"></i></button>
      `;

      tagEl.querySelector('button').addEventListener('click', () => {
        this.removeTag(tag);
      });

      container.appendChild(tagEl);
    }
  }

  addTag(tag) {
    if (!tag) return;

    const content = store.currentContent;
    if (!content) return;

    const tags = [...(content.tags || [])];
    if (!tags.includes(tag)) {
      tags.push(tag);
      store.updateContent({ tags });
      this.renderTags(tags);
    }
  }

  removeTag(tag) {
    const content = store.currentContent;
    if (!content) return;

    const tags = (content.tags || []).filter(t => t !== tag);
    store.updateContent({ tags });
    this.renderTags(tags);
  }

  renderLinks(links) {
    const container = document.getElementById('links-list');
    container.innerHTML = '';

    for (const linkedId of links) {
      const linkedNode = store.getNode(linkedId);
      if (!linkedNode) continue;

      const linkEl = document.createElement('div');
      linkEl.className = 'link-item';
      linkEl.innerHTML = `
        <span>${linkedNode.type === 'folder' ? '📁' : '📄'}</span>
        <span>${this.escapeHtml(linkedNode.name)}</span>
        <button type="button" data-id="${linkedId}"><i class="fas fa-times"></i></button>
      `;

      linkEl.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
          store.selectNode(linkedId);
        }
      });

      linkEl.querySelector('button').addEventListener('click', () => {
        this.removeLink(linkedId);
      });

      container.appendChild(linkEl);
    }
  }

  showLinkModal() {
    const modal = document.getElementById('link-modal');
    const input = document.getElementById('link-search-input');
    const results = document.getElementById('link-search-results');

    modal.classList.remove('hidden');
    input.value = '';
    input.focus();
    results.innerHTML = '';

    const updateResults = () => {
      const query = input.value.trim();
      results.innerHTML = '';

      if (!query) {
        // Show recent nodes or all leaf nodes
        const nodes = Array.from(store.nodes.values())
          .filter(n => n.id !== this.nodeId && n.type === 'leaf')
          .slice(0, 10);

        for (const node of nodes) {
          this.addLinkResult(node, results);
        }
        return;
      }

      const searchResults = store.search(query, 10);
      for (const { node } of searchResults) {
        if (node.id !== this.nodeId) {
          this.addLinkResult(node, results);
        }
      }
    };

    input.addEventListener('input', updateResults);
    updateResults();

    document.getElementById('link-cancel').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  addLinkResult(node, container) {
    const el = document.createElement('div');
    el.className = 'search-result-item';
    el.innerHTML = `
      <div class="result-title">
        <span>${node.type === 'folder' ? '📁' : '📄'}</span>
        <span>${this.escapeHtml(node.name)}</span>
      </div>
      <div class="result-path">${store.getNodePath(node.id).map(n => n.name).join(' > ')}</div>
    `;

    el.addEventListener('click', () => {
      this.addLink(node.id);
      document.getElementById('link-modal').classList.add('hidden');
    });

    container.appendChild(el);
  }

  addLink(linkedId) {
    const content = store.currentContent;
    if (!content) return;

    const links = [...(content.links || [])];
    if (!links.includes(linkedId)) {
      links.push(linkedId);
      store.updateContent({ links });
      this.renderLinks(links);
    }
  }

  removeLink(linkedId) {
    const content = store.currentContent;
    if (!content) return;

    const links = (content.links || []).filter(id => id !== linkedId);
    store.updateContent({ links });
    this.renderLinks(links);
  }

  applyTemplate() {
    const template = document.getElementById('template-select').value;
    const fields = store.getTemplateFields(template);

    // Merge with existing fields
    const currentFields = this.collectFields();
    const mergedFields = { ...fields, ...currentFields };

    this.renderFields(mergedFields);
    this.scheduleSave();
  }

  detectTemplate(fields) {
    if (!fields || Object.keys(fields).length === 0) return '';

    const fieldKeys = Object.keys(fields);

    // Check which template matches best
    const templates = {
      npc: ['Role', 'Species', 'Alignment'],
      location: ['Type', 'Region', 'Climate'],
      item: ['Type', 'Rarity', 'Attunement'],
      quest: ['Status', 'Level', 'Giver'],
      monster: ['CR', 'AC', 'HP'],
      faction: ['Type', 'Alignment', 'Leader']
    };

    for (const [template, templateFields] of Object.entries(templates)) {
      const matches = templateFields.filter(f => fieldKeys.includes(f)).length;
      if (matches >= 2) return template;
    }

    return '';
  }

  collectFields() {
    const fields = {};
    document.querySelectorAll('.field-item').forEach(item => {
      const key = item.querySelector('.field-key').value.trim();
      const value = item.querySelector('.field-value').value.trim();
      if (key) {
        fields[key] = value;
      }
    });
    return fields;
  }

  scheduleSave() {
    this.showSaveIndicator(false);

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.save();
    }, 500);
  }

  async forceSave() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    await this.save();
  }

  async save() {
    if (!this.nodeId) return;

    const node = store.getNode(this.nodeId);
    if (!node) return;

    const title = document.getElementById('editor-title').value.trim() || node.name;
    const icon = document.getElementById('node-icon').textContent;
    const markdown = document.getElementById('markdown-editor').value;
    const fields = this.collectFields();

    // Update node name if changed
    if (title !== node.name) {
      await store.updateNode(this.nodeId, { name: title });
    }

    // Update content
    await store.updateContent({
      icon,
      markdown,
      fields
    });

    this.showSaveIndicator(true);
  }

  showSaveIndicator(saved) {
    const indicator = document.getElementById('save-indicator');
    if (saved) {
      indicator.textContent = 'Saved';
      indicator.classList.add('visible');
      setTimeout(() => {
        indicator.classList.remove('visible');
      }, 2000);
    } else {
      indicator.textContent = 'Unsaved';
      indicator.classList.add('visible');
    }
  }

  closeEditor() {
    // Save before closing
    this.forceSave();

    // Clear selection and show empty state
    store.selectNode(null);

    // Clear editor state
    this.nodeId = null;
  }

  showDeleteConfirmation(nodeId) {
    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('confirm-title');
    const message = document.getElementById('confirm-message');

    title.textContent = 'Delete Note';
    message.textContent = 'Are you sure you want to delete this note? This action cannot be undone.';

    modal.classList.remove('hidden');

    document.getElementById('confirm-ok').onclick = async () => {
      modal.classList.add('hidden');
      await store.deleteNode(nodeId);
    };

    document.getElementById('confirm-cancel').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
