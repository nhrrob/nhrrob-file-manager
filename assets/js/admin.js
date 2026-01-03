/**
 * NHR File Manager - React App
 * Refactored for performance and maintainability
 */
(function (wp) {
    'use strict';

    const { createElement: el, useState, useEffect, useCallback, useRef, useMemo } = wp.element;
    const { Spinner } = wp.components;
    const apiFetch = wp.apiFetch;
    const { i18n, monacoPath, adminUrl } = window.nhrfmFileManager || {};

    // --- Utils & Assets ---
    const Icons = {
        search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
        folderOpen: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
        file: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
        code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
        save: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z',
        chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
        trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
        lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
        close: 'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
        maximize: 'M3 3v18h18V3H3zm16 16H5V5h14v14z', // Square
        minimize: 'M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z',
        sidebarLeft: 'M4 4h16v16H4V4zm2 2v12h4V6H6zm6 0v12h8V6h-8z', // VS Code Sidebar Left (Fixed padding)
        fullscreen: 'M3 3h18v18H3V3zm2 2v14h14V5H5z', // Square
        fullscreenExit: 'M3 3h18v18H3V3zm2 2v14h14V5H5z', // Placeholder
        files: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7zM6 20V4h6v6h6v10H6z', // VS Code Explorer - Two overlapping rectangles
        searchBig: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', // VS Code Search - Clean magnifying glass
        git: 'M21.007 8.222A3.738 3.738 0 0 0 15.045 5.2a3.737 3.737 0 0 0 1.156 6.583 2.988 2.988 0 0 1-2.668 1.67h-2.99a4.456 4.456 0 0 0-2.989 1.165V7.4a3.737 3.737 0 1 0-1.494 0v9.117a3.776 3.776 0 1 0 1.816.099 2.99 2.99 0 0 1 2.668-1.667h2.99a4.484 4.484 0 0 0 4.223-3.039 3.736 3.736 0 0 0 3.25-3.687zM4.565 3.738a2.242 2.242 0 1 1 4.484 0 2.242 2.242 0 0 1-4.484 0zm4.484 16.441a2.242 2.242 0 1 1-4.484 0 2.242 2.242 0 0 1 4.484 0zm8.221-9.715a2.242 2.242 0 1 1 0-4.485 2.242 2.242 0 0 1 0 4.485z', // VS Code Source Control - Thin branch with circles
        gitBranch: 'M12.85 14.15l-1.7-1.7a4.96 4.96 0 0 0 .85-2.7 5 5 0 1 0-5.75 4.94L6.2 14.74a3 3 0 0 0-2.2 2.76v.5h1v-.5a2 2 0 0 1 1.47-1.84l.05-.02 2.15-2.15a4.94 4.94 0 0 0 2.58.51l1.7 1.7A3 3 0 0 0 15 15.5v.5h1v-.5a3 3 0 0 0-2.15-2.85zM7 9a4 4 0 1 1 4-4 4 4 0 0 1-4 4z', // Same as git for now
        extensions: 'M10.5 0h-9L0 1.5V9l1.5 1.5h9L12 9V1.5L10.5 0zm-9 9V1.5h9V9h-9zM24 1.5L22.5 0h-9L12 1.5V9l1.5 1.5h9L24 9V1.5zm-10.5 0V9h9V1.5h-9zM10.5 12h-9L0 13.5V21l1.5 1.5h9l1.5-1.5v-7.5L10.5 12zm-9 9v-7.5h9V21h-9zM22.5 14.5h-7L14 16v6.5l1.5 1.5h7l1.5-1.5V16l-1.5-1.5zm-7 8V16h7v6.5h-7z' // VS Code Extensions - Four squares with bottom-right offset
    };

    const SvgIcon = ({ name, size = 16, className }) =>
        el('svg', { viewBox: name === 'chevron' ? '0 0 12 12' : '0 0 24 24', width: size, height: size, fill: 'currentColor', className }, el('path', { d: Icons[name] }));

    const Utils = {
        toast: (msg, type = 'success') => {
            const existing = document.querySelector('.nhrfm-toast');
            if (existing) existing.remove();
            const t = document.createElement('div');
            t.className = `nhrfm-toast ${type}`;
            t.textContent = msg;
            document.body.appendChild(t);
            setTimeout(() => t.remove(), 3000);
        },
        getFileColor: (ext) => ({ php: '#777BB3', js: '#F7DF1E', jsx: '#61DAFB', css: '#264DE4', html: '#E34F26', json: '#000000', md: '#083FA1' }[ext] || '#666666'),
        getLanguage: (ext, file) => {
            if (file === 'wp-config.php') return 'php';
            const map = { php: 'php', js: 'javascript', html: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown', sql: 'sql' };
            return map[ext?.toLowerCase()] || 'plaintext';
        },
        formatBytes: (b) => {
            if (!b) return '0 Bytes';
            const i = Math.floor(Math.log(b) / Math.log(1024));
            return parseFloat((b / Math.pow(1024, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
        }
    };

    // --- Hooks ---
    const useMonaco = (containerRef) => {
        const [monaco, setMonaco] = useState(null);
        const [error, setError] = useState(null);
        const initialized = useRef(false);

        useEffect(() => {
            if (!containerRef.current || initialized.current) return;

            if (!window.require) {
                console.error('Monaco loader not found');
                setError('Monaco loader not found');
                return;
            }

            // if (containerRef.current.offsetWidth === 0) return; // Removed check

            initialized.current = true;
            try {
                console.log('Initializing Monaco', monacoPath);
                if (!window.require.config._monacoConfigured) {
                    window.require.config({ paths: { vs: monacoPath }, 'vs/nls': { availableLanguages: { '*': '' } } });
                    window.require.config._monacoConfigured = true;
                }
                window.MonacoEnvironment = window.MonacoEnvironment || { getWorkerUrl: () => '', getWorker: () => null };

                const origWarn = console.warn;
                // Suppress message bundle warnings
                console.warn = (...args) => args[0]?.includes?.('message bundle') ? null : origWarn.apply(console, args);

                window.require(['vs/editor/editor.main'], (m) => {
                    console.log('Monaco loaded');
                    setMonaco(m);
                    console.warn = origWarn;
                }, (err) => {
                    console.error('Failed to load Monaco', err);
                    setError('Failed to load Monaco');
                    console.warn = origWarn;
                });
            } catch (e) { console.error(e); setError(e.message); }
        }, []); // Removed dependency on offsetWidth

        return { monaco, error };
    };

    // --- Components ---
    const ActivityBar = ({ activeView, onSelect }) => {
        return el('div', { className: 'nhrfm-activity-bar' },
            el('div', { className: `nhrfm-activity-icon ${activeView === 'explorer' ? 'active' : ''}`, onClick: () => onSelect('explorer'), title: 'Explorer' },
                el(SvgIcon, { name: 'files', size: 22 })
            ),
            el('div', { className: `nhrfm-activity-icon ${activeView === 'search' ? 'active' : ''}`, onClick: () => onSelect('search'), title: 'Search' },
                el(SvgIcon, { name: 'searchBig', size: 22 })
            ),
            el('div', { className: `nhrfm-activity-icon ${activeView === 'git' ? 'active' : ''}`, onClick: () => onSelect('git'), title: 'Source Control' },
                el(SvgIcon, { name: 'git', size: 22 })
            )
        );
    };

    const TopBar = ({ activeFile, isFullScreen, onToggleFullScreen, isSidebarVisible, onToggleSidebar }) => {
        const handleClose = () => {
            window.location.href = adminUrl || '/wp-admin/';
        };

        return el('div', { className: 'nhrfm-top-bar' },
            el('div', { className: 'nhrfm-top-bar-left' },
                el('div', { className: 'nhrfm-mac-btn nhrfm-mac-close', onClick: handleClose, title: 'Close to Dashboard' },
                    el('span', { className: 'nhrfm-mac-icon' }, '×')
                ),
                el('div', { className: 'nhrfm-mac-btn nhrfm-mac-minimize disabled', title: 'Minimize' },
                    el('span', { className: 'nhrfm-mac-icon' }, '−')
                ),
                el('div', { className: 'nhrfm-mac-btn nhrfm-mac-maximize', onClick: onToggleFullScreen, title: isFullScreen ? 'Exit Full Screen' : 'Full Screen' },
                    el('span', { className: 'nhrfm-mac-icon' }, '+')
                )
            ),
            el('div', { className: 'nhrfm-top-bar-center' },
                activeFile || 'NHR File Manager'
            ),
            el('div', { className: 'nhrfm-top-bar-right' },
                el('div', { className: 'nhrfm-icon-btn', onClick: onToggleSidebar, title: 'Toggle Sidebar' },
                    el(SvgIcon, { name: 'sidebarLeft', size: 18 }))
            )
        );
    };


    const Tabs = ({ tabs, activeTab, onSelect, onClose }) => {
        return el('div', { className: 'nhrfm-tabs-container' },
            tabs.map(tab =>
                el('div', {
                    key: tab.path,
                    className: `nhrfm-tab ${activeTab === tab.path ? 'active' : ''}`,
                    onClick: () => onSelect(tab.path)
                },
                    el('span', { className: 'nhrfm-tab-icon', style: { color: Utils.getFileColor(tab.extension) } },
                        el(SvgIcon, { name: 'file', size: 14 })),
                    el('span', { className: 'nhrfm-tab-name' }, tab.name),
                    tab.modified && el('span', { className: 'nhrfm-tab-modified' }),
                    el('span', {
                        className: 'nhrfm-tab-close',
                        onClick: (e) => { e.stopPropagation(); onClose(tab.path); }
                    }, '×')
                )
            )
        );
    };

    const TreeItem = ({ item, depth, selected, onSelect, expanded, onToggle, onDelete, canDelete, onLoadFolder, loadingFolders }) => {
        const [confirm, setConfirm] = useState(false);
        const isFolder = item.isFolder;
        const isExpanded = expanded.has(item.id);
        const isLoading = loadingFolders && loadingFolders.has(item.id);

        const handleToggle = (e) => {
            e.stopPropagation();
            if (isFolder) {
                if (!isExpanded && item.children === null && onLoadFolder) {
                    onLoadFolder(item.id);
                }
                onToggle(item.id);
            }
        };

        return el('div', { className: 'nhrfm-tree-item-wrapper' },
            el('div', {
                className: `nhrfm-tree-item ${selected === item.id ? 'selected' : ''} ${item.readOnly ? 'readonly' : ''} ${item.sensitive ? 'sensitive' : ''}`,
                style: { paddingLeft: depth * 16 + 8 },
                onClick: (e) => isFolder ? handleToggle(e) : onSelect(item.id)
            },
                el('span', { className: `nhrfm-tree-arrow ${isExpanded ? 'expanded' : ''}` },
                    isFolder ? (isLoading ? el(Spinner) : el(SvgIcon, { name: 'chevron', size: 12 })) : null
                ),
                el('span', { className: 'icon', style: { color: isFolder ? '#8B7355' : Utils.getFileColor(item.extension) } },
                    el(SvgIcon, { name: isFolder ? (isExpanded ? 'folderOpen' : 'folder') : 'file' })),
                el('span', { className: 'name' }, item.name),
                item.readOnly && el('span', { className: 'nhrfm-readonly-badge' }, el(SvgIcon, { name: 'lock' })),
                canDelete && !item.sensitive && el('span', {
                    className: 'nhrfm-delete-btn', title: 'Delete',
                    onClick: (e) => { e.stopPropagation(); setConfirm(true); }
                }, el(SvgIcon, { name: 'trash' }))
            ),
            confirm && el('div', { className: 'nhrfm-delete-confirm', style: { paddingLeft: depth * 16 + 24 }, onClick: e => e.stopPropagation() },
                el('span', null, `Delete "${item.name}"?`),
                el('button', { className: 'nhrfm-confirm-yes', onClick: () => onDelete(item) }, 'Yes'),
                el('button', { className: 'nhrfm-confirm-no', onClick: () => setConfirm(false) }, 'No')
            ),
            isFolder && isExpanded && el('div', { className: 'nhrfm-tree-children' },
                item.children ?
                    item.children.map(child => el(TreeItem, { key: child.id, item: child, depth: depth + 1, selected, onSelect, expanded, onToggle, onDelete, canDelete, onLoadFolder, loadingFolders }))
                    : null
            )
        );
    };

    const Editor = ({ content, language, readOnly, onChange, onValidation }) => {
        const container = useRef(null);
        const editorRef = useRef(null);
        const valTimer = useRef(null);
        const { monaco, error } = useMonaco(container);

        const validate = useCallback(async (code) => {
            if (language !== 'php') return;
            try {
                const res = await apiFetch({ path: 'nhrfm/v1/validate-php', method: 'POST', data: { code } });
                const markers = (res.errors || []).map(e => ({
                    severity: 8, startLineNumber: e.line || 1, startColumn: 1, endLineNumber: e.line || 1, endColumn: 1000,
                    message: e.message, source: 'PHP Lint'
                }));
                monaco.editor.setModelMarkers(editorRef.current.getModel(), 'php', markers);
                onValidation(markers);
            } catch (e) { }
        }, [language, monaco, onValidation]);

        useEffect(() => {
            if (!monaco || !container.current) return;
            if (editorRef.current) { editorRef.current.dispose(); }

            editorRef.current = monaco.editor.create(container.current, {
                value: content, language, theme: 'vs-dark', automaticLayout: true, readOnly,
                minimap: { enabled: true }, fontSize: 14, fontFamily: 'Menlo, Monaco, "Courier New", monospace',
                scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto',
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10,
                    useShadows: false
                }
            });

            editorRef.current.onDidChangeModelContent(() => {
                const val = editorRef.current.getValue();
                onChange(val);
                if (language === 'php') {
                    clearTimeout(valTimer.current);
                    valTimer.current = setTimeout(() => validate(val), 1000);
                }
            });

            if (language === 'php') validate(content);

            return () => editorRef.current?.dispose();
        }, [monaco, language, readOnly]);

        useEffect(() => {
            if (editorRef.current && content !== editorRef.current.getValue()) {
                editorRef.current.setValue(content || '');
            }
        }, [content]);

        if (error) return el('div', { className: 'nhrfm-error' }, error);
        return el('div', { className: 'nhrfm-editor-wrapper', ref: container });
    };

    const FileManager = () => {
        const [state, setState] = useState({
            files: [], loading: true, expanded: new Set(), loadingFolders: new Set(),
            query: '', isFullScreen: false, isSidebarVisible: true, activeView: 'explorer'
        });
        const [tabs, setTabs] = useState([]);
        const [activeTabPath, setActiveTabPath] = useState(null);
        const [saving, setSaving] = useState(false);
        const [errors, setErrors] = useState([]);

        const activeTab = tabs.find(t => t.path === activeTabPath);
        console.log('Render', { activeTabPath, tabs, activeTab });

        const fetchFiles = useCallback(async () => {
            setState(s => ({ ...s, loading: true }));
            try {
                const res = await apiFetch({ path: 'nhrfm/v1/files?type=wp-content' });
                setState(s => ({ ...s, files: res, loading: false }));
            } catch (e) { Utils.toast('Failed to load files', 'error'); setState(s => ({ ...s, loading: false })); }
        }, []);

        useEffect(() => { fetchFiles(); }, [fetchFiles]);

        const loadFile = async (path) => {
            const existing = tabs.find(t => t.path === path);
            if (existing) { setActiveTabPath(path); return; }

            const fileItem = state.files.find(f => f.id === path) || { name: path.split('/').pop(), extension: path.split('.').pop() }; // Fallback

            // Optimistic tab creation
            const newTab = { ...fileItem, path, content: '', loading: true, original: '' };
            setTabs(prev => [...prev, newTab]);
            setActiveTabPath(path);

            try {
                const res = await apiFetch({ path: `nhrfm/v1/file?path=${encodeURIComponent(path)}&type=wp-content` });
                const { path: resPath, modified, ...restRes } = res;
                console.log('loadFile success', path, res);
                setTabs(prev => prev.map(t => t.path === path ? { ...t, content: res.content, original: res.content, loading: false, readOnly: res.readOnly, modified: false, lastModified: modified, ...restRes } : t));
            } catch (e) {
                Utils.toast('Failed to open file', 'error');
                setTabs(prev => prev.filter(t => t.path !== path));
                if (activeTabPath === path) setActiveTabPath(null);
            }
        };

        const closeTab = (path) => {
            setTabs(prev => {
                const newTabs = prev.filter(t => t.path !== path);
                if (activeTabPath === path) {
                    setActiveTabPath(newTabs.length ? newTabs[newTabs.length - 1].path : null);
                }
                return newTabs;
            });
        };

        const updateTabContent = (content) => {
            if (!activeTabPath) return;
            setTabs(prev => prev.map(t => {
                if (t.path !== activeTabPath) return t;

                // Normalize line endings for comparison
                // Handle CRLF, CR, and LF to ensure consistent comparison
                const normalize = (str) => (str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

                const normContent = normalize(content);
                const normOriginal = normalize(t.original);
                const isModified = normContent !== normOriginal;

                // Only mark modified if we have an original value to compare against and it's not loading
                if (t.loading || t.original === undefined) return t;
                return { ...t, content, modified: isModified };
            }));
        };

        const saveFile = async () => {
            if (saving || !activeTab) return;
            setSaving(true);
            try {
                await apiFetch({ path: 'nhrfm/v1/file', method: 'POST', data: { path: activeTab.path, content: activeTab.content, type: 'wp-content' } });
                setTabs(prev => prev.map(t => t.path === activeTabPath ? { ...t, original: t.content, modified: false } : t));
                setSaving(false);
                Utils.toast(i18n?.saveSuccess || 'Saved');
            } catch (e) { Utils.toast(e.message, 'error'); setSaving(false); }
        };

        const deleteItem = async (item) => {
            try {
                await apiFetch({ path: `nhrfm/v1/file?path=${encodeURIComponent(item.id)}&type=wp-content`, method: 'DELETE' });
                Utils.toast(item.isFolder ? 'Folder deleted' : 'File deleted');
                // Close tab if deleted
                if (tabs.find(t => t.path === item.id)) closeTab(item.id);
                fetchFiles();
            } catch (e) { Utils.toast('Delete failed', 'error'); }
        };

        const filter = (items, q) => {
            if (!q) return items;
            return items.reduce((acc, i) => {
                if (i.isFolder && i.children) {
                    const c = filter(i.children, q);
                    if (c.length) acc.push({ ...i, children: c });
                } else if (i.name.toLowerCase().includes(q.toLowerCase())) acc.push(i);
                return acc;
            }, []);
        };

        const loadFolder = async (folderId) => {
            setState(s => ({ ...s, loadingFolders: new Set(s.loadingFolders).add(folderId) }));
            try {
                const res = await apiFetch({ path: `nhrfm/v1/files?path=${encodeURIComponent(folderId)}&type=wp-content` });
                setState(s => {
                    const updateTree = (nodes) => {
                        return nodes.map(node => {
                            if (node.id === folderId) {
                                return { ...node, children: res };
                            }
                            if (node.children) {
                                return { ...node, children: updateTree(node.children) };
                            }
                            return node;
                        });
                    };
                    const newFiles = updateTree(s.files);
                    const newLoading = new Set(s.loadingFolders);
                    newLoading.delete(folderId);
                    return { ...s, files: newFiles, loadingFolders: newLoading };
                });
            } catch (e) {
                Utils.toast('Failed to load folder', 'error');
                setState(s => {
                    const newLoading = new Set(s.loadingFolders);
                    newLoading.delete(folderId);
                    return { ...s, loadingFolders: newLoading };
                });
            }
        };

        const filteredFiles = useMemo(() => filter(state.files, state.query), [state.files, state.query]);

        return el('div', { className: `nhrfm-wrap ${state.isFullScreen ? 'nhrfm-fullscreen' : ''}` },
            el('div', { className: 'nhrfm-app-container' },
                el(TopBar, {
                    activeFile: activeTab?.name,
                    isFullScreen: state.isFullScreen,
                    onToggleFullScreen: () => setState(s => ({ ...s, isFullScreen: !s.isFullScreen })),
                    isSidebarVisible: state.isSidebarVisible,
                    onToggleSidebar: () => setState(s => ({ ...s, isSidebarVisible: !s.isSidebarVisible }))
                }),
                el('div', { className: 'nhrfm-main-content' },
                    el(ActivityBar, { activeView: state.activeView, onSelect: (view) => setState(s => ({ ...s, activeView: view, isSidebarVisible: true })) }),
                    el('div', { className: `nhrfm-sidebar ${!state.isSidebarVisible ? 'hidden' : ''}` },
                        el('div', { style: { display: 'flex', flexDirection: 'column', height: '100%' } },
                            el('div', { className: 'nhrfm-sidebar-header' },
                                el('h3', null, state.activeView.toUpperCase())
                            ),
                            state.activeView === 'explorer' && el('div', { className: 'nhrfm-search' },
                                el('input', { type: 'text', placeholder: 'Search files...', value: state.query, onChange: e => setState(s => ({ ...s, query: e.target.value })) })
                            ),
                            state.activeView === 'explorer' ? el('div', { className: 'nhrfm-tree-container' },
                                state.loading ? el('div', { className: 'nhrfm-loading' }, el(Spinner)) :
                                    filteredFiles.map(i => el(TreeItem, {
                                        key: i.id, item: i, depth: 0, selected: activeTabPath,
                                        onSelect: loadFile,
                                        expanded: state.expanded,
                                        onToggle: (id) => {
                                            const next = new Set(state.expanded);
                                            next.has(id) ? next.delete(id) : next.add(id);
                                            setState(s => ({ ...s, expanded: next }));
                                        },
                                        onDelete: deleteItem,
                                        canDelete: true,
                                        onLoadFolder: loadFolder,
                                        loadingFolders: state.loadingFolders
                                    }))
                            ) : el('div', { style: { padding: 20, color: '#888' } }, 'Not implemented yet')
                        )
                    ),
                    el('div', { className: 'nhrfm-editor-panel' },
                        el(Tabs, { tabs, activeTab: activeTabPath, onSelect: setActiveTabPath, onClose: closeTab }),
                        !activeTab ? el('div', { className: 'nhrfm-placeholder' }, el(SvgIcon, { name: 'code', size: 48 }), el('p', null, 'Select a file to edit')) :
                            el('div', { key: activeTab.path, style: { display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' } },
                                el('div', { className: 'nhrfm-editor-container' },
                                    activeTab.loading ? el('div', { className: 'nhrfm-loading' }, el(Spinner), ' Loading File...') :
                                        el(Editor, {
                                            key: activeTab.path,
                                            content: activeTab.content,
                                            language: Utils.getLanguage(activeTab.extension, activeTab.name),
                                            readOnly: activeTab.readOnly,
                                            onChange: updateTabContent,
                                            onValidation: setErrors
                                        }),
                                    // Save button overlay
                                    !activeTab.readOnly && activeTab.modified && el('button', {
                                        className: 'nhrfm-btn nhrfm-btn-primary',
                                        style: { position: 'absolute', bottom: 20, right: 20, zIndex: 100 },
                                        onClick: saveFile,
                                        disabled: saving
                                    }, saving ? el(Spinner) : el('span', { style: { display: 'flex', gap: 5 } }, el(SvgIcon, { name: 'save' }), 'Save'))
                                ),
                                el('div', { className: 'nhrfm-status-bar' },
                                    `${Utils.formatBytes(activeTab.size)} • ${activeTab.extension?.toUpperCase() || ''} • ${errors.length} Errors`
                                )
                            )
                    )
                )
            )
        );
    };

    document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('nhrfm-file-manager-app');
        if (root) wp.element.render(el(FileManager), root);
    });

})(window.wp);
