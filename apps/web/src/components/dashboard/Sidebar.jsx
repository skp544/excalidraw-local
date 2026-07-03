import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Home, Star, Archive, Layers, Plus, Folder, FolderOpen,
  Search, Settings, ChevronsLeft, ChevronsRight, BookTemplate,
  ChevronRight, MoreHorizontal, Pencil, Trash2, FolderInput, FolderUp,
  Layout, FileText, FolderPlus, X,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo.jsx';
import { useUIStore } from '@/stores/ui-store.js';
import { useSidebarStore } from '@/stores/sidebar-store.js';
import {
  useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder,
  useBoardsAll, useCreateBoard, useUpdateBoard,
} from '@/hooks/use-boards.js';
import { cn } from '@/lib/cn.js';

/* ── Helpers ────────────────────────────────────────────────────────────── */

function getDescendantIds(folderId, folders) {
  const result = new Set();
  const queue = [folderId];
  while (queue.length) {
    const id = queue.shift();
    for (const f of folders) {
      if (f.parentId === id) { result.add(f.id); queue.push(f.id); }
    }
  }
  return result;
}

function makeDragGhost(label) {
  const el = document.createElement('div');
  el.textContent = label;
  el.style.cssText =
    'position:fixed;top:-999px;left:-999px;padding:4px 10px;border-radius:6px;' +
    'background:#1e1e2e;color:#fff;font-size:12px;white-space:nowrap;pointer-events:none';
  document.body.appendChild(el);
  setTimeout(() => document.body.removeChild(el), 0);
  return el;
}

/* ── Nav items ──────────────────────────────────────────────────────────── */

const NAV = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/?favorite=1', icon: Star, label: 'Favorites', exact: true },
  { to: '/?archived=1', icon: Archive, label: 'Archived', exact: true },
  { to: '/templates', icon: BookTemplate, label: 'Templates' },
  { to: '/activity', icon: Layers, label: 'Activity' },
];

/* ── Sidebar shell ──────────────────────────────────────────────────────── */

const MIN_WIDTH = 180;
const MAX_WIDTH = 520;

export function Sidebar({ onCreateBoard, onOpenCommandPalette }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);

  const navigate = useNavigate();
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef({ startX: 0, startWidth: 268 });

  const startResize = (e) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e) => {
      const delta = e.clientX - resizeRef.current.startX;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, resizeRef.current.startWidth + delta)));
    };
    const onUp = () => setIsResizing(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isResizing, setSidebarWidth]);

  useEffect(() => {
    document.body.style.cursor = isResizing ? 'col-resize' : '';
    document.body.style.userSelect = isResizing ? 'none' : '';
    return () => { document.body.style.cursor = ''; document.body.style.userSelect = ''; };
  }, [isResizing]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 52 : sidebarWidth }}
      transition={isResizing ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 32 }}
      className="relative z-20 flex h-full flex-col bg-ink-50/60 dark:bg-ink-950/80"
      style={{ borderRight: '1px solid rgba(0,0,0,0.07)' }}
    >
      {/* Header */}
      <div className={cn('flex h-12 flex-shrink-0 items-center justify-between px-3', collapsed && 'justify-center px-2')}>
        <button onClick={() => navigate('/')} className="flex min-w-0 items-center gap-2 rounded-md focus-ring">
          <Logo withWordmark={false} />
          {!collapsed && (
            <span className="truncate text-[13px] font-semibold text-ink-800 dark:text-ink-100">ExcaliRow</span>
          )}
        </button>
        {!collapsed && (
          <button onClick={toggleSidebar} className="ml-1 flex-shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-200/60 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-300" title="Collapse sidebar">
            <ChevronsLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-2 pb-2">
          <button
            onClick={onOpenCommandPalette}
            className="flex w-full items-center gap-2 rounded-md bg-ink-100/70 px-2.5 py-1.5 text-left text-[12px] text-ink-400 transition hover:bg-ink-200/60 hover:text-ink-600 dark:bg-ink-800/50 dark:text-ink-500 dark:hover:bg-ink-800 dark:hover:text-ink-300"
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="flex-1">Search</span>
            <kbd className="rounded border border-ink-200/80 bg-white/70 px-1 py-px text-[10px] text-ink-400 dark:border-ink-700 dark:bg-ink-900/60">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-1.5 scrollbar-thin">
        <ul className="space-y-px">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2.5 rounded-md px-2 py-[5px] text-[13px] transition',
                    'text-ink-500 hover:bg-ink-200/50 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-200',
                    isActive && 'bg-ink-200/60 font-medium text-ink-800 dark:bg-ink-800/70 dark:text-ink-100',
                    collapsed && 'justify-center px-1.5',
                  )
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {!collapsed && (
          <div className="mt-4 border-t border-ink-200/40 pt-3 dark:border-ink-800/60">
            <FolderSection
              open={workspaceOpen}
              onToggle={() => setWorkspaceOpen((v) => !v)}
              onCreateBoard={onCreateBoard}
            />
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-ink-200/40 px-1.5 py-2 dark:border-ink-800/60">
        {collapsed ? (
          <button onClick={toggleSidebar} className="grid h-8 w-full place-items-center rounded-md text-ink-400 hover:bg-ink-200/60 hover:text-ink-600 dark:hover:bg-ink-800 dark:hover:text-ink-300" title="Expand sidebar">
            <ChevronsRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <NavLink to="/settings" className="flex items-center gap-2.5 rounded-md px-2 py-[5px] text-[13px] text-ink-500 transition hover:bg-ink-200/50 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-200">
            <Settings className="h-4 w-4 flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
        )}
      </div>

      {/* Resize handle */}
      {!collapsed && (
        <div
          onMouseDown={startResize}
          className={cn(
            'absolute right-0 top-0 z-40 h-full w-[3px] cursor-col-resize transition-colors duration-150',
            isResizing ? 'bg-violetx-400/60' : 'bg-transparent hover:bg-violetx-300/40',
          )}
        />
      )}
    </motion.aside>
  );
}

/* ── Folder section ─────────────────────────────────────────────────────── */

function FolderSection({ open, onToggle, onCreateBoard }) {
  const { data: foldersData } = useFolders();
  const { data: boardsData } = useBoardsAll();
  const folders = foldersData?.items ?? [];
  const boards = boardsData?.items ?? [];

  const updateBoard = useUpdateBoard();
  const updateFolder = useUpdateFolder();

  const {
    dropTargetId, dndEnter, dndLeave, draggingItem, dndClear,
    startNewFolder, addingPageIn, setAddingPageIn, creatingIn, cancelNewFolder,
  } = useSidebarStore();

  const isRootDropTarget = dropTargetId === 'root';
  const rootFolders = folders.filter((f) => !f.parentId);
  const rootBoards = boards.filter((b) => !b.folderId);

  const handleRootDrop = async (e) => {
    e.preventDefault();
    const item = draggingItem;
    dndClear();
    if (!item) return;
    try {
      if (item.type === 'board') {
        const board = boards.find((b) => b.id === item.id);
        if (!board || board.folderId === null) return;
        await updateBoard.mutateAsync({ id: item.id, folderId: null });
      } else {
        const folder = folders.find((f) => f.id === item.id);
        if (!folder || folder.parentId === null) return;
        await updateFolder.mutateAsync({ id: item.id, parentId: null });
      }
      toast.success('Moved to root');
    } catch { toast.error('Could not move item'); }
  };

  return (
    <div>
      {/* Section header — also root drop zone */}
      <div
        className={cn(
          'mb-1 flex items-center justify-between rounded-md px-2 py-0.5 transition',
          isRootDropTarget && 'bg-violetx-50/60 ring-1 ring-inset ring-violetx-400/40 dark:bg-violetx-500/10',
        )}
        onDragOver={(e) => { e.preventDefault(); dndEnter('root'); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) dndLeave('root'); }}
        onDrop={handleRootDrop}
      >
        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-widest text-ink-400/80 hover:text-ink-500 dark:text-ink-600 dark:hover:text-ink-400"
        >
          <ChevronRight className={cn('h-2.5 w-2.5 transition-transform', open && 'rotate-90')} />
          Workspace
          {isRootDropTarget && (
            <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-violetx-500">— drop to root</span>
          )}
        </button>
        <div className="flex items-center gap-0.5">
          <button onClick={onCreateBoard} className="rounded p-0.5 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300" title="New page">
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => startNewFolder(null)} className="rounded p-0.5 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300" title="New folder">
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {creatingIn === null && (
              <NewFolderInput parentId={null} depth={0} onCancel={cancelNewFolder} />
            )}

            {rootFolders.map((folder) => (
              <FolderRow key={folder.id} folder={folder} depth={0} />
            ))}

            {/* Root boards */}
            {(rootBoards.length > 0 || addingPageIn === 'root') && (
              <div className="mt-2">
                <div className="mb-0.5 flex items-center justify-between px-2">
                  <span className="text-[10px] font-medium uppercase tracking-widest text-ink-400/60 dark:text-ink-700">Pages</span>
                  <button onClick={() => setAddingPageIn('root')} className="rounded p-0.5 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300">
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <AnimatePresence>
                  {addingPageIn === 'root' && (
                    <TypePicker depth={0} folderId="root" onDone={() => setAddingPageIn(null)} />
                  )}
                </AnimatePresence>
                {rootBoards.map((board) => (
                  <BoardItem key={board.id} board={board} depth={0} />
                ))}
              </div>
            )}

            {rootBoards.length === 0 && addingPageIn !== 'root' && (
              <div className="mt-1 px-2">
                <button onClick={() => setAddingPageIn('root')} className="flex items-center gap-1.5 rounded-md py-1 text-[12px] text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300">
                  <Plus className="h-3 w-3" /> New page
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Board item ─────────────────────────────────────────────────────────── */

function BoardItem({ board, depth }) {
  const navigate = useNavigate();
  const { draggingItem, dndStart, dndEnd } = useSidebarStore();
  const isDragging = draggingItem?.type === 'board' && draggingItem?.id === board.id;
  const to = board.pageType === 'note' ? `/note/${board.id}` : `/board/${board.id}`;

  return (
    <button
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setDragImage(makeDragGhost(board.title || 'Untitled'), 0, 0);
        dndStart({ type: 'board', id: board.id });
      }}
      onDragEnd={dndEnd}
      onClick={() => navigate(to)}
      className={cn(
        'flex w-full cursor-grab items-center gap-2 rounded-md py-[5px] text-left text-[13px] text-ink-500 transition',
        'hover:bg-ink-200/50 hover:text-ink-700 dark:text-ink-400 dark:hover:bg-ink-800/60 dark:hover:text-ink-200',
        isDragging && 'cursor-grabbing opacity-40',
      )}
      style={{ paddingLeft: `${8 + (depth + 1) * 12 + 16}px`, paddingRight: '8px' }}
    >
      {board.pageType === 'note'
        ? <FileText className="h-3.5 w-3.5 flex-shrink-0 text-amber-500/80" />
        : <Layout className="h-3.5 w-3.5 flex-shrink-0 text-violetx-400/80" />}
      <span className="truncate">{board.title || 'Untitled'}</span>
    </button>
  );
}

/* ── Type picker ────────────────────────────────────────────────────────── */

function TypePicker({ depth, folderId, onDone, showFolder = false }) {
  const navigate = useNavigate();
  const createBoard = useCreateBoard();
  const { expand } = useSidebarStore();

  const handlePick = async (type) => {
    onDone();
    if (type === 'folder') {
      useSidebarStore.getState().startNewFolder(folderId === 'root' ? null : folderId);
      if (folderId && folderId !== 'root') expand(folderId);
      return;
    }
    try {
      const data = await createBoard.mutateAsync({
        title: 'Untitled',
        pageType: type,
        folderId: folderId === 'root' ? null : (folderId ?? null),
      });
      navigate(type === 'note' ? `/note/${data.board.id}` : `/board/${data.board.id}`);
    } catch { toast.error('Could not create page'); }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="overflow-hidden"
    >
      <div className="flex flex-wrap items-center gap-1 py-1 pr-2" style={{ paddingLeft: `${8 + (depth + 1) * 12 + 16}px` }}>
        {[
          { type: 'canvas', label: 'Canvas', Icon: Layout, hover: 'hover:border-violetx-300/80 hover:text-violetx-600 dark:hover:border-violetx-500/60 dark:hover:text-violetx-300' },
          { type: 'note', label: 'Note', Icon: FileText, hover: 'hover:border-amber-300/80 hover:text-amber-600 dark:hover:border-amber-500/60 dark:hover:text-amber-300' },
          ...(showFolder ? [{ type: 'folder', label: 'Subfolder', Icon: FolderPlus, hover: 'hover:border-emerald-300/80 hover:text-emerald-600 dark:hover:border-emerald-500/60 dark:hover:text-emerald-300' }] : []),
        ].map(({ type, label, Icon, hover }) => (
          <button
            key={type}
            onClick={() => handlePick(type)}
            className={cn(
              'flex items-center gap-1 rounded border border-ink-200/80 bg-white/80 px-2 py-0.5 text-[11px] text-ink-500 transition',
              'dark:border-ink-700/80 dark:bg-ink-900/60 dark:text-ink-400',
              hover,
            )}
          >
            <Icon className="h-2.5 w-2.5" /> {label}
          </button>
        ))}
        <button onClick={onDone} className="rounded p-0.5 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300">
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Folder row ─────────────────────────────────────────────────────────── */

function FolderRow({ folder, depth }) {
  const { data: foldersData } = useFolders();
  const { data: boardsData } = useBoardsAll();
  const folders = foldersData?.items ?? [];
  const boards = boardsData?.items ?? [];

  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const updateBoard = useUpdateBoard();

  const {
    expandedIds, toggleExpand, expand,
    editingId, editingName, startEdit, changeEditName, cancelEdit,
    menuId, openMenu, closeMenu,
    movePickerId, openMovePicker, closeMovePicker,
    creatingIn, cancelNewFolder, startNewFolder,
    addingPageIn, setAddingPageIn,
    draggingItem, dropTargetId, dndStart, dndEnd, dndEnter, dndLeave, dndClear,
  } = useSidebarStore();

  const editInputRef = useRef(null);
  const children = folders.filter((f) => f.parentId === folder.id);
  const folderBoards = boards.filter((b) => b.folderId === folder.id);
  const expanded = expandedIds.has(folder.id);
  const isEditing = editingId === folder.id;
  const menuOpen = menuId === folder.id;
  const moveOpen = movePickerId === folder.id;
  const isAddingHere = addingPageIn === folder.id;
  const isDragging = draggingItem?.type === 'folder' && draggingItem?.id === folder.id;
  const isDropTarget = dropTargetId === folder.id && !isDragging;
  const indentPx = 8 + depth * 12;

  useEffect(() => {
    if (isEditing) editInputRef.current?.select();
  }, [isEditing]);

  const commitRename = async () => {
    const name = editingName.trim();
    cancelEdit();
    if (!name || name === folder.name) return;
    try { await updateFolder.mutateAsync({ id: folder.id, name }); }
    catch { toast.error('Could not rename'); }
  };

  const handleDelete = async () => {
    closeMenu();
    if (!confirm(`Delete "${folder.name}"? Boards inside will be moved to root.`)) return;
    try { await deleteFolder.mutateAsync(folder.id); }
    catch { toast.error('Could not delete folder'); }
  };

  const handleMove = async (targetParentId) => {
    closeMovePicker();
    closeMenu();
    try {
      await updateFolder.mutateAsync({ id: folder.id, parentId: targetParentId });
      if (targetParentId) expand(targetParentId);
    } catch { toast.error('Could not move folder'); }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const item = draggingItem;
    dndClear();
    if (!item || item.id === folder.id) return;

    if (item.type === 'folder') {
      const descendants = getDescendantIds(item.id, folders);
      if (descendants.has(folder.id)) {
        toast.error("Can't move a folder into its own subfolder");
        return;
      }
      const src = folders.find((f) => f.id === item.id);
      if (src?.parentId === folder.id) return;
      try {
        await updateFolder.mutateAsync({ id: item.id, parentId: folder.id });
        expand(folder.id);
        toast.success('Moved into folder');
      } catch { toast.error('Could not move folder'); }
    } else if (item.type === 'board') {
      const board = boards.find((b) => b.id === item.id);
      if (board?.folderId === folder.id) return;
      try {
        await updateBoard.mutateAsync({ id: item.id, folderId: folder.id });
        expand(folder.id);
        toast.success('Moved into folder');
      } catch { toast.error('Could not move page'); }
    }
  };

  return (
    <>
      <div
        draggable
        onDragStart={(e) => {
          e.stopPropagation();
          e.dataTransfer.setDragImage(makeDragGhost(folder.name), 0, 0);
          dndStart({ type: 'folder', id: folder.id });
        }}
        onDragEnd={dndEnd}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); dndEnter(folder.id); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) dndLeave(folder.id); }}
        onDrop={handleDrop}
        className={cn(
          'group relative flex cursor-grab items-center rounded-md text-[13px] text-ink-500 transition',
          'hover:bg-ink-200/50 dark:text-ink-400 dark:hover:bg-ink-800/60',
          isDragging && 'cursor-grabbing opacity-40',
          isDropTarget && 'bg-violetx-50/50 ring-1 ring-inset ring-violetx-400/40 dark:bg-violetx-500/10 dark:ring-violetx-500/40',
        )}
        style={{ paddingLeft: `${indentPx}px`, paddingRight: '4px' }}
      >
        {/* Expand chevron */}
        <button
          onClick={() => toggleExpand(folder.id)}
          className="mr-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300"
        >
          {children.length > 0 || folderBoards.length > 0 || creatingIn === folder.id || isAddingHere
            ? <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
            : <span className="h-3 w-3" />}
        </button>

        {/* Folder name / inline rename */}
        <NavLink
          to={`/?folderId=${folder.id}`}
          className="flex flex-1 items-center gap-1.5 truncate py-[5px] pr-1"
          onClick={closeMenu}
        >
          {expanded
            ? <FolderOpen className="h-3.5 w-3.5 flex-shrink-0" style={{ color: folder.color ?? undefined }} />
            : <Folder className="h-3.5 w-3.5 flex-shrink-0" style={{ color: folder.color ?? undefined }} />}
          {isEditing ? (
            <input
              ref={editInputRef}
              value={editingName}
              onChange={(e) => changeEditName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') cancelEdit();
              }}
              onClick={(e) => e.preventDefault()}
              className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
            />
          ) : (
            <span className="flex-1 truncate">{folder.name}</span>
          )}
          {isDropTarget && !isEditing && (
            <span className="ml-auto mr-1 text-[10px] text-violetx-500 dark:text-violetx-400">drop</span>
          )}
        </NavLink>

        {/* Hover actions */}
        {!isEditing && (
          <div className="flex flex-shrink-0 items-center opacity-0 transition group-hover:opacity-100">
            <button
              onClick={(e) => { e.preventDefault(); toggleExpand(folder.id); setAddingPageIn(folder.id); }}
              className="rounded p-1 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300"
              title="New page"
            >
              <Plus className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              className="rounded p-1 text-ink-400 transition hover:text-rose-500 dark:hover:text-rose-400"
              title="Delete folder"
            >
              <Trash2 className="h-3 w-3" />
            </button>
            <button
              onClick={(e) => { e.preventDefault(); openMenu(folder.id); }}
              className="rounded p-1 text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-300"
              title="More options"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Context menu */}
        {menuOpen && (
          <div
            className="absolute left-full top-0 z-50 ml-1 w-44 overflow-hidden rounded-lg border border-ink-200/80 bg-white py-1 shadow-lg dark:border-ink-700/80 dark:bg-ink-900"
            onMouseLeave={closeMenu}
          >
            {[
              { icon: Pencil, label: 'Rename', action: () => startEdit(folder.id, folder.name) },
              {
                icon: FolderInput, label: 'New subfolder', action: () => {
                  startNewFolder(folder.id);
                  expand(folder.id);
                  closeMenu();
                },
              },
              { icon: FolderUp, label: 'Move into…', action: () => openMovePicker(folder.id) },
              ...(folder.parentId ? [{ icon: FolderUp, label: 'Move to root', action: () => handleMove(null) }] : []),
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                onClick={action}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" /> {label}
              </button>
            ))}
            <div className="my-1 border-t border-ink-100 dark:border-ink-800" />
            <button
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {moveOpen && <MovePicker folder={folder} folders={folders} onMove={handleMove} onClose={closeMovePicker} />}
      </div>

      {/* Children */}
      {(expanded || creatingIn === folder.id || isAddingHere) && (
        <>
          <AnimatePresence>
            {isAddingHere && (
              <TypePicker
                depth={depth}
                folderId={folder.id}
                showFolder
                onDone={() => setAddingPageIn(null)}
              />
            )}
          </AnimatePresence>

          {creatingIn === folder.id && (
            <NewFolderInput parentId={folder.id} depth={depth + 1} onCancel={cancelNewFolder} />
          )}

          {children.map((child) => (
            <FolderRow key={child.id} folder={child} depth={depth + 1} />
          ))}

          {folderBoards.map((board) => (
            <BoardItem key={board.id} board={board} depth={depth} />
          ))}
        </>
      )}
    </>
  );
}

/* ── Move picker ────────────────────────────────────────────────────────── */

function MovePicker({ folder, folders, onMove, onClose }) {
  const descendants = getDescendantIds(folder.id, folders);
  const targets = folders.filter((f) => f.id !== folder.id && !descendants.has(f.id));

  return (
    <div
      className="absolute left-full top-0 z-50 ml-1 max-h-52 w-44 overflow-y-auto rounded-lg border border-ink-200/80 bg-white py-1 shadow-lg scrollbar-thin dark:border-ink-700/80 dark:bg-ink-900"
      onMouseLeave={onClose}
    >
      <div className="border-b border-ink-100 px-3 py-1.5 text-[11px] font-medium uppercase tracking-widest text-ink-400 dark:border-ink-800">
        Move into
      </div>
      {targets.length === 0
        ? <p className="px-3 py-2 text-[12px] text-ink-400">No other folders</p>
        : targets.map((t) => (
          <button
            key={t.id}
            onClick={() => onMove(t.id)}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[13px] text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Folder className="h-3.5 w-3.5 flex-shrink-0" style={{ color: t.color ?? undefined }} />
            <span className="truncate">{t.name}</span>
          </button>
        ))}
    </div>
  );
}

/* ── New folder input ───────────────────────────────────────────────────── */

function NewFolderInput({ parentId, depth, onCancel }) {
  const createFolder = useCreateFolder();
  const { newFolderName, changeNewFolderName, cancelNewFolder, expand } = useSidebarStore();

  const commit = async () => {
    const name = newFolderName.trim();
    cancelNewFolder();
    if (!name) return;
    try {
      await createFolder.mutateAsync({ name, parentId: parentId ?? null });
      if (parentId) expand(parentId);
    } catch { toast.error('Could not create folder'); }
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-md py-[5px]"
      style={{ paddingLeft: `${8 + depth * 12 + 20}px`, paddingRight: '8px' }}
    >
      <Folder className="h-3.5 w-3.5 flex-shrink-0 text-ink-400" />
      <input
        autoFocus
        value={newFolderName}
        onChange={(e) => changeNewFolderName(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Folder name"
        className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-300 dark:placeholder:text-ink-700"
      />
    </div>
  );
}
