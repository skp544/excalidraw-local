import { forwardRef, useCallback, useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Home, Star, Archive, Layers, Sparkles, Plus, Folder, FolderOpen,
  Search, Settings, ChevronsLeft, ChevronsRight, BookTemplate,
  ChevronRight, MoreHorizontal, Pencil, Trash2, FolderInput, FolderUp,
  Layout, FileText, FolderPlus, X,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useUIStore } from '@/stores/ui-store.js';
import {
  useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder,
  useBoardsAll, useCreateBoard,
} from '@/hooks/use-boards.js';
import { cn } from '@/lib/cn.js';

const NAV = [
  { to: '/', icon: Home, label: 'All boards', match: /^\/$/ },
  { to: '/?favorite=1', icon: Star, label: 'Favorites', exact: true },
  { to: '/?archived=1', icon: Archive, label: 'Archived', exact: true },
  { to: '/templates', icon: BookTemplate, label: 'Templates' },
  { to: '/activity', icon: Layers, label: 'Activity' },
];

function getDescendantIds(folderId, folders) {
  const result = new Set();
  const queue = [folderId];
  while (queue.length) {
    const id = queue.shift();
    for (const f of folders) {
      if (f.parentId === id) {
        result.add(f.id);
        queue.push(f.id);
      }
    }
  }
  return result;
}

const MIN_WIDTH = 180;
const MAX_WIDTH = 520;

export function Sidebar({ onCreateBoard, onOpenCommandPalette }) {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const { data: foldersData } = useFolders();
  const { data: boardsData } = useBoardsAll();
  const folders = foldersData?.items ?? [];
  const boards = boardsData?.items ?? [];
  const navigate = useNavigate();
  const [foldersOpen, setFoldersOpen] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startWidth: 268 });

  const handleDragStart = useCallback(
    (e) => {
      e.preventDefault();
      dragRef.current = { startX: e.clientX, startWidth: sidebarWidth };
      setIsDragging(true);
    },
    [sidebarWidth],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e) => {
      const delta = e.clientX - dragRef.current.startX;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragRef.current.startWidth + delta)));
    };
    const onUp = () => setIsDragging(false);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, setSidebarWidth]);

  // Lock cursor globally during drag so it doesn't flicker
  useEffect(() => {
    document.body.style.cursor = isDragging ? 'col-resize' : '';
    document.body.style.userSelect = isDragging ? 'none' : '';
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : sidebarWidth }}
      transition={isDragging ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 32 }}
      className="relative z-20 flex h-full flex-col border-r border-ink-200/70 bg-white/70 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/60"
    >
      <div className="flex items-center justify-between px-4 pb-3 pt-5">
        <button
          onClick={() => navigate('/')}
          className={cn('focus-ring rounded-xl', collapsed && 'mx-auto')}
        >
          <Logo withWordmark={!collapsed} />
        </button>
        {!collapsed && (
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            title="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className={cn('px-3', collapsed && 'px-2')}>
        <Button
          variant="primary"
          className={cn('w-full', collapsed && 'p-2')}
          onClick={onCreateBoard}
        >
          <Plus className="h-4 w-4" />
          {!collapsed && <span>New page</span>}
        </Button>

        <button
          onClick={onOpenCommandPalette}
          className={cn(
            'mt-2 flex w-full items-center gap-2 rounded-xl border border-ink-200/70 bg-white/70 px-3 py-2 text-left text-sm text-ink-500 transition hover:bg-white focus-ring dark:border-ink-700/70 dark:bg-ink-900/70 dark:text-ink-400 dark:hover:bg-ink-800',
            collapsed && 'justify-center px-0',
          )}
          title="Search & commands (⌘K)"
        >
          <Search className="h-4 w-4" />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">Search & commands</span>
              <kbd className="rounded-md border border-ink-200 bg-white/60 px-1.5 py-0.5 text-[10px] font-medium text-ink-500 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-400">
                ⌘K
              </kbd>
            </>
          )}
        </button>
      </div>

      <nav className="mt-5 flex-1 overflow-y-auto px-2 scrollbar-thin">
        <ul className="space-y-0.5">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition focus-ring',
                    'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70',
                    isActive &&
                      'bg-violetx-50 text-violetx-700 hover:bg-violetx-50 dark:bg-violetx-500/10 dark:text-violetx-200',
                    collapsed && 'justify-center px-2',
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>

        {!collapsed && (
          <FolderSection
            folders={folders}
            boards={boards}
            open={foldersOpen}
            onToggle={() => setFoldersOpen((v) => !v)}
          />
        )}
      </nav>

      <div className="border-t border-ink-200/70 p-3 dark:border-ink-800">
        {collapsed ? (
          <button
            onClick={toggleSidebar}
            className="grid h-9 w-full place-items-center rounded-xl text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
            title="Expand"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        ) : (
          <NavLink
            to="/settings"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
            <span className="ml-auto pill">
              <Sparkles className="h-3 w-3" />
              local
            </span>
          </NavLink>
        )}
      </div>

      {/* Drag-to-resize handle */}
      {!collapsed && (
        <div
          onMouseDown={handleDragStart}
          className={cn(
            'absolute right-0 top-0 z-40 h-full w-1 cursor-col-resize transition-colors duration-150',
            isDragging ? 'bg-violetx-400/50' : 'bg-transparent hover:bg-violetx-400/30',
          )}
        />
      )}
    </motion.aside>
  );
}

/* ── Folder section ─────────────────────────────────────────────────────── */

function FolderSection({ folders, boards, open, onToggle }) {
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const createBoard = useCreateBoard();
  const navigate = useNavigate();

  const [expandedIds, setExpandedIds] = useState(new Set());
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [creatingIn, setCreatingIn] = useState(undefined);
  const [newFolderName, setNewFolderName] = useState('');
  const [menuId, setMenuId] = useState(null);
  const [movePickerId, setMovePickerId] = useState(null);
  const [addingPageIn, setAddingPageIn] = useState(null); // folderId | 'root' | null

  const newInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (creatingIn !== undefined) newInputRef.current?.focus();
  }, [creatingIn]);

  useEffect(() => {
    if (editingId) editInputRef.current?.select();
  }, [editingId]);

  const toggleExpand = (id) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleCreate = async (parentId) => {
    const name = newFolderName.trim();
    if (!name) { setCreatingIn(undefined); return; }
    try {
      await createFolder.mutateAsync({ name, parentId: parentId ?? null });
      if (parentId) setExpandedIds((p) => new Set([...p, parentId]));
    } catch {
      toast.error('Could not create folder');
    }
    setCreatingIn(undefined);
    setNewFolderName('');
  };

  const handleRename = async (folder) => {
    const name = editingName.trim();
    setEditingId(null);
    if (!name || name === folder.name) return;
    try {
      await updateFolder.mutateAsync({ id: folder.id, name });
    } catch {
      toast.error('Could not rename folder');
    }
  };

  const handleDelete = async (folder) => {
    setMenuId(null);
    if (!confirm(`Delete "${folder.name}"? Boards inside will be moved to root.`)) return;
    try {
      await deleteFolder.mutateAsync(folder.id);
    } catch {
      toast.error('Could not delete folder');
    }
  };

  const handleMove = async (folderId, targetParentId) => {
    setMovePickerId(null);
    setMenuId(null);
    try {
      await updateFolder.mutateAsync({ id: folderId, parentId: targetParentId });
      if (targetParentId) setExpandedIds((p) => new Set([...p, targetParentId]));
    } catch {
      toast.error('Could not move folder');
    }
  };

  const handleQuickCreate = async (folderId, pageType) => {
    setAddingPageIn(null);
    if (pageType === 'folder') {
      setCreatingIn(folderId);
      setNewFolderName('');
      if (folderId) setExpandedIds((p) => new Set([...p, folderId]));
      return;
    }
    try {
      const data = await createBoard.mutateAsync({
        title: 'Untitled',
        pageType,
        folderId: folderId === 'root' ? null : (folderId ?? null),
      });
      navigate(pageType === 'note' ? `/note/${data.board.id}` : `/board/${data.board.id}`);
    } catch {
      toast.error('Could not create page');
    }
  };

  const rootFolders = folders.filter((f) => !f.parentId);
  const rootBoards = boards.filter((b) => !b.folderId);

  return (
    <div className="mt-6">
      {/* Section header */}
      <div className="mb-1 flex items-center justify-between px-3">
        <button
          onClick={onToggle}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400 hover:text-ink-600 dark:hover:text-ink-200"
        >
          Workspace
        </button>
        <button
          onClick={() => { setCreatingIn(null); setNewFolderName(''); }}
          className="rounded p-0.5 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
          title="New folder"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            {/* New root folder input */}
            {creatingIn === null && (
              <NewFolderInput
                ref={newInputRef}
                value={newFolderName}
                onChange={setNewFolderName}
                onCommit={() => handleCreate(null)}
                onCancel={() => { setCreatingIn(undefined); setNewFolderName(''); }}
                depth={0}
              />
            )}

            {rootFolders.length === 0 && creatingIn !== null && rootBoards.length === 0 && (
              <p className="px-3 py-2 text-xs text-ink-400">No folders yet.</p>
            )}

            {rootFolders.map((folder) => (
              <FolderRow
                key={folder.id}
                folder={folder}
                folders={folders}
                boards={boards}
                depth={0}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                editingId={editingId}
                editingName={editingName}
                editInputRef={editInputRef}
                onEditStart={(f) => { setEditingId(f.id); setEditingName(f.name); setMenuId(null); }}
                onEditChange={setEditingName}
                onEditCommit={handleRename}
                onEditCancel={() => setEditingId(null)}
                menuId={menuId}
                onMenuOpen={(id) => setMenuId(id === menuId ? null : id)}
                onMenuClose={() => setMenuId(null)}
                onDelete={handleDelete}
                movePickerId={movePickerId}
                onMoveOpen={(id) => { setMovePickerId(id); setMenuId(null); }}
                onMoveClose={() => setMovePickerId(null)}
                onMove={handleMove}
                creatingIn={creatingIn}
                newFolderName={newFolderName}
                newInputRef={newInputRef}
                onNewFolderStart={(parentId) => { setCreatingIn(parentId); setNewFolderName(''); }}
                onNewFolderChange={setNewFolderName}
                onNewFolderCommit={handleCreate}
                onNewFolderCancel={() => { setCreatingIn(undefined); setNewFolderName(''); }}
                addingPageIn={addingPageIn}
                onAddPage={(folderId) => setAddingPageIn(folderId)}
                onAddPageCancel={() => setAddingPageIn(null)}
                onQuickCreate={handleQuickCreate}
              />
            ))}

            {/* Root-level boards (no folder) */}
            {rootBoards.length > 0 && (
              <div className="mt-3">
                <div className="mb-0.5 flex items-center justify-between px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-400">
                    Root pages
                  </span>
                  <button
                    onClick={() => setAddingPageIn('root')}
                    className="rounded p-0.5 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
                    title="New root page"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
                <AnimatePresence>
                  {addingPageIn === 'root' && (
                    <TypePicker
                      depth={0}
                      onPick={(type) => handleQuickCreate('root', type)}
                      onCancel={() => setAddingPageIn(null)}
                    />
                  )}
                </AnimatePresence>
                {rootBoards.map((board) => (
                  <BoardItem key={board.id} board={board} depth={0} />
                ))}
              </div>
            )}

            {/* Root pages section when empty — still show add button */}
            {rootBoards.length === 0 && (
              <div className="mt-1 px-3">
                <button
                  onClick={() => setAddingPageIn('root')}
                  className="flex items-center gap-1.5 rounded-lg py-1 text-xs text-ink-400 transition hover:text-ink-600 dark:hover:text-ink-200"
                >
                  <Plus className="h-3 w-3" />
                  Add root page
                </button>
                <AnimatePresence>
                  {addingPageIn === 'root' && (
                    <TypePicker
                      depth={0}
                      onPick={(type) => handleQuickCreate('root', type)}
                      onCancel={() => setAddingPageIn(null)}
                    />
                  )}
                </AnimatePresence>
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
  const to = board.pageType === 'note' ? `/note/${board.id}` : `/board/${board.id}`;
  return (
    <button
      onClick={() => navigate(to)}
      className="flex w-full items-center gap-2 rounded-xl py-1.5 text-left text-sm text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70"
      style={{ paddingLeft: `${12 + (depth + 1) * 14 + 20}px`, paddingRight: '8px' }}
    >
      {board.pageType === 'note' ? (
        <FileText className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
      ) : (
        <Layout className="h-3.5 w-3.5 flex-shrink-0 text-violetx-500" />
      )}
      <span className="truncate">{board.title || 'Untitled'}</span>
    </button>
  );
}

/* ── Type picker (inline) ───────────────────────────────────────────────── */

function TypePicker({ depth, onPick, onCancel, showFolder = false }) {
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="overflow-hidden"
    >
      <div
        className="flex flex-wrap items-center gap-1.5 py-1.5 pr-2"
        style={{ paddingLeft: `${12 + (depth + 1) * 14 + 20}px` }}
      >
        <button
          onClick={() => onPick('canvas')}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:border-violetx-300 hover:text-violetx-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-violetx-500/60 dark:hover:text-violetx-300"
        >
          <Layout className="h-3 w-3" />
          Canvas
        </button>
        <button
          onClick={() => onPick('note')}
          className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:border-amber-300 hover:text-amber-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-amber-500/60 dark:hover:text-amber-300"
        >
          <FileText className="h-3 w-3" />
          Note
        </button>
        {showFolder && (
          <button
            onClick={() => onPick('folder')}
            className="flex items-center gap-1.5 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-300 dark:hover:border-emerald-500/60 dark:hover:text-emerald-300"
          >
            <FolderPlus className="h-3 w-3" />
            Subfolder
          </button>
        )}
        <button
          onClick={onCancel}
          className="rounded p-0.5 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-200"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Folder row (recursive) ─────────────────────────────────────────────── */

function FolderRow({
  folder, folders, boards, depth,
  expandedIds, onToggleExpand,
  editingId, editingName, editInputRef, onEditStart, onEditChange, onEditCommit, onEditCancel,
  menuId, onMenuOpen, onMenuClose, onDelete,
  movePickerId, onMoveOpen, onMoveClose, onMove,
  creatingIn, newFolderName, newInputRef, onNewFolderStart, onNewFolderChange,
  onNewFolderCommit, onNewFolderCancel,
  addingPageIn, onAddPage, onAddPageCancel, onQuickCreate,
}) {
  const children = folders.filter((f) => f.parentId === folder.id);
  const folderBoards = boards.filter((b) => b.folderId === folder.id);
  const hasChildren = children.length > 0 || folderBoards.length > 0;
  const expanded = expandedIds.has(folder.id);
  const isEditing = editingId === folder.id;
  const menuOpen = menuId === folder.id;
  const moveOpen = movePickerId === folder.id;
  const isAddingHere = addingPageIn === folder.id;

  const indentPx = depth * 14;

  return (
    <>
      <div
        className="group relative flex items-center rounded-xl text-sm text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800/70"
        style={{ paddingLeft: `${12 + indentPx}px`, paddingRight: '4px' }}
      >
        {/* Expand chevron */}
        <button
          onClick={() => onToggleExpand(folder.id)}
          className="mr-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
        >
          {hasChildren || creatingIn === folder.id || isAddingHere ? (
            <ChevronRight
              className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')}
            />
          ) : (
            <span className="h-3 w-3" />
          )}
        </button>

        {/* Folder icon + name */}
        <NavLink
          to={`/?folderId=${folder.id}`}
          className="flex flex-1 items-center gap-2 truncate py-1.5 pr-1"
          onClick={onMenuClose}
        >
          {expanded ? (
            <FolderOpen className="h-4 w-4 flex-shrink-0" style={{ color: folder.color ?? undefined }} />
          ) : (
            <Folder className="h-4 w-4 flex-shrink-0" style={{ color: folder.color ?? undefined }} />
          )}

          {isEditing ? (
            <input
              ref={editInputRef}
              value={editingName}
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={() => onEditCommit(folder)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onEditCommit(folder);
                if (e.key === 'Escape') onEditCancel();
              }}
              onClick={(e) => e.preventDefault()}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          ) : (
            <span className="flex-1 truncate">{folder.name}</span>
          )}

          {!isEditing && (
            <span className="ml-auto flex-shrink-0 text-xs text-ink-400">{folder.boardCount || ''}</span>
          )}
        </NavLink>

        {/* Action buttons (visible on hover) */}
        {!isEditing && (
          <div className="flex flex-shrink-0 items-center opacity-0 transition group-hover:opacity-100">
            {/* "+" add page */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleExpand(folder.id);
                onAddPage(folder.id);
              }}
              className="rounded p-1 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
              title="New page in folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            {/* "..." menu */}
            <button
              onClick={(e) => { e.preventDefault(); onMenuOpen(folder.id); }}
              className="rounded p-1 text-ink-400 transition hover:text-ink-700 dark:hover:text-ink-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Context menu */}
        {menuOpen && (
          <div
            className="absolute left-full top-0 z-50 ml-1 w-44 overflow-hidden rounded-xl border border-ink-200/70 bg-white shadow-ring dark:border-ink-700/70 dark:bg-ink-900"
            onMouseLeave={onMenuClose}
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
              onClick={() => onEditStart(folder)}
            >
              <Pencil className="h-3.5 w-3.5" /> Rename
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
              onClick={() => { onNewFolderStart(folder.id); onToggleExpand(folder.id); }}
            >
              <FolderInput className="h-3.5 w-3.5" /> New subfolder
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
              onClick={() => onMoveOpen(folder.id)}
            >
              <FolderUp className="h-3.5 w-3.5" /> Move into…
            </button>
            {folder.parentId && (
              <button
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
                onClick={() => onMove(folder.id, null)}
              >
                <FolderUp className="h-3.5 w-3.5" /> Move to root
              </button>
            )}
            <div className="my-1 border-t border-ink-100 dark:border-ink-800" />
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              onClick={() => onDelete(folder)}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        )}

        {/* Move picker */}
        {moveOpen && (
          <MovePicker
            folder={folder}
            folders={folders}
            onMove={onMove}
            onClose={onMoveClose}
          />
        )}
      </div>

      {/* Children (when expanded) */}
      {(expandedIds.has(folder.id) || creatingIn === folder.id || isAddingHere) && (
        <>
          {/* Type picker for new page */}
          <AnimatePresence>
            {isAddingHere && (
              <TypePicker
                depth={depth}
                showFolder
                onPick={(type) => onQuickCreate(folder.id, type)}
                onCancel={onAddPageCancel}
              />
            )}
          </AnimatePresence>

          {/* New subfolder input */}
          {creatingIn === folder.id && (
            <NewFolderInput
              ref={newInputRef}
              value={newFolderName}
              onChange={onNewFolderChange}
              onCommit={() => onNewFolderCommit(folder.id)}
              onCancel={onNewFolderCancel}
              depth={depth + 1}
            />
          )}

          {/* Sub-folders */}
          {children.map((child) => (
            <FolderRow
              key={child.id}
              folder={child}
              folders={folders}
              boards={boards}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              editingId={editingId}
              editingName={editingName}
              editInputRef={editInputRef}
              onEditStart={onEditStart}
              onEditChange={onEditChange}
              onEditCommit={onEditCommit}
              onEditCancel={onEditCancel}
              menuId={menuId}
              onMenuOpen={onMenuOpen}
              onMenuClose={onMenuClose}
              onDelete={onDelete}
              movePickerId={movePickerId}
              onMoveOpen={onMoveOpen}
              onMoveClose={onMoveClose}
              onMove={onMove}
              creatingIn={creatingIn}
              newFolderName={newFolderName}
              newInputRef={newInputRef}
              onNewFolderStart={onNewFolderStart}
              onNewFolderChange={onNewFolderChange}
              onNewFolderCommit={onNewFolderCommit}
              onNewFolderCancel={onNewFolderCancel}
              addingPageIn={addingPageIn}
              onAddPage={onAddPage}
              onAddPageCancel={onAddPageCancel}
              onQuickCreate={onQuickCreate}
            />
          ))}

          {/* Boards in this folder */}
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
  const targets = folders.filter(
    (f) => f.id !== folder.id && !descendants.has(f.id),
  );

  return (
    <div
      className="absolute left-full top-0 z-50 ml-1 max-h-56 w-48 overflow-y-auto rounded-xl border border-ink-200/70 bg-white shadow-ring scrollbar-thin dark:border-ink-700/70 dark:bg-ink-900"
      onMouseLeave={onClose}
    >
      <div className="border-b border-ink-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400 dark:border-ink-800">
        Move into
      </div>
      {targets.length === 0 ? (
        <p className="px-3 py-2 text-xs text-ink-400">No other folders</p>
      ) : (
        targets.map((t) => (
          <button
            key={t.id}
            onClick={() => onMove(folder.id, t.id)}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-100 dark:hover:bg-ink-800"
          >
            <Folder className="h-3.5 w-3.5 flex-shrink-0" style={{ color: t.color ?? undefined }} />
            <span className="truncate">{t.name}</span>
          </button>
        ))
      )}
    </div>
  );
}

/* ── New folder inline input ────────────────────────────────────────────── */

const NewFolderInput = forwardRef(function NewFolderInput(
  { value, onChange, onCommit, onCancel, depth },
  ref,
) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-1.5"
      style={{ paddingLeft: `${12 + depth * 14 + 24}px` }}
    >
      <Folder className="h-4 w-4 flex-shrink-0 text-ink-400" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onCommit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onCommit();
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Folder name"
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-300"
      />
    </div>
  );
});
