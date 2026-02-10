/**
 * State Management Store
 * Central state management for the DnD Notes Vault
 */

import { db } from './db.js';

// Event emitter for state changes
class EventEmitter {
  constructor() {
    this.listeners = {};
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

class Store extends EventEmitter {
  constructor() {
    super();
    this.nodes = new Map(); // Flat map of all nodes by id
    this.rootNodes = []; // Array of root node ids
    this.expandedNodes = new Set(); // Set of expanded folder ids
    this.selectedNodeId = null;
    this.currentContent = null;
    this.searchIndex = new Map(); // In-memory search index
    this.initialized = false;
  }

  // Initialize store from database
  async init() {
    await db.init();
    await this.loadNodes();
    this.initialized = true;
    this.emit('initialized');
  }

  // Load all nodes from database
  async loadNodes() {
    const nodes = await db.getAllNodes();
    this.nodes.clear();
    this.rootNodes = [];

    for (const node of nodes) {
      this.nodes.set(node.id, node);
      if (!node.parentId) {
        this.rootNodes.push(node.id);
      }
    }

    // Sort root nodes by orderIndex
    this.rootNodes.sort((a, b) => {
      const nodeA = this.nodes.get(a);
      const nodeB = this.nodes.get(b);
      return nodeA.orderIndex - nodeB.orderIndex;
    });

    this.buildSearchIndex();
    this.emit('nodesChanged');
  }

  // Build in-memory search index
  buildSearchIndex() {
    this.searchIndex.clear();
    for (const node of this.nodes.values()) {
      this.searchIndex.set(node.id, {
        id: node.id,
        name: node.name.toLowerCase(),
        type: node.type,
        path: this.getNodePath(node.id).map(n => n.name).join(' > ').toLowerCase()
      });
    }
  }

  // Search nodes
  search(query, limit = 20) {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const results = [];

    for (const [id, indexed] of this.searchIndex) {
      const score = this.calculateSearchScore(lowerQuery, indexed);
      if (score > 0) {
        const node = this.nodes.get(id);
        results.push({ node, score, path: this.getNodePath(id) });
      }
    }

    // Sort by score (higher is better)
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  calculateSearchScore(query, indexed) {
    let score = 0;

    // Exact name match
    if (indexed.name === query) score += 100;
    // Name starts with query
    else if (indexed.name.startsWith(query)) score += 50;
    // Name contains query
    else if (indexed.name.includes(query)) score += 20;
    // Path contains query
    if (indexed.path.includes(query)) score += 10;

    return score;
  }

  // Get node by id
  getNode(id) {
    return this.nodes.get(id);
  }

  // Get children of a node
  getChildren(parentId) {
    const children = [];
    for (const node of this.nodes.values()) {
      if (node.parentId === parentId) {
        children.push(node);
      }
    }
    return children.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  // Get path from root to node
  getNodePath(nodeId) {
    const path = [];
    let current = this.nodes.get(nodeId);

    while (current) {
      path.unshift(current);
      current = current.parentId ? this.nodes.get(current.parentId) : null;
    }

    return path;
  }

  // Create a new node
  async createNode({ name, type, parentId = null, template = null, icon = null, active = false }) {
    const siblings = this.getChildren(parentId);
    const orderIndex = siblings.length;

    const node = {
      id: this.generateId(),
      parentId,
      type,
      name,
      orderIndex,
      active,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.saveNode(node);
    this.nodes.set(node.id, node);

    if (!parentId) {
      this.rootNodes.push(node.id);
    }

    // Create default content for leaf nodes
    if (type === 'leaf') {
      const content = db.getDefaultContent(node.id);
      content.icon = icon || this.getDefaultIcon(template);
      if (template) {
        content.fields = this.getTemplateFields(template);
      }
      await db.saveContent(content);
    }

    this.buildSearchIndex();
    this.emit('nodeCreated', node);
    this.emit('nodesChanged');

    return node;
  }

  // Update a node
  async updateNode(id, updates) {
    const node = this.nodes.get(id);
    if (!node) return null;

    const updated = { ...node, ...updates, updatedAt: Date.now() };
    await db.saveNode(updated);
    this.nodes.set(id, updated);

    if (updates.name !== undefined) {
      this.buildSearchIndex();
    }

    this.emit('nodeUpdated', updated);
    return updated;
  }

  // Delete a node and all its children
  async deleteNode(id) {
    const node = this.nodes.get(id);
    if (!node) return;

    // Recursively delete children
    const children = this.getChildren(id);
    for (const child of children) {
      await this.deleteNode(child.id);
    }

    await db.deleteNode(id);
    this.nodes.delete(id);

    if (!node.parentId) {
      this.rootNodes = this.rootNodes.filter(nodeId => nodeId !== id);
    }

    if (this.selectedNodeId === id) {
      this.selectedNodeId = null;
      this.currentContent = null;
      this.emit('selectionChanged', null);
    }

    this.buildSearchIndex();
    this.emit('nodeDeleted', id);
    this.emit('nodesChanged');
  }

  // Move a node to a new parent
  async moveNode(nodeId, newParentId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    // Prevent moving into own descendants
    if (this.isDescendant(newParentId, nodeId)) {
      throw new Error('Cannot move a node into its own descendant');
    }

    const siblings = this.getChildren(newParentId);
    const updated = {
      ...node,
      parentId: newParentId,
      orderIndex: siblings.length,
      updatedAt: Date.now()
    };

    await db.saveNode(updated);
    this.nodes.set(nodeId, updated);

    if (!node.parentId) {
      this.rootNodes = this.rootNodes.filter(id => id !== nodeId);
    }
    if (!newParentId) {
      this.rootNodes.push(nodeId);
      this.rootNodes.sort((a, b) => {
        const nodeA = this.nodes.get(a);
        const nodeB = this.nodes.get(b);
        return nodeA.orderIndex - nodeB.orderIndex;
      });
    }

    this.buildSearchIndex();
    this.emit('nodeMoved', updated);
    this.emit('nodesChanged');
  }

  // Reorder nodes
  async reorderNode(nodeId, newIndex) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const siblings = this.getChildren(node.parentId);
    const oldIndex = siblings.findIndex(n => n.id === nodeId);

    if (oldIndex === -1 || oldIndex === newIndex) return;

    // Remove from old position and insert at new position
    siblings.splice(oldIndex, 1);
    siblings.splice(newIndex, 0, node);

    // Update orderIndex for all siblings
    for (let i = 0; i < siblings.length; i++) {
      const sibling = siblings[i];
      if (sibling.orderIndex !== i) {
        sibling.orderIndex = i;
        sibling.updatedAt = Date.now();
        await db.saveNode(sibling);
        this.nodes.set(sibling.id, sibling);
      }
    }

    this.emit('nodesChanged');
  }

  // Toggle active status
  async toggleActive(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node || node.type !== 'leaf') return null;

    const updated = await this.updateNode(nodeId, { active: !node.active });
    this.emit('activeChanged', nodeId);
    return updated;
  }

  // Get all active notes
  getActiveNotes() {
    const activeNodes = [];
    for (const node of this.nodes.values()) {
      if (node.type === 'leaf' && node.active) {
        activeNodes.push(node);
      }
    }
    // Sort by most recently updated
    return activeNodes.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  // Duplicate a node
  async duplicateNode(nodeId) {
    const node = this.nodes.get(nodeId);
    if (!node) return;

    const newName = `${node.name} (Copy)`;
    const newNode = await this.createNode({
      name: newName,
      type: node.type,
      parentId: node.parentId
    });

    if (node.type === 'leaf') {
      const content = await db.getContent(nodeId);
      const newContent = {
        ...content,
        nodeId: newNode.id
      };
      await db.saveContent(newContent);
    }

    // Duplicate children recursively
    const children = this.getChildren(nodeId);
    for (const child of children) {
      await this.duplicateNodeRecursive(child.id, newNode.id);
    }

    return newNode;
  }

  async duplicateNodeRecursive(nodeId, newParentId) {
    const node = this.nodes.get(nodeId);
    const newNode = await this.createNode({
      name: node.name,
      type: node.type,
      parentId: newParentId
    });

    if (node.type === 'leaf') {
      const content = await db.getContent(nodeId);
      const newContent = { ...content, nodeId: newNode.id };
      await db.saveContent(newContent);
    }

    const children = this.getChildren(nodeId);
    for (const child of children) {
      await this.duplicateNodeRecursive(child.id, newNode.id);
    }
  }

  // Select a node
  async selectNode(nodeId) {
    this.selectedNodeId = nodeId;

    if (nodeId) {
      this.currentContent = await db.getContent(nodeId);
    } else {
      this.currentContent = null;
    }

    this.emit('selectionChanged', nodeId);
  }

  // Update current content
  async updateContent(updates) {
    if (!this.selectedNodeId || !this.currentContent) return;

    const updated = {
      ...this.currentContent,
      ...updates,
      updatedAt: Date.now()
    };

    await db.saveContent(updated);
    this.currentContent = updated;
    this.emit('contentChanged', updated);

    // Update search index if tags changed
    if (updates.tags !== undefined) {
      this.buildSearchIndex();
    }
  }

  // Toggle folder expansion
  toggleExpanded(nodeId) {
    if (this.expandedNodes.has(nodeId)) {
      this.expandedNodes.delete(nodeId);
    } else {
      this.expandedNodes.add(nodeId);
    }
    this.emit('expansionChanged', nodeId);
  }

  isExpanded(nodeId) {
    return this.expandedNodes.has(nodeId);
  }

  // Check if node is a descendant of another
  isDescendant(potentialDescendant, ancestorId) {
    if (potentialDescendant === ancestorId) return true;
    if (!potentialDescendant) return false;

    const node = this.nodes.get(potentialDescendant);
    if (!node) return false;

    return this.isDescendant(node.parentId, ancestorId);
  }

  // Export vault
  async exportVault() {
    return await db.exportAll();
  }

  // Import vault
  async importVault(data) {
    await db.importAll(data);
    await this.loadNodes();
    this.selectedNodeId = null;
    this.currentContent = null;
    this.expandedNodes.clear();
    this.emit('selectionChanged', null);
  }

  // Helper methods
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getDefaultIcon(template) {
    const icons = {
      npc: '👤',
      location: '🏰',
      item: '🗡️',
      quest: '📜',
      monster: '🐉',
      faction: '⚔️',
      default: '📄'
    };
    return icons[template] || icons.default;
  }

  getTemplateFields(template) {
    const templates = {
      npc: {
        'Role': '',
        'Species': '',
        'Alignment': '',
        'Age': '',
        'Personality': '',
        'Appearance': '',
        'Motivations': '',
        'Secrets': ''
      },
      location: {
        'Type': '',
        'Region': '',
        'Climate': '',
        'Population': '',
        'Ruler': '',
        'Notable Features': ''
      },
      item: {
        'Type': '',
        'Rarity': '',
        'Attunement': '',
        'Value': '',
        'Weight': '',
        'Properties': ''
      },
      quest: {
        'Status': 'Active',
        'Level': '',
        'Giver': '',
        'Reward': '',
        'Location': '',
        'Objective': ''
      },
      monster: {
        'CR': '',
        'AC': '',
        'HP': '',
        'Speed': '',
        'Abilities': '',
        'Weaknesses': '',
        'Resistances': ''
      },
      faction: {
        'Type': '',
        'Alignment': '',
        'Leader': '',
        'Headquarters': '',
        'Goals': '',
        'Notable Members': ''
      }
    };

    return templates[template] || {};
  }
}

// Export singleton
export const store = new Store();
