/**
 * NHR File Manager - React App
 * Modern file browser and editor for WordPress
 */
(function() {
    'use strict';

    const { createElement: el, useState, useEffect, useCallback, useRef, Fragment } = wp.element;
    const { Button, Spinner } = wp.components;
    const apiFetch = wp.apiFetch;

    // Icons
    const Icons = {
        folder: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' })
        ),
        folderOpen: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z' })
        ),
        file: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z' })
        ),
        code: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' })
        ),
        save: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z' })
        ),
        chevron: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 12, height: 12 },
            el('path', { d: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z' })
        ),
        search: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z' })
        ),
        trash: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z' })
        ),
        lock: el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: 16, height: 16 },
            el('path', { d: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z' })
        ),
    };

    // Toast notification helper
    function showToast(message, type = 'success') {
        const existing = document.querySelector('.nhrfm-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `nhrfm-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 3000);
    }

    // Get file extension icon color
    function getFileColor(extension) {
        const colors = {
            php: '#777BB3',
            js: '#F7DF1E',
            jsx: '#61DAFB',
            ts: '#3178C6',
            tsx: '#3178C6',
            css: '#264DE4',
            scss: '#CC6699',
            html: '#E34F26',
            json: '#000000',
            md: '#083FA1',
            txt: '#666666',
            log: '#8B4513',
        };
        return colors[extension] || '#666666';
    }

    // Tree Item Component
    function TreeItem({ item, depth, selectedFile, onSelectFile, expandedFolders, onToggleFolder, onDeleteItem, fileType }) {
        const isExpanded = expandedFolders.has(item.id);
        const isSelected = selectedFile === item.id;
        const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

        const handleClick = useCallback(() => {
            if (item.isFolder) {
                onToggleFolder(item.id);
            } else {
                onSelectFile(item.id);
            }
        }, [item, onSelectFile, onToggleFolder]);

        const handleDeleteClick = useCallback((e) => {
            e.stopPropagation();
            setShowDeleteConfirm(true);
        }, []);

        const handleConfirmDelete = useCallback((e) => {
            e.stopPropagation();
            onDeleteItem(item.id, item.isFolder);
            setShowDeleteConfirm(false);
        }, [item, onDeleteItem]);

        const handleCancelDelete = useCallback((e) => {
            e.stopPropagation();
            setShowDeleteConfirm(false);
        }, []);

        // Don't show delete for wp-config or sensitive files
        const canDelete = fileType !== 'wp-config' && !item.sensitive;

        return el(Fragment, null,
            el('div', {
                className: `nhrfm-tree-item ${isSelected ? 'selected' : ''} ${item.readOnly ? 'readonly' : ''} ${item.sensitive ? 'sensitive' : ''}`,
                style: { paddingLeft: depth * 16 + 8 },
                onClick: handleClick,
            },
                item.isFolder && el('span', {
                    className: `nhrfm-tree-arrow ${isExpanded ? 'expanded' : ''}`
                }, Icons.chevron),
                !item.isFolder && el('span', { className: 'nhrfm-tree-arrow' }),
                el('span', {
                    className: 'icon',
                    style: { color: item.isFolder ? '#8B7355' : getFileColor(item.extension) }
                }, item.isFolder ? (isExpanded ? Icons.folderOpen : Icons.folder) : Icons.file),
                el('span', { className: 'name' }, item.name),
                item.readOnly && el('span', { className: 'nhrfm-readonly-badge', title: 'Read-only' }, Icons.lock),
                item.sensitive && el('span', { className: 'nhrfm-sensitive-badge', title: 'Sensitive file' }, Icons.warning),
                canDelete && el('span', {
                    className: 'nhrfm-delete-btn',
                    onClick: handleDeleteClick,
                    title: 'Delete'
                }, Icons.trash)
            ),
            showDeleteConfirm && el('div', {
                className: 'nhrfm-delete-confirm',
                style: { paddingLeft: depth * 16 + 24 },
                onClick: (e) => e.stopPropagation()
            },
                el('span', null, `Delete "${item.name}"?`),
                el('button', { className: 'nhrfm-confirm-yes', onClick: handleConfirmDelete }, 'Yes'),
                el('button', { className: 'nhrfm-confirm-no', onClick: handleCancelDelete }, 'No')
            ),
            item.isFolder && isExpanded && item.children && el('div', { className: 'nhrfm-tree-children' },
                item.children.map(child =>
                    el(TreeItem, {
                        key: child.id,
                        item: child,
                        depth: depth + 1,
                        selectedFile,
                        onSelectFile,
                        expandedFolders,
                        onToggleFolder,
                        onDeleteItem,
                        fileType,
                    })
                )
            )
        );
    }

    // File Tree Component
    function FileTree({ files, selectedFile, onSelectFile, loading, searchQuery, onDeleteItem, fileType }) {
        const [expandedFolders, setExpandedFolders] = useState(new Set());

        const toggleFolder = useCallback((folderId) => {
            setExpandedFolders(prev => {
                const next = new Set(prev);
                if (next.has(folderId)) {
                    next.delete(folderId);
                } else {
                    next.add(folderId);
                }
                return next;
            });
        }, []);

        // Filter files based on search query
        const filterFiles = useCallback((items, query) => {
            if (!query) return items;

            return items.reduce((acc, item) => {
                if (item.isFolder && item.children) {
                    const filteredChildren = filterFiles(item.children, query);
                    if (filteredChildren.length > 0) {
                        acc.push({ ...item, children: filteredChildren });
                    }
                } else if (item.name.toLowerCase().includes(query.toLowerCase())) {
                    acc.push(item);
                }
                return acc;
            }, []);
        }, []);

        const filteredFiles = filterFiles(files, searchQuery);

        if (loading) {
            return el('div', { className: 'nhrfm-loading' },
                el(Spinner),
                el('span', null, 'Loading files...')
            );
        }

        return el('div', { className: 'nhrfm-tree-container' },
            filteredFiles.map(item =>
                el(TreeItem, {
                    key: item.id,
                    item,
                    depth: 0,
                    selectedFile,
                    onSelectFile,
                    expandedFolders,
                    onToggleFolder: toggleFolder,
                    onDeleteItem,
                    fileType,
                })
            )
        );
    }

    // Code Editor Component
    function CodeEditor({ content, onChange, readOnly }) {
        const textareaRef = useRef(null);

        const handleKeyDown = useCallback((e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const value = e.target.value;
                e.target.value = value.substring(0, start) + '    ' + value.substring(end);
                e.target.selectionStart = e.target.selectionEnd = start + 4;
                onChange(e.target.value);
            }
        }, [onChange]);

        return el('textarea', {
            ref: textareaRef,
            className: 'nhrfm-code-editor',
            value: content,
            onChange: (e) => onChange(e.target.value),
            onKeyDown: handleKeyDown,
            readOnly,
            spellCheck: false,
        });
    }

    // Main App Component
    function FileManagerApp() {
        const [files, setFiles] = useState([]);
        const [loading, setLoading] = useState(true);
        const [fileType, setFileType] = useState('plugins');
        const [selectedFile, setSelectedFile] = useState(null);
        const [fileContent, setFileContent] = useState('');
        const [originalContent, setOriginalContent] = useState('');
        const [fileInfo, setFileInfo] = useState(null);
        const [saving, setSaving] = useState(false);
        const [loadingFile, setLoadingFile] = useState(false);
        const [searchQuery, setSearchQuery] = useState('');
        const [deleting, setDeleting] = useState(false);

        // Determine if current file is read-only
        const isReadOnly = fileInfo?.readOnly || false;

        // Load file tree
        const loadFiles = useCallback(async () => {
            setLoading(true);
            try {
                const response = await apiFetch({
                    path: `nhrfm/v1/files?type=${fileType}`,
                });
                setFiles(response || []);
            } catch (error) {
                console.error('Failed to load files:', error);
                showToast(nhrfmFileManager.i18n.loadError, 'error');
            } finally {
                setLoading(false);
            }
        }, [fileType]);

        useEffect(() => {
            loadFiles();
        }, [loadFiles]);

        // Load file content
        const loadFileContent = useCallback(async (path) => {
            setLoadingFile(true);
            try {
                const response = await apiFetch({
                    path: `nhrfm/v1/file?path=${encodeURIComponent(path)}&type=${fileType}`,
                });
                setFileContent(response.content);
                setOriginalContent(response.content);
                setFileInfo(response);
            } catch (error) {
                console.error('Failed to load file:', error);
                showToast(error.message || nhrfmFileManager.i18n.loadError, 'error');
            } finally {
                setLoadingFile(false);
            }
        }, [fileType]);

        const handleSelectFile = useCallback((path) => {
            setSelectedFile(path);
            loadFileContent(path);
        }, [loadFileContent]);

        // Save file
        const handleSave = useCallback(async () => {
            if (!selectedFile || saving || isReadOnly) return;

            setSaving(true);
            try {
                await apiFetch({
                    path: 'nhrfm/v1/file',
                    method: 'POST',
                    data: {
                        path: selectedFile,
                        content: fileContent,
                        type: fileType,
                    },
                });
                setOriginalContent(fileContent);
                showToast(nhrfmFileManager.i18n.saveSuccess, 'success');
            } catch (error) {
                console.error('Failed to save file:', error);
                showToast(error.message || nhrfmFileManager.i18n.saveError, 'error');
            } finally {
                setSaving(false);
            }
        }, [selectedFile, fileContent, fileType, saving, isReadOnly]);

        // Delete file or folder
        const handleDelete = useCallback(async (path, isFolder) => {
            if (deleting) return;

            setDeleting(true);
            try {
                await apiFetch({
                    path: `nhrfm/v1/file?path=${encodeURIComponent(path)}&type=${fileType}`,
                    method: 'DELETE',
                });
                showToast(isFolder ? 'Folder deleted successfully' : 'File deleted successfully', 'success');

                // Clear selection if deleted file was selected
                if (selectedFile === path) {
                    setSelectedFile(null);
                    setFileContent('');
                    setFileInfo(null);
                }

                // Reload file tree
                loadFiles();
            } catch (error) {
                console.error('Failed to delete:', error);
                showToast(error.message || 'Failed to delete item', 'error');
            } finally {
                setDeleting(false);
            }
        }, [fileType, deleting, selectedFile, loadFiles]);

        // Keyboard shortcut for save
        useEffect(() => {
            const handleKeyboard = (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (!isReadOnly) {
                        handleSave();
                    }
                }
            };
            document.addEventListener('keydown', handleKeyboard);
            return () => document.removeEventListener('keydown', handleKeyboard);
        }, [handleSave, isReadOnly]);

        const isModified = fileContent !== originalContent;

        // File type options with grouping
        const fileTypeOptions = [
            { group: 'WordPress Content', options: [
                { value: 'plugins', label: 'Plugins' },
                { value: 'themes', label: 'Themes' },
                { value: 'wp-content', label: 'WP Content' },
            ]},
            { group: 'WordPress Root', options: [
                { value: 'wp-config', label: 'wp-config.php' },
            ]},
        ];

        return el('div', { className: 'nhrfm-main' },
            // Sidebar
            el('div', { className: 'nhrfm-sidebar' },
                el('div', { className: 'nhrfm-sidebar-header' },
                    el('h3', null, 'Files'),
                    el('select', {
                        className: 'nhrfm-type-select',
                        value: fileType,
                        onChange: (e) => {
                            setFileType(e.target.value);
                            setSelectedFile(null);
                            setFileContent('');
                            setFileInfo(null);
                        },
                    },
                        fileTypeOptions.map(group =>
                            el('optgroup', { key: group.group, label: group.group },
                                group.options.map(opt =>
                                    el('option', { key: opt.value, value: opt.value }, opt.label)
                                )
                            )
                        )
                    )
                ),
                fileType !== 'wp-config' && el('div', { className: 'nhrfm-search' },
                    el('input', {
                        type: 'text',
                        placeholder: 'Search files...',
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value),
                    })
                ),
                el(FileTree, {
                    files,
                    selectedFile,
                    onSelectFile: handleSelectFile,
                    loading,
                    searchQuery,
                    onDeleteItem: handleDelete,
                    fileType,
                })
            ),
            // Editor Panel
            el('div', { className: 'nhrfm-editor-panel' },
                selectedFile ? el(Fragment, null,
                    el('div', { className: 'nhrfm-editor-header' },
                        el('div', { className: 'nhrfm-file-info' },
                            el('span', { className: 'nhrfm-file-path' }, selectedFile),
                            isReadOnly && el('span', { className: 'nhrfm-file-readonly' }, Icons.lock, 'Read-only'),
                            isModified && !isReadOnly && el('span', { className: 'nhrfm-file-modified' }, 'Modified')
                        ),
                        el('div', { className: 'nhrfm-editor-actions' },
                            !isReadOnly && el(Button, {
                                className: 'nhrfm-btn nhrfm-btn-primary',
                                onClick: handleSave,
                                disabled: !isModified || saving,
                            }, saving ? el(Spinner) : Icons.save, saving ? 'Saving...' : 'Save')
                        )
                    ),
                    el('div', { className: 'nhrfm-editor-container' },
                        loadingFile ? el('div', { className: 'nhrfm-loading' },
                            el(Spinner),
                            el('span', null, 'Loading file...')
                        ) : el(CodeEditor, {
                            content: fileContent,
                            onChange: setFileContent,
                            readOnly: isReadOnly,
                        })
                    ),
                    fileInfo && el('div', { className: 'nhrfm-status-bar' },
                        el('span', null, `${fileInfo.extension.toUpperCase()} • ${formatBytes(fileInfo.size)}${isReadOnly ? ' • Read-only' : ''}`),
                        el('span', null, `Last modified: ${new Date(fileInfo.modified * 1000).toLocaleString()}`)
                    )
                ) : el('div', { className: 'nhrfm-placeholder' },
                    Icons.code,
                    el('p', null, 'Select a file to view and edit')
                )
            )
        );
    }

    // Format bytes helper
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Initialize the app
    document.addEventListener('DOMContentLoaded', function() {
        const container = document.getElementById('nhrfm-file-manager-app');
        if (container) {
            wp.element.render(el(FileManagerApp), container);
        }
    });
})();
