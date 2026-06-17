import { create } from 'zustand';

export const useSidebarStore = create((set) => ({
  /* expanded folders */
  expandedIds: new Set(),
  toggleExpand: (id) =>
    set((s) => {
      const next = new Set(s.expandedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { expandedIds: next };
    }),
  expand: (id) =>
    set((s) => ({ expandedIds: new Set([...s.expandedIds, id]) })),

  /* inline rename */
  editingId: null,
  editingName: '',
  startEdit: (id, name) => set({ editingId: id, editingName: name, menuId: null }),
  changeEditName: (name) => set({ editingName: name }),
  cancelEdit: () => set({ editingId: null }),

  /* context menu */
  menuId: null,
  openMenu: (id) => set((s) => ({ menuId: s.menuId === id ? null : id })),
  closeMenu: () => set({ menuId: null }),

  /* move picker */
  movePickerId: null,
  openMovePicker: (id) => set({ movePickerId: id, menuId: null }),
  closeMovePicker: () => set({ movePickerId: null }),

  /* new folder inline input — undefined=hidden, null=root, string=parentId */
  creatingIn: undefined,
  newFolderName: '',
  startNewFolder: (parentId) => set({ creatingIn: parentId, newFolderName: '' }),
  changeNewFolderName: (name) => set({ newFolderName: name }),
  cancelNewFolder: () => set({ creatingIn: undefined, newFolderName: '' }),

  /* type picker (new page) */
  addingPageIn: null, // null | 'root' | folderId
  setAddingPageIn: (id) => set({ addingPageIn: id }),

  /* drag-and-drop */
  draggingItem: null,   // { type: 'folder' | 'board', id }
  dropTargetId: undefined, // folderId | 'root' | undefined
  dndStart: (item) => set({ draggingItem: item }),
  dndEnd: () => set({ draggingItem: null, dropTargetId: undefined }),
  dndEnter: (id) => set({ dropTargetId: id }),
  dndLeave: (id) =>
    set((s) => ({ dropTargetId: s.dropTargetId === id ? undefined : s.dropTargetId })),
  dndClear: () => set({ draggingItem: null, dropTargetId: undefined }),
}));
