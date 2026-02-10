/**
 * Tree Navigation Component
 */

import { store } from '../core/store.js';
import { db } from '../core/db.js';

export class TreeRenderer {
  constructor() {
    this.container = document.getElementById('tree-container');
    this.contextMenu = document.getElementById('context-menu');
    this.contextNodeId = null;
    this.draggedNodeId = null;

    this.setupContextMenu();
  }

  render() {
    this.container.innerHTML = '';

    // Render root nodes
    for (const nodeId of store.rootNodes) {
      const node = store.getNode(nodeId);
      if (node) {
        this.renderNode(node, this.container);
      }
    }

    if (store.rootNodes.length === 0) {
      this.container.innerHTML = `
        <div class="empty-tree">
          <p style="color: var(--text-muted); text-align: center; padding: 40px 20px; font-size: 0.9rem;">
            No notes yet.<br>Click "New Folder" or "New Note" to get started.
          </p>
        </div>
      `;
    }
  }

  renderNode(node, container) {
    const nodeEl = document.createElement('div');
    nodeEl.className = 'tree-node';
    nodeEl.dataset.id = node.id;

    const isExpanded = store.isExpanded(node.id);
    const children = store.getChildren(node.id);
    const hasChildren = children.length > 0;
    const isSelected = store.selectedNodeId === node.id;
    const isFolder = node.type === 'folder';

    nodeEl.innerHTML = `
      <div class="tree-node-content ${isSelected ? 'active' : ''}" draggable="true">
        <span class="tree-toggle ${hasChildren ? '' : 'hidden'}">
          <i class="fas fa-chevron-${isExpanded ? 'down' : 'right'}"></i>
        </span>
        <span class="tree-icon">${isFolder ? '📁' : this.getNodeIcon(node.id)}</span>
        <span class="tree-label">${this.escapeHtml(node.name)}</span>
      </div>
      <div class="tree-children ${isExpanded ? '' : 'collapsed'}"></div>
    `;

    const contentEl = nodeEl.querySelector('.tree-node-content');
    const toggleEl = nodeEl.querySelector('.tree-toggle');
    const childrenEl = nodeEl.querySelector('.tree-children');

    // Toggle expansion
    if (hasChildren) {
      toggleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        store.toggleExpanded(node.id);
        this.render();
      });
    }

    // Select node
    contentEl.addEventListener('click', () => {
      store.selectNode(node.id);
    });

    // Double-click to expand/collapse folders or rename
    contentEl.addEventListener('dblclick', () => {
      if (isFolder) {
        store.toggleExpanded(node.id);
        this.render();
      } else {
        this.startRenaming(node.id);
      }
    });

    // Context menu
    contentEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e, node.id);
    });

    // Drag and drop
    this.setupDragAndDrop(contentEl, node.id);

    // Render children
    if (hasChildren && isExpanded) {
      for (const child of children) {
        this.renderNode(child, childrenEl);
      }
    }

    container.appendChild(nodeEl);
  }

  setupDragAndDrop(element, nodeId) {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
      // Touch-based drag and drop for mobile
      this.setupTouchDragAndDrop(element, nodeId);
      element.removeAttribute('draggable');
      return;
    }

    // Desktop drag and drop
    element.addEventListener('dragstart', (e) => {
      this.draggedNodeId = nodeId;
      element.style.opacity = '0.5';
      e.dataTransfer.effectAllowed = 'move';
    });

    element.addEventListener('dragend', () => {
      element.style.opacity = '';
      this.draggedNodeId = null;
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
    });

    element.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedNodeId && this.draggedNodeId !== nodeId) {
        element.classList.add('drag-over');
      }
    });

    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });

    element.addEventListener('drop', async (e) => {
      e.preventDefault();
      element.classList.remove('drag-over');
      await this.handleDrop(nodeId);
    });
  }

  setupTouchDragAndDrop(element, nodeId) {
    let touchStartY = 0;
    let touchStartTime = 0;
    let longPressTimer = null;
    let isDragging = false;
    const LONG_PRESS_DURATION = 500;

    element.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
      touchStartTime = Date.now();
      
      // Start long press timer for drag initiation
      longPressTimer = setTimeout(() => {
        isDragging = true;
        this.draggedNodeId = nodeId;
        element.style.opacity = '0.5';
        element.classList.add('touch-dragging');
        
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
      }, LONG_PRESS_DURATION);
    }, { passive: true });

    element.addEventListener('touchmove', (e) => {
      if (!isDragging) {
        // Cancel long press if moved too much
        const touchY = e.touches[0].clientY;
        if (Math.abs(touchY - touchStartY) > 10) {
          clearTimeout(longPressTimer);
        }
        return;
      }
      
      e.preventDefault();
      const touch = e.touches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetNodeEl = targetEl?.closest('.tree-node-content');
      
      // Clear previous highlights
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      // Highlight current target
      if (targetNodeEl && targetNodeEl !== element) {
        targetNodeEl.classList.add('drag-over');
      }
    }, { passive: false });

    element.addEventListener('touchend', async (e) => {
      clearTimeout(longPressTimer);
      
      if (!isDragging) {
        // Check for quick swipe down to move to root
        const touchEndY = e.changedTouches[0].clientY;
        const touchDuration = Date.now() - touchStartTime;
        const swipeDistance = touchEndY - touchStartY;
        
        if (swipeDistance > 100 && touchDuration < 300) {
          // Swiped down - move to root
          const node = store.getNode(nodeId);
          if (node && node.parentId) {
            e.preventDefault();
            await store.moveNode(nodeId, null);
            if (navigator.vibrate) navigator.vibrate(100);
          }
        }
        return;
      }
      
      // Handle drop
      e.preventDefault();
      isDragging = false;
      element.style.opacity = '';
      element.classList.remove('touch-dragging');
      
      const touch = e.changedTouches[0];
      const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
      const targetNodeEl = targetEl?.closest('.tree-node');
      
      if (targetNodeEl) {
        const targetId = targetNodeEl.dataset.id;
        if (targetId && targetId !== this.draggedNodeId) {
          await this.handleDrop(targetId);
        }
      }
      
      // Clear highlights
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      
      this.draggedNodeId = null;
    });

    element.addEventListener('touchcancel', () => {
      clearTimeout(longPressTimer);
      isDragging = false;
      element.style.opacity = '';
      element.classList.remove('touch-dragging');
      document.querySelectorAll('.drag-over').forEach(el => {
        el.classList.remove('drag-over');
      });
      this.draggedNodeId = null;
    });
  }

  async handleDrop(targetNodeId) {
    if (!this.draggedNodeId || this.draggedNodeId === targetNodeId) return;
    
    const draggedNode = store.getNode(this.draggedNodeId);
    const targetNode = store.getNode(targetNodeId);
    if (!draggedNode || !targetNode) return;

    if (targetNode.type === 'folder') {
      // Move into folder
      await store.moveNode(this.draggedNodeId, targetNodeId);
      store.expandedNodes.add(targetNodeId);
    } else {
      // Move as sibling (same parent)
      await store.moveNode(this.draggedNodeId, targetNode.parentId);
    }
  }

  getNodeIcon(nodeId) {
    // Try to get icon from content, fallback to default
    const content = store.currentContent;
    if (content && content.nodeId === nodeId) {
      return content.icon || '📄';
    }
    // For now, return default - could be enhanced to cache icons
    return '📄';
  }

  setupContextMenu() {
    this.contextMenu.addEventListener('click', async (e) => {
      const item = e.target.closest('.context-item');
      if (!item) return;

      const action = item.dataset.action;
      await this.handleContextAction(action, this.contextNodeId);
      this.contextMenu.classList.add('hidden');
    });
  }

  showContextMenu(e, nodeId) {
    this.contextNodeId = nodeId;

    const rect = this.container.getBoundingClientRect();
    const x = Math.min(e.clientX, window.innerWidth - 180);
    const y = Math.min(e.clientY, window.innerHeight - 200);

    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.classList.remove('hidden');
  }

  async handleContextAction(action, nodeId) {
    const node = store.getNode(nodeId);
    if (!node) return;

    switch (action) {
      case 'new-folder':
        await this.startCreatingNode(nodeId, 'folder');
        break;
      case 'new-note':
        await this.showTemplateModal(nodeId);
        break;
      case 'rename':
        this.startRenaming(nodeId);
        break;
      case 'duplicate':
        await store.duplicateNode(nodeId);
        break;
      case 'export-subtree':
        await this.exportSubtree(nodeId);
        break;
      case 'move-to-root':
        if (node.parentId) {
          await store.moveNode(nodeId, null);
        }
        break;
      case 'delete':
        await this.showDeleteConfirmation(nodeId);
        break;
    }
  }

  async startCreatingNode(parentId, type) {
    // Create a temporary node for inline editing
    const container = parentId
      ? document.querySelector(`.tree-node[data-id="${parentId}"] .tree-children`)
      : this.container;

    if (!container) return;

    // Expand parent if creating inside a folder
    if (parentId) {
      store.expandedNodes.add(parentId);
      this.render();

      // Get the updated container after render
      const parentNode = document.querySelector(`.tree-node[data-id="${parentId}"]`);
      const childrenContainer = parentNode?.querySelector('.tree-children');
      if (childrenContainer) {
        this.showInlineInput(childrenContainer, parentId, type, true);
      }
    } else {
      this.showInlineInput(this.container, parentId, type, false);
    }
  }

  showInlineInput(container, parentId, type, appendToEnd) {
    const inputWrapper = document.createElement('div');
    inputWrapper.className = 'tree-node creating';
    inputWrapper.innerHTML = `
      <div class="tree-node-content">
        <span class="tree-toggle hidden"></span>
        <span class="tree-icon">${type === 'folder' ? '📁' : '📄'}</span>
        <input type="text" placeholder="${type === 'folder' ? 'Folder name' : 'Note name'}" />
      </div>
    `;

    const input = inputWrapper.querySelector('input');

    if (appendToEnd) {
      container.appendChild(inputWrapper);
    } else {
      container.insertBefore(inputWrapper, container.firstChild);
    }

    input.focus();

    let saved = false;

    const save = async () => {
      if (saved) return;
      saved = true;
      
      const name = input.value.trim();
      if (name) {
        const node = await store.createNode({
          name,
          type,
          parentId
        });

        if (type === 'leaf') {
          store.selectNode(node.id);
        }
      }
      inputWrapper.remove();
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        save();
      } else if (e.key === 'Escape') {
        saved = true; // Prevent save on blur
        inputWrapper.remove();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => save(), 100);
    });
  }

  startRenaming(nodeId) {
    const nodeEl = document.querySelector(`.tree-node[data-id="${nodeId}"] .tree-node-content`);
    if (!nodeEl) return;

    const node = store.getNode(nodeId);
    const labelEl = nodeEl.querySelector('.tree-label');

    const input = document.createElement('input');
    input.type = 'text';
    input.value = node.name;

    labelEl.replaceWith(input);
    input.focus();
    input.select();

    const save = async () => {
      const name = input.value.trim();
      if (name && name !== node.name) {
        await store.updateNode(nodeId, { name });
      } else {
        this.render();
      }
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        save();
      } else if (e.key === 'Escape') {
        this.render();
      }
    });

    input.addEventListener('blur', save);
  }

  async showDeleteConfirmation(nodeId) {
    const node = store.getNode(nodeId);
    if (!node) return;

    const modal = document.getElementById('confirm-modal');
    const title = document.getElementById('confirm-title');
    const message = document.getElementById('confirm-message');

    // Count children recursively
    const countChildren = (id) => {
      const children = store.getChildren(id);
      let count = children.length;
      for (const child of children) {
        count += countChildren(child.id);
      }
      return count;
    };

    const childCount = countChildren(nodeId);
    const childText = childCount > 0 ? ` (and ${childCount} child item${childCount > 1 ? 's' : ''})` : '';

    title.textContent = 'Delete Node';
    message.textContent = `Are you sure you want to delete "${node.name}"${childText}? This action cannot be undone.`;

    modal.classList.remove('hidden');

    document.getElementById('confirm-ok').onclick = async () => {
      modal.classList.add('hidden');
      await store.deleteNode(nodeId);
    };

    document.getElementById('confirm-cancel').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  async exportSubtree(nodeId) {
    const collectSubtree = async (id) => {
      const node = store.getNode(id);
      const content = node.type === 'leaf' ? await db.getContent(id) : null;
      const children = store.getChildren(id);

      const subtree = {
        node,
        content,
        children: []
      };

      for (const child of children) {
        subtree.children.push(await collectSubtree(child.id));
      }

      return subtree;
    };

    const subtree = await collectSubtree(nodeId);
    const blob = new Blob([JSON.stringify(subtree, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const node = store.getNode(nodeId);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${node.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-subtree.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
