/**
 * IndexedDB Storage Layer
 * Handles all database operations for the DnD Notes Vault
 */

const DB_NAME = 'DnDNotesVault';
const DB_VERSION = 2;

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;

        // Store for nodes (folders and leaves)
        if (!db.objectStoreNames.contains('nodes')) {
          const nodeStore = db.createObjectStore('nodes', { keyPath: 'id' });
          nodeStore.createIndex('parentId', 'parentId', { unique: false });
          nodeStore.createIndex('type', 'type', { unique: false });
        } else if (oldVersion < 2) {
          // Upgrade to v2: add active index
          const nodeStore = request.transaction.objectStore('nodes');
          if (!nodeStore.indexNames.contains('active')) {
            nodeStore.createIndex('active', 'active', { unique: false });
          }
        }

        // Store for leaf content
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'nodeId' });
        }

        // Store for search index (optional optimization)
        if (!db.objectStoreNames.contains('searchIndex')) {
          db.createObjectStore('searchIndex', { keyPath: 'nodeId' });
        }
      };
    });
  }

  // Node Operations
  async getAllNodes() {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['nodes'], 'readonly');
      const store = transaction.objectStore('nodes');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getNode(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['nodes'], 'readonly');
      const store = transaction.objectStore('nodes');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveNode(node) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['nodes'], 'readwrite');
      const store = transaction.objectStore('nodes');
      const request = store.put(node);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteNode(id) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['nodes', 'content'], 'readwrite');
      const nodeStore = transaction.objectStore('nodes');
      const contentStore = transaction.objectStore('content');

      // Delete node and its content
      nodeStore.delete(id);
      contentStore.delete(id);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getChildren(parentId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['nodes'], 'readonly');
      const store = transaction.objectStore('nodes');
      const index = store.index('parentId');
      const request = index.getAll(parentId);

      request.onsuccess = () => {
        const nodes = request.result;
        // Sort by orderIndex
        nodes.sort((a, b) => a.orderIndex - b.orderIndex);
        resolve(nodes);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Content Operations
  async getContent(nodeId) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['content'], 'readonly');
      const store = transaction.objectStore('content');
      const request = store.get(nodeId);

      request.onsuccess = () => resolve(request.result || this.getDefaultContent(nodeId));
      request.onerror = () => reject(request.error);
    });
  }

  async saveContent(content) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['content'], 'readwrite');
      const store = transaction.objectStore('content');
      const request = store.put(content);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Bulk Operations
  async exportAll() {
    const nodes = await this.getAllNodes();
    const contents = await new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['content'], 'readonly');
      const store = transaction.objectStore('content');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return {
      version: DB_VERSION,
      exportDate: new Date().toISOString(),
      nodes,
      contents
    };
  }

  async importAll(data) {
    return new Promise((resolve, reject) => {
      // Clear existing data
      const transaction = this.db.transaction(['nodes', 'content'], 'readwrite');
      const nodeStore = transaction.objectStore('nodes');
      const contentStore = transaction.objectStore('content');

      nodeStore.clear();
      contentStore.clear();

      // Import nodes
      if (data.nodes) {
        for (const node of data.nodes) {
          nodeStore.put(node);
        }
      }

      // Import content
      if (data.contents) {
        for (const content of data.contents) {
          contentStore.put(content);
        }
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  getDefaultContent(nodeId) {
    return {
      nodeId,
      markdown: '',
      fields: {},
      tags: [],
      links: [],
      icon: '📄',
      updatedAt: Date.now()
    };
  }
}

// Export singleton
export const db = new Database();
