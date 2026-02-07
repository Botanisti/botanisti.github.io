/**
 * DnD Notes Vault - Main Application
 */

import { db } from './db.js';
import { store } from './store.js';
import { TreeRenderer } from './tree.js';
import { Editor } from './editor.js';
import { Search } from './search.js';

// Initialize the application
class App {
  constructor() {
    this.treeRenderer = new TreeRenderer();
    this.editor = new Editor();
    this.search = new Search();
    this.setupEventListeners();
  }

  async init() {
    try {
      await store.init();
      
      // Check if we have any data, if not seed with example data
      const nodes = Array.from(store.nodes.values());
      if (nodes.length === 0) {
        await this.seedExampleData();
      }

      this.treeRenderer.render();
      this.setupKeyboardShortcuts();
      
      console.log('DnD Notes Vault initialized');
    } catch (error) {
      console.error('Failed to initialize app:', error);
      alert('Failed to initialize the app. Please check console for details.');
    }
  }

  setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('collapsed');
    });

    // Root level creation buttons
    document.getElementById('new-folder-root').addEventListener('click', () => {
      this.treeRenderer.startCreatingNode(null, 'folder');
    });

    document.getElementById('new-note-root').addEventListener('click', () => {
      this.showTemplateModal(null);
    });

    // Sidebar close note button
    document.getElementById('close-note-sidebar-btn').addEventListener('click', () => {
      this.editor.closeEditor();
    });

    // Empty state button
    document.getElementById('empty-new-note').addEventListener('click', () => {
      this.showTemplateModal(null);
    });

    // Search
    document.getElementById('search-trigger').addEventListener('click', () => {
      this.search.open();
    });

    // Export/Import
    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportVault();
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      this.importVault(e.target.files[0]);
    });

    // Help modal
    document.getElementById('help-btn').addEventListener('click', () => {
      document.getElementById('help-modal').classList.remove('hidden');
    });

    document.getElementById('help-close').addEventListener('click', () => {
      document.getElementById('help-modal').classList.add('hidden');
    });

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        e.target.closest('.modal').classList.add('hidden');
      });
    });

    // Store events
    store.on('selectionChanged', (nodeId) => {
      this.onSelectionChanged(nodeId);
    });

    store.on('nodesChanged', () => {
      this.treeRenderer.render();
    });

    // Focus search when '/' is pressed
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !this.isInputFocused()) {
        e.preventDefault();
        this.search.open();
      }
    });

    // Hide context menu on click elsewhere
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.context-menu')) {
        document.getElementById('context-menu').classList.add('hidden');
      }
      if (!e.target.closest('.icon-picker')) {
        document.getElementById('icon-dropdown').classList.add('hidden');
      }
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;

      // Ctrl+K - Search
      if (isCtrl && e.key === 'k') {
        e.preventDefault();
        this.search.open();
      }

      // Ctrl+N - New Note
      if (isCtrl && e.key === 'n' && !e.shiftKey) {
        e.preventDefault();
        const selectedId = store.selectedNodeId;
        const parentId = selectedId ? store.getNode(selectedId)?.parentId : null;
        this.showTemplateModal(parentId);
      }

      // Ctrl+Shift+N - New Folder
      if (isCtrl && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        const selectedId = store.selectedNodeId;
        const parentId = selectedId ? store.getNode(selectedId)?.parentId : null;
        this.treeRenderer.startCreatingNode(parentId, 'folder');
      }

      // Ctrl+S - Save (force save)
      if (isCtrl && e.key === 's') {
        e.preventDefault();
        this.editor.forceSave();
      }

      // Escape - Close modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach(modal => {
          modal.classList.add('hidden');
        });
      }

      // F2 - Rename selected node
      if (e.key === 'F2' && store.selectedNodeId) {
        e.preventDefault();
        this.treeRenderer.startRenaming(store.selectedNodeId);
      }

      // Delete - Delete selected node
      if (e.key === 'Delete' && store.selectedNodeId) {
        e.preventDefault();
        this.showDeleteConfirmation(store.selectedNodeId);
      }
    });
  }

  onSelectionChanged(nodeId) {
    const emptyState = document.getElementById('empty-state');
    const editor = document.getElementById('editor');
    const breadcrumbs = document.getElementById('breadcrumbs');
    const closeNoteBar = document.getElementById('close-note-bar');

    if (!nodeId) {
      emptyState.classList.remove('hidden');
      editor.classList.add('hidden');
      breadcrumbs.innerHTML = '';
      if (closeNoteBar) closeNoteBar.classList.add('hidden');
      return;
    }

    const node = store.getNode(nodeId);
    if (!node) return;

    if (node.type === 'folder') {
      // Folders just show in tree, maybe expand/collapse
      store.toggleExpanded(nodeId);
      this.treeRenderer.render();
      
      // Clear main panel or show folder info
      emptyState.classList.remove('hidden');
      editor.classList.add('hidden');
      if (closeNoteBar) closeNoteBar.classList.add('hidden');
      this.updateBreadcrumbs(nodeId);
    } else {
      // Leaf node - show editor
      emptyState.classList.add('hidden');
      editor.classList.remove('hidden');
      if (closeNoteBar) closeNoteBar.classList.remove('hidden');
      this.editor.load(nodeId);
      this.updateBreadcrumbs(nodeId);
    }
  }

  updateBreadcrumbs(nodeId) {
    const breadcrumbs = document.getElementById('breadcrumbs');
    const path = store.getNodePath(nodeId);
    
    breadcrumbs.innerHTML = path.map((node, index) => `
      <span class="breadcrumb-item" data-id="${node.id}" style="cursor: pointer;">
        ${node.name}
      </span>
    `).join('');

    // Make breadcrumbs clickable
    breadcrumbs.querySelectorAll('.breadcrumb-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const node = store.getNode(id);
        if (node) {
          store.selectNode(id);
        }
      });
    });
  }

  showTemplateModal(parentId) {
    const modal = document.getElementById('template-modal');
    modal.classList.remove('hidden');

    const handleSelect = async (template) => {
      modal.classList.add('hidden');
      const node = await store.createNode({
        name: 'New Note',
        type: 'leaf',
        parentId,
        template: template || null
      });
      
      // Auto-expand parent
      if (parentId) {
        store.expandedNodes.add(parentId);
      }
      
      store.selectNode(node.id);
      
      // Focus title for immediate editing
      setTimeout(() => {
        document.getElementById('editor-title').focus();
        document.getElementById('editor-title').select();
      }, 50);
    };

    // Handle template selection
    modal.querySelectorAll('.template-option').forEach(btn => {
      btn.onclick = () => handleSelect(btn.dataset.template);
    });

    document.getElementById('template-cancel').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  showDeleteConfirmation(nodeId) {
    const node = store.getNode(nodeId);
    if (!node) return;

    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('confirm-title');
    const message = document.getElementById('confirm-message');

    title.textContent = 'Delete Node';
    message.textContent = `Are you sure you want to delete "${node.name}"? This action cannot be undone.`;

    modal.classList.remove('hidden');

    document.getElementById('confirm-ok').onclick = async () => {
      modal.classList.add('hidden');
      await store.deleteNode(nodeId);
    };

    document.getElementById('confirm-cancel').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  async exportVault() {
    try {
      const data = await store.exportVault();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `dnd-vault-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check console for details.');
    }
  }

  async importVault(file) {
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (confirm('This will replace all current data. Are you sure?')) {
        await store.importVault(data);
        alert('Import successful!');
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please check that the file is a valid vault export.');
    }

    // Reset file input
    document.getElementById('import-file').value = '';
  }

  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    );
  }

  async seedExampleData() {
    // Create folder structure and nodes
    
    // NPCs
    const npcFolder = await store.createNode({ name: 'NPCs', type: 'folder', parentId: null });
    const trollsFolder = await store.createNode({ name: 'Trolls', type: 'folder', parentId: npcFolder.id });
    const emeraldTrollsFolder = await store.createNode({ name: 'Emerald Trolls', type: 'folder', parentId: trollsFolder.id });
    
    const grahda = await store.createNode({ 
      name: 'Grahda', 
      type: 'leaf', 
      parentId: emeraldTrollsFolder.id,
      template: 'npc',
      icon: '🧌'
    });
    
    await db.saveContent({
      nodeId: grahda.id,
      icon: '🧌',
      markdown: `# Grahda\n\nAn ancient emerald troll who dwells in the deepest parts of the Midnight Marsh. Unlike most trolls, Grahda possesses surprising intelligence and cunning.\n\n## Personality\n- Slow to anger but terrifying when roused\n- Speaks in riddles\n- Has a strange fondness for collecting shiny objects\n\n## Role in Campaign\nGrahda guards the entrance to the Old Ruins and can provide crucial information about the Oil of Midnight if the party approaches with respect and offerings.`,
      fields: {
        'Role': 'Guardian of the Old Ruins',
        'Species': 'Emerald Troll',
        'Alignment': 'Neutral',
        'Age': '340 years',
        'Personality': 'Cunning, riddlesome, collector',
        'Appearance': '14ft tall, moss-covered skin that glows faintly green',
        'Motivations': 'Protecting ancient secrets, acquiring shiny treasures',
        'Secrets': 'Knows the true location of the Sunless Crown'
      },
      tags: ['troll', 'marsh', 'quest-giver', 'green-marsh'],
      links: [],
      updatedAt: Date.now()
    });

    // Locations
    const locationsFolder = await store.createNode({ name: 'Locations', type: 'folder', parentId: null });
    const swampsFolder = await store.createNode({ name: 'Swamps', type: 'folder', parentId: locationsFolder.id });
    
    const emeraldMire = await store.createNode({ 
      name: 'Emerald Mire', 
      type: 'leaf', 
      parentId: swampsFolder.id,
      template: 'location',
      icon: '🌲'
    });
    
    await db.saveContent({
      nodeId: emeraldMire.id,
      icon: '🌲',
      markdown: `# The Emerald Mire\n\nA vast swamp known for its phosphorescent plant life that gives the waters an eerie green glow.\n\n## Hazards\n- Quicksand patches\n- Disease-carrying insects\n- Will-o'-wisps that lead travelers astray\n\n## Notable Locations\n- Grahda\'s Mound\n- The Sunken Cathedral\n- Oil Springs`,
      fields: {
        'Type': 'Swamp',
        'Region': 'Western Marches',
        'Climate': 'Temperate, humid',
        'Population': 'Sparse (trolls, lizardfolk)',
        'Ruler': 'None (tribal territories)',
        'Notable Features': 'Phosphorescent flora, natural oil springs'
      },
      tags: ['swamp', 'hazardous', 'green-marsh'],
      links: [grahda.id],
      updatedAt: Date.now()
    });

    // Quests
    const questsFolder = await store.createNode({ name: 'Quests', type: 'folder', parentId: null });
    
    const oilQuest = await store.createNode({ 
      name: 'Oil in the Midnight Marsh', 
      type: 'leaf', 
      parentId: questsFolder.id,
      template: 'quest',
      icon: '📜'
    });
    
    await db.saveContent({
      nodeId: oilQuest.id,
      icon: '📜',
      markdown: `# Oil in the Midnight Marsh\n\nThe village of Millbrook needs magical oil from the Emerald Mire to fuel their protective lanterns during the Long Night.\n\n## Objectives\n1. Travel to the Emerald Mire\n2. Locate the natural oil springs\n3. Collect 3 vials of pure midnight oil\n4. Return to Millbrook before the new moon\n\n## Complications\n- The oil springs are near Grahda\'s territory\n- A rival adventuring party is also seeking the oil\n- The oil is toxic without proper preparation`,
      fields: {
        'Status': 'Active',
        'Level': '3-5',
        'Giver': 'Mayor Elara of Millbrook',
        'Reward': '500gp + Blessing of the Hearth',
        'Location': 'Emerald Mire',
        'Objective': 'Collect midnight oil for village lanterns'
      },
      tags: ['active', 'millbrook', 'emerald-mire', 'side-quest'],
      links: [emeraldMire.id, grahda.id],
      updatedAt: Date.now()
    });

    // Add a few more example NPCs
    const elara = await store.createNode({ 
      name: 'Mayor Elara', 
      type: 'leaf', 
      parentId: npcFolder.id,
      template: 'npc',
      icon: '👤'
    });
    
    await db.saveContent({
      nodeId: elara.id,
      icon: '👤',
      markdown: `# Mayor Elara\n\nThe capable but stressed mayor of Millbrook. She's been trying to keep the village safe as the Long Night approaches.`,
      fields: {
        'Role': 'Mayor of Millbrook',
        'Species': 'Human',
        'Alignment': 'Lawful Good',
        'Age': '52',
        'Personality': 'Worried, dedicated, practical',
        'Appearance': 'Gray-streaked hair, worn official robes',
        'Motivations': 'Protecting her village',
        'Secrets': 'The village funds are nearly depleted'
      },
      tags: ['millbrook', 'quest-giver', 'human'],
      links: [oilQuest.id],
      updatedAt: Date.now()
    });

    // Expand root folders by default
    store.expandedNodes.add(npcFolder.id);
    store.expandedNodes.add(locationsFolder.id);
    store.expandedNodes.add(questsFolder.id);
    store.expandedNodes.add(trollsFolder.id);
    store.expandedNodes.add(emeraldTrollsFolder.id);
    store.expandedNodes.add(swampsFolder.id);

    console.log('Example data seeded');
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
