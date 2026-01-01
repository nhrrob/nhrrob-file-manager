/**
 * NHR File Manager - React App
 * Refactored for performance and maintainability
 */
(function(wp) {
    'use strict';

    const { createElement: el, useState, useEffect, useCallback, useRef, useMemo } = wp.element;
    const { Spinner } = wp.components;
    const apiFetch = wp.apiFetch;
    const { i18n, monacoPath } = window.nhrfmFileManager || {};

    // --- Utils & Assets ---
    const Icons = {
        folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
        folderOpen: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
        file: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
        code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
        save: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z',
        chevron: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
        search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
        trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
        lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
        warning: 'M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'
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
            const map = { php:'php', js:'javascript', html:'html', css:'css', scss:'scss', json:'json', md:'markdown', sql:'sql' };
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
            if (!containerRef.current || initialized.current || !window.require) return;
            if (containerRef.current.offsetWidth === 0) return;

            initialized.current = true;
            try {
                if (!window.require.config._monacoConfigured) {
                    window.require.config({ paths: { vs: monacoPath }, 'vs/nls': { availableLanguages: { '*': '' } } });
                    window.require.config._monacoConfigured = true;
                }
                window.MonacoEnvironment = window.MonacoEnvironment || { getWorkerUrl: () => '', getWorker: () => null };

                const origWarn = console.warn;
                // Suppress message bundle warnings
                console.warn = (...args) => args[0]?.includes?.('message bundle') ? null : origWarn.apply(console, args);

                window.require(['vs/editor/editor.main'], (m) => {
                    setMonaco(m);
                    console.warn = origWarn;
                }, (err) => {
                    setError('Failed to load Monaco');
                    console.warn = origWarn;
                });
            } catch (e) { setError(e.message); }
        }, [containerRef.current?.offsetWidth]);

        return { monaco, error };
    };

    // --- Components ---
    class ErrorBoundary extends wp.element.Component {
        constructor(props) { super(props); this.state = { hasError: false, error: null }; }
        static getDerivedStateFromError(error) { return { hasError: true, error }; }
        render() {
            if (this.state.hasError) return el('div', { className: 'nhrfm-error-boundary', style: {color:'red', padding:20} }, 'Error: ' + this.state.error?.message);
            return this.props.children;
        }
    }

    const TreeItem = ({ item, depth, selected, onSelect, expanded, onToggle, onDelete, canDelete }) => {
        const [confirm, setConfirm] = useState(false);
        const isFolder = item.isFolder;
        const isExpanded = expanded.has(item.id);

        return el('div', { className: 'nhrfm-tree-item-wrapper' },
            el('div', {
                className: `nhrfm-tree-item ${selected === item.id ? 'selected' : ''} ${item.readOnly ? 'readonly' : ''} ${item.sensitive ? 'sensitive' : ''}`,
                style: { paddingLeft: depth * 16 + 8 },
                onClick: () => isFolder ? onToggle(item.id) : onSelect(item.id)
            },
                el('span', { className: `nhrfm-tree-arrow ${isExpanded ? 'expanded' : ''}` }, isFolder ? el(SvgIcon, { name: 'chevron', size: 12 }) : null),
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
                item.children?.map(child => el(TreeItem, { key: child.id, item: child, depth: depth + 1, selected, onSelect, expanded, onToggle, onDelete, canDelete }))
            )
        );
    };

    const Editor = ({ content, language, readOnly, onChange, onValidation }) => {
        const container = useRef(null);
        const editorRef = useRef(null);
        const { monaco, error } = useMonaco(container);

        const validate = useCallback(async (code) => {
            if (language !== 'php') return;
            try {
                const res = await apiFetch({ path: 'nhrfm/v1/validate-php', method: 'POST', data: { code } });
                const markers = (res.errors || []).map(e => ({
                    severity: 8, startLineNumber: e.line || 1, startColumn: 1, endLineNumber: e.line || 1, endColumn: 1000, message: e.message
                }));
                if (monaco && editorRef.current) monaco.editor.setModelMarkers(editorRef.current.getModel(), 'php', markers);
                onValidation?.(res.errors || []);
            } catch (e) { console.error(e); }
        }, [language, monaco, onValidation]);

        useEffect(() => {
            if (!monaco || !container.current) return;
            if (editorRef.current) return; // Already created
            
            const ed = monaco.editor.create(container.current, {
                value: content || '', language, theme: 'vs-dark', readOnly,
                minimap: { enabled: true }, automaticLayout: true, formatOnType: true
            });
            editorRef.current = ed;

            ed.onDidChangeModelContent(() => {
                const val = ed.getValue();
                onChange(val);
                if (language === 'php') {
                    clearTimeout(window._valTimer);
                    window._valTimer = setTimeout(() => validate(val), 1000);
                }
            });
            
            if (language === 'php') validate(content);

            return () => { ed.dispose(); editorRef.current = null; };
        }, [monaco]);

        useEffect(() => {
            if (editorRef.current && content !== editorRef.current.getValue()) {
                 editorRef.current.setValue(content);
            }
        }, [content]);

        useEffect(() => {
             if (editorRef.current) {
                 const model = editorRef.current.getModel();
                 if (model && language) monaco.editor.setModelLanguage(model, language);
             }
        }, [language]);
        
        return el('div', { className: 'nhrfm-monaco-editor-container', ref: container, style: { width: '100%', height: '100%' } }, 
            !monaco && !error && el('div', { className: 'nhrfm-loading' }, el(Spinner), ' Loading Editor...'),
            error && el('div', { style: {color:'red', padding:20} }, error)
        );
    };

    const FileManager = () => {
        const [state, setState] = useState({ 
            files: [], type: 'plugins', selected: null, content: '', original: '', fileInfo: null, 
            loading: false, saving: false, query: '', expanded: new Set() 
        });
        const [errors, setErrors] = useState([]);

        const fetchFiles = useCallback(async () => {
            setState(s => ({ ...s, loading: true }));
            try {
                const files = await apiFetch({ path: `nhrfm/v1/files?type=${state.type}` });
                setState(s => ({ ...s, files: files || [], loading: false, selected: null, content: '' }));
            } catch (e) { Utils.toast(i18n?.loadError || 'Error', 'error'); setState(s => ({ ...s, loading: false })); }
        }, [state.type]);

        useEffect(() => { fetchFiles(); }, [fetchFiles]);

        const loadFile = async (path) => {
            setState(s => ({ ...s, loadingFile: true, selected: path }));
            try {
                const res = await apiFetch({ path: `nhrfm/v1/file?path=${encodeURIComponent(path)}&type=${state.type}` });
                setState(s => ({ ...s, content: res.content, original: res.content, fileInfo: res, loadingFile: false }));
            } catch (e) { Utils.toast('Failed to load', 'error'); }
        };

        const saveFile = async () => {
            if (state.saving) return;
            setState(s => ({ ...s, saving: true }));
            try {
                await apiFetch({ path: 'nhrfm/v1/file', method: 'POST', data: { path: state.selected, content: state.content, type: state.type } });
                setState(s => ({ ...s, original: state.content, saving: false }));
                Utils.toast(i18n?.saveSuccess || 'Saved');
            } catch (e) { Utils.toast(e.message, 'error'); setState(s => ({ ...s, saving: false })); }
        };

        const deleteItem = async (item) => {
            try {
                await apiFetch({ path: `nhrfm/v1/file?path=${encodeURIComponent(item.id)}&type=${state.type}`, method: 'DELETE' });
                Utils.toast(item.isFolder ? 'Folder deleted' : 'File deleted');
                if (state.selected === item.id) setState(s => ({ ...s, selected: null, content: '' }));
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

        const filteredFiles = useMemo(() => filter(state.files, state.query), [state.files, state.query]);

        return el('div', { className: 'nhrfm-main' },
            el('div', { className: 'nhrfm-sidebar' },
                el('div', { className: 'nhrfm-sidebar-header' },
                    el('h3', null, 'Files'),
                    el('select', { className: 'nhrfm-type-select', value: state.type, onChange: e => setState(s => ({ ...s, type: e.target.value })) },
                        el('optgroup', { label: 'WordPress Content' },
                            el('option', { value: 'plugins' }, 'Plugins'),
                            el('option', { value: 'themes' }, 'Themes'),
                            el('option', { value: 'wp-content' }, 'WP Content')
                        ),
                        el('optgroup', { label: 'WordPress Root' },
                            el('option', { value: 'wp-config' }, 'wp-config.php')
                        )
                    )
                ),
                state.type !== 'wp-config' && el('div', { className: 'nhrfm-search' },
                    el('input', { type: 'text', placeholder: 'Search...', value: state.query, onChange: e => setState(s => ({ ...s, query: e.target.value })) })
                ),
                el('div', { className: 'nhrfm-tree-container' },
                    state.loading ? el('div', { className: 'nhrfm-loading' }, el(Spinner)) : 
                    filteredFiles.map(i => el(TreeItem, {
                        key: i.id, item: i, depth: 0, selected: state.selected,
                        onSelect: loadFile,
                        expanded: state.expanded,
                        onToggle: (id) => {
                            const next = new Set(state.expanded);
                            next.has(id) ? next.delete(id) : next.add(id);
                            setState(s => ({ ...s, expanded: next }));
                        },
                        onDelete: deleteItem,
                        canDelete: state.type !== 'wp-config'
                    }))
                )
            ),
            el('div', { className: 'nhrfm-editor-panel' },
                !state.selected ? el('div', { className: 'nhrfm-placeholder' }, el(SvgIcon, { name: 'code', size: 48 }), el('p', null, 'Select a file')) :
                el('div', { key: 'editor-content' },
                    el('div', { className: 'nhrfm-editor-header' },
                        el('div', { className: 'nhrfm-file-info' },
                             el('span', { className: 'nhrfm-file-path' }, state.selected),
                             state.fileInfo?.readOnly && el('span', { className: 'nhrfm-readonly-badge' }, el(SvgIcon, { name: 'lock' }), ' Read-only'),
                             state.content !== state.original && !state.fileInfo?.readOnly && el('span', { className: 'nhrfm-file-modified' }, 'Modified')
                        ),
                        el('div', { className: 'nhrfm-editor-actions' },
                            !state.fileInfo?.readOnly && el('button', { 
                                className: 'nhrfm-btn nhrfm-btn-primary', 
                                onClick: saveFile,
                                disabled: state.content === state.original || state.saving
                            }, state.saving ? el(Spinner) : el('span', {style:{display:'flex', gap:5}}, el(SvgIcon,{name:'save'}), 'Save'))
                        )
                    ),
                    el('div', { className: 'nhrfm-editor-container' },
                        state.loadingFile ? el('div', { className: 'nhrfm-loading' }, el(Spinner), ' Loading File...') :
                        state.fileInfo && el(Editor, {
                            key: state.selected,
                            content: state.content,
                            language: Utils.getLanguage(state.fileInfo?.extension, state.selected),
                            readOnly: state.fileInfo?.readOnly,
                            onChange: c => setState(s => ({ ...s, content: c })),
                            onValidation: setErrors
                        })
                    ),
                    el('div', { className: 'nhrfm-status-bar' }, 
                        `${Utils.formatBytes(state.fileInfo?.size)} • ${state.fileInfo?.extension?.toUpperCase() || ''} • ${errors.length} Errors`
                    )
                )
            )
        );
    };

    document.addEventListener('DOMContentLoaded', () => {
        const root = document.getElementById('nhrfm-file-manager-app');
        if (root) wp.element.render(el(ErrorBoundary, null, el(FileManager)), root);
    });

})(window.wp);
