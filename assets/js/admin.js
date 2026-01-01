/**
 * NHR File Manager - React App
 */
(function() {
    'use strict';

    const { createElement: el, useState, useEffect, useCallback, useRef } = wp.element;
    const { Spinner } = wp.components;
    const apiFetch = wp.apiFetch;

    // Icon helper
    const icon = (d, w = 16, h = 16) => el('svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: w, height: h }, el('path', { d }));
    const Icons = {
        folder: icon('M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z'),
        folderOpen: icon('M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z'),
        file: icon('M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z'),
        code: icon('M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z'),
        save: icon('M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z'),
        chevron: icon('M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z', 12, 12),
        search: icon('M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'),
        trash: icon('M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z'),
        lock: icon('M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z'),
        warning: icon('M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'),
    };

    const showToast = (message, type = 'success') => {
        const existing = document.querySelector('.nhrfm-toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = `nhrfm-toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const getFileColor = (ext) => ({ php: '#777BB3', js: '#F7DF1E', jsx: '#61DAFB', ts: '#3178C6', tsx: '#3178C6', css: '#264DE4', scss: '#CC6699', html: '#E34F26', json: '#000000', md: '#083FA1', txt: '#666666', log: '#8B4513' }[ext] || '#666666');

    const getLanguage = (ext, filename) => {
        if (filename === 'wp-config.php') return 'php';
        if (filename === '.htaccess') return 'apache';
        const map = { php: 'php', js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', css: 'css', scss: 'scss', sass: 'sass', less: 'less', html: 'html', htm: 'html', xml: 'xml', json: 'json', md: 'markdown', yml: 'yaml', yaml: 'yaml', sql: 'sql', sh: 'shell', bash: 'shell', py: 'python', java: 'java', c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp', rb: 'ruby', go: 'go', rs: 'rust', swift: 'swift', kt: 'kotlin', vue: 'vue', svelte: 'svelte', twig: 'twig', blade: 'php', txt: 'plaintext', log: 'plaintext', ini: 'ini', conf: 'ini', config: 'ini' };
        return map[(ext || '').toLowerCase()] || 'plaintext';
    };

    class ErrorBoundary extends wp.element.Component {
        constructor(props) {
            super(props);
            this.state = { hasError: false, error: null };
        }
        static getDerivedStateFromError(error) {
            return { hasError: true, error };
        }
        componentDidCatch(error, errorInfo) {
            console.error('FileManager Error:', error, errorInfo);
        }
        render() {
            if (this.state.hasError) {
                return el('div', { className: 'nhrfm-error-boundary', style: { padding: '20px', color: '#d63638' } }, 
                    el('p', null, 'Something went wrong rendering this component.'),
                    el('pre', { style: { overflow: 'auto', marginTop: '10px' } }, this.state.error && this.state.error.toString())
                );
            }
            return this.props.children;
        }
    }

    const formatBytes = (bytes) => {
        const b = parseFloat(bytes);
        if (!b || isNaN(b) || b === 0) return '0 Bytes';
        const k = 1024, sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(b) / Math.log(k));
        return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + (sizes[i] || 'Bytes');
    };

    function TreeItem({ item, depth, selectedFile, onSelectFile, expandedFolders, onToggleFolder, onDeleteItem, fileType }) {
        const isExpanded = expandedFolders.has(item.id);
        const isSelected = selectedFile === item.id;
        const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
        const canDelete = fileType !== 'wp-config' && !item.sensitive;

        return el('div', { className: 'nhrfm-tree-item-wrapper' },
            el('div', {
                className: `nhrfm-tree-item ${isSelected ? 'selected' : ''} ${item.readOnly ? 'readonly' : ''} ${item.sensitive ? 'sensitive' : ''}`,
                style: { paddingLeft: depth * 16 + 8 },
                onClick: () => item.isFolder ? onToggleFolder(item.id) : onSelectFile(item.id),
            },
                item.isFolder && el('span', { className: `nhrfm-tree-arrow ${isExpanded ? 'expanded' : ''}` }, Icons.chevron),
                !item.isFolder && el('span', { className: 'nhrfm-tree-arrow' }),
                el('span', { className: 'icon', style: { color: item.isFolder ? '#8B7355' : getFileColor(item.extension) } },
                    item.isFolder ? (isExpanded ? Icons.folderOpen : Icons.folder) : Icons.file),
                el('span', { className: 'name' }, item.name),
                item.readOnly && el('span', { className: 'nhrfm-readonly-badge', title: 'Read-only' }, Icons.lock),
                item.sensitive && el('span', { className: 'nhrfm-sensitive-badge', title: 'Sensitive file' }, Icons.warning),
                canDelete && el('span', { className: 'nhrfm-delete-btn', onClick: (e) => { e.stopPropagation(); setShowDeleteConfirm(true); }, title: 'Delete' }, Icons.trash)
            ),
            showDeleteConfirm && el('div', { className: 'nhrfm-delete-confirm', style: { paddingLeft: depth * 16 + 24 }, onClick: (e) => e.stopPropagation() },
                el('span', null, `Delete "${item.name}"?`),
                el('button', { className: 'nhrfm-confirm-yes', onClick: (e) => { e.stopPropagation(); onDeleteItem(item.id, item.isFolder); setShowDeleteConfirm(false); } }, 'Yes'),
                el('button', { className: 'nhrfm-confirm-no', onClick: (e) => { e.stopPropagation(); setShowDeleteConfirm(false); } }, 'No')
            ),
            item.isFolder && isExpanded && Array.isArray(item.children) && el('div', { className: 'nhrfm-tree-children' },
                item.children.map(child => child && child.id ? el(TreeItem, { key: child.id, item: child, depth: depth + 1, selectedFile, onSelectFile, expandedFolders, onToggleFolder, onDeleteItem, fileType }) : null)
            )
        );
    }

    function FileTree({ files, selectedFile, onSelectFile, loading, searchQuery, onDeleteItem, fileType }) {
        const [expandedFolders, setExpandedFolders] = useState(new Set());
        const toggleFolder = useCallback((id) => setExpandedFolders(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; }), []);
        const filterFiles = useCallback((items, query) => {
            if (!Array.isArray(items)) return [];
            return items.reduce((acc, item) => {
                if (!item || !item.id) return acc;
                if (item.isFolder && Array.isArray(item.children)) {
                    const filtered = filterFiles(item.children, query);
                    if (filtered.length > 0) acc.push({ ...item, children: filtered });
                } else if (typeof item.name === 'string' && (!query || item.name.toLowerCase().includes(query.toLowerCase()))) {
                    acc.push(item);
                }
                return acc;
            }, []);
        }, []);

        if (loading) return el('div', { className: 'nhrfm-loading' }, el(Spinner), el('span', null, 'Loading files...'));
        const fileList = Array.isArray(files) ? files : [];
        return el('div', { className: 'nhrfm-tree-container' },
            filterFiles(fileList, searchQuery).map(item => item && item.id ? el(TreeItem, { key: item.id, item, depth: 0, selectedFile, onSelectFile, expandedFolders, onToggleFolder: toggleFolder, onDeleteItem, fileType }) : null)
        );
    }

    function CodeEditor({ content, onChange, readOnly, fileExtension, filename, onErrorsChange }) {
        const editorRef = useRef(null);
        const containerRef = useRef(null);
        const monacoRef = useRef(null);
        const onChangeRef = useRef(onChange);
        const validatePHPSyntaxRef = useRef(null);
        const isMountedRef = useRef(true);
        const instanceIdRef = useRef(Math.random().toString(36).substr(2, 9));
        const [monacoReady, setMonacoReady] = useState(false);
        const [errors, setErrors] = useState([]);
        const [useFallback, setUseFallback] = useState(false);
        const [initError, setInitError] = useState(null);
        const initAttempted = useRef(false);

        useEffect(() => {
            onChangeRef.current = onChange;
        }, [onChange]);

        const setMarkers = (markers) => {
            if (!isMountedRef.current) return;
            if (editorRef.current?.getModel() && monacoRef.current) {
                try {
                    monacoRef.current.editor.setModelMarkers(editorRef.current.getModel(), 'php-validation', markers);
                } catch (e) {
                    if (isMountedRef.current) {
                        console.warn('Error setting markers:', e);
                    }
                }
            }
        };

        const validatePHPSyntax = useCallback(async (code) => {
            if (!isMountedRef.current) return;
            try {
                const res = await apiFetch({ path: 'nhrfm/v1/validate-php', method: 'POST', data: { code } });
                if (!isMountedRef.current) return;
                if (res.valid === false && res.errors) {
                    const markers = res.errors.map(e => ({ severity: monacoRef.current?.MarkerSeverity?.Error || 8, startLineNumber: e.line || 1, startColumn: e.column || 1, endLineNumber: e.line || 1, endColumn: e.column || 1000, message: e.message || 'Syntax error' }));
                    setMarkers(markers);
                    setErrors(res.errors);
                    if (onErrorsChange) onErrorsChange(res.errors);
                } else {
                    setMarkers([]);
                    setErrors([]);
                    if (onErrorsChange) onErrorsChange([]);
                }
            } catch (e) { 
                if (isMountedRef.current) {
                    console.error('PHP validation error:', e);
                }
            }
        }, [onErrorsChange]);

        useEffect(() => {
            validatePHPSyntaxRef.current = validatePHPSyntax;
        }, [validatePHPSyntax]);

        const suppressConsole = (fn) => {
            const original = console[fn];
            console[fn] = (...args) => {
                const msg = args[0];
                if (typeof msg === 'string' && (msg.includes('message bundle') || msg.includes('Failed to load message bundle') || msg.includes('nls'))) return;
                original.apply(console, args);
            };
            return original;
        };

        const initializeMonaco = useCallback(() => {
            const currentInstanceId = instanceIdRef.current;
            if (initAttempted.current || monacoReady || !containerRef.current || !isMountedRef.current) return;
            if (!window.require) { 
                if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                    setInitError('Monaco Editor loader not available');
                }
                return; 
            }
            if (!nhrfmFileManager?.monacoPath) { 
                if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                    setInitError('Monaco Editor path not configured');
                }
                return; 
            }

            initAttempted.current = true;
            const initialContent = content || '';
            const initialLanguage = getLanguage(fileExtension, filename);
            
            try {
                if (!window.require.config._monacoConfigured) {
                    window.require.config({ paths: { vs: nhrfmFileManager.monacoPath }, 'vs/nls': { availableLanguages: { '*': '' } } });
                    window.require.config._monacoConfigured = true;
                }
                if (!window.MonacoEnvironment) {
                    window.MonacoEnvironment = { getWorkerUrl: () => '', getWorker: () => null };
                }

                window.require(['vs/editor/editor.main'], (monaco) => {
                    // Check if this instance is still mounted and is the current instance
                    if (!containerRef.current || !isMountedRef.current || instanceIdRef.current !== currentInstanceId) {
                        initAttempted.current = false;
                        return;
                    }

                    const origWarn = suppressConsole('warn');
                    const origError = suppressConsole('error');
                    monacoRef.current = monaco;

                    try {
                        // Double-check instance is still valid
                        if (!containerRef.current || !isMountedRef.current || instanceIdRef.current !== currentInstanceId) {
                            initAttempted.current = false;
                            console.warn = origWarn;
                            console.error = origError;
                            return;
                        }

                        const editor = monaco.editor.create(containerRef.current, {
                            value: initialContent, language: initialLanguage, theme: 'vs-dark', readOnly,
                            fontSize: 14, lineNumbers: 'on', minimap: { enabled: true }, scrollBeyondLastLine: false, wordWrap: 'on',
                            automaticLayout: true, tabSize: 4, insertSpaces: true, detectIndentation: true, formatOnPaste: true,
                            formatOnType: true, folding: true, bracketPairColorization: { enabled: true },
                            suggest: { showKeywords: true, showSnippets: true }, quickSuggestions: { other: true, comments: false, strings: true }
                        });

                        // Triple-check before setting refs
                        if (!isMountedRef.current || instanceIdRef.current !== currentInstanceId) {
                            try {
                                editor.dispose();
                            } catch (e) {
                                // Ignore disposal errors
                            }
                            initAttempted.current = false;
                            console.warn = origWarn;
                            console.error = origError;
                            return;
                        }

                        setTimeout(() => {
                            if (isMountedRef.current && editorRef.current && instanceIdRef.current === currentInstanceId) {
                                try {
                                    editor.layout();
                                } catch (e) {
                                    // Ignore layout errors
                                }
                            }
                        }, 100);
                        editor.onDidChangeModelContent(() => {
                            if (!isMountedRef.current || instanceIdRef.current !== currentInstanceId) return;
                            if (onChangeRef.current && typeof onChangeRef.current === 'function') {
                                try {
                                    onChangeRef.current(editor.getValue());
                                } catch (e) {
                                    // Ignore callback errors
                                }
                            }
                            if (monaco.editor.getModel(editor.getModel().uri)?.getLanguageId() === 'php') {
                                clearTimeout(window.phpValidationTimeout);
                                window.phpValidationTimeout = setTimeout(() => {
                                    if (validatePHPSyntaxRef.current && isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                                        validatePHPSyntaxRef.current(editor.getValue());
                                    }
                                }, 500);
                            }
                        });
                        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {});

                        editorRef.current = editor;
                        if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                            setMonacoReady(true);
                        }
                        setTimeout(() => { console.warn = origWarn; console.error = origError; }, 1000);
                    } catch (e) {
                        console.error('Error creating Monaco editor:', e);
                        initAttempted.current = false;
                        if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                            setInitError('Failed to create Monaco Editor: ' + (e.message || 'Unknown error'));
                        }
                        console.warn = origWarn;
                        console.error = origError;
                    }
                }, (e) => {
                    console.error('Monaco Editor load error:', e);
                    initAttempted.current = false;
                    if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                        setInitError('Failed to load Monaco Editor: ' + (e.message || 'Unknown error'));
                    }
                });
            } catch (e) {
                console.error('Monaco require.config error:', e);
                initAttempted.current = false;
                if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                    setInitError('Failed to configure Monaco Editor: ' + (e.message || 'Unknown error'));
                }
            }
        }, [content, fileExtension, filename, readOnly]);

        useEffect(() => {
            if (monacoReady || initAttempted.current || !isMountedRef.current) return;
            const currentInstanceId = instanceIdRef.current;
            let attempts = 0, checkInterval = null;
            const tryInit = () => {
                // Check if this instance is still valid
                if (instanceIdRef.current !== currentInstanceId || !isMountedRef.current) {
                    if (checkInterval) clearInterval(checkInterval);
                    return false;
                }
                attempts++;
                if (!containerRef.current) return attempts < 50;
                const rect = containerRef.current.getBoundingClientRect();
                if ((rect.width === 0 || rect.height === 0) && attempts < 50) return true;
                if (!window.require) return attempts < 50;
                if (instanceIdRef.current === currentInstanceId && isMountedRef.current) {
                    initializeMonaco();
                }
                return false;
            };
            const timeout = setTimeout(() => {
                if (instanceIdRef.current !== currentInstanceId || !isMountedRef.current) return;
                tryInit();
                checkInterval = setInterval(() => {
                    if (monacoReady || initAttempted.current || attempts >= 50 || instanceIdRef.current !== currentInstanceId || !isMountedRef.current) {
                        if (checkInterval) clearInterval(checkInterval);
                        return;
                    }
                    tryInit();
                }, 200);
            }, 100);
            return () => { 
                clearTimeout(timeout); 
                if (checkInterval) clearInterval(checkInterval); 
            };
        }, [monacoReady, initializeMonaco]);

        useEffect(() => {
            if (!monacoReady) return;
            const fallbackTimeout = setTimeout(() => {
                if (!isMountedRef.current) return;
                if (!monacoReady && !initAttempted.current) {
                    setInitError('Monaco Editor loader not available');
                } else if (!monacoReady && initAttempted.current) {
                    setInitError('Monaco Editor failed to initialize');
                    setUseFallback(true);
                }
            }, 8000);
            return () => clearTimeout(fallbackTimeout);
        }, [monacoReady]);

        useEffect(() => {
            if (!isMountedRef.current) return;
            const currentInstanceId = instanceIdRef.current;
            if (editorRef.current && monacoRef.current && monacoReady) {
                // Verify this is still the current instance
                if (instanceIdRef.current !== currentInstanceId) return;
                
                const model = editorRef.current.getModel();
                if (!model || !isMountedRef.current || instanceIdRef.current !== currentInstanceId) return;
                
                try {
                    const lang = getLanguage(fileExtension, filename);
                    if (model.getLanguageId() !== lang) {
                        monacoRef.current.editor.setModelLanguage(model, lang);
                    }
                    if (content !== undefined && content !== null && content !== editorRef.current.getValue()) {
                        const scrollTop = editorRef.current.getScrollTop(), scrollLeft = editorRef.current.getScrollLeft();
                        model.setValue(content || '');
                        setTimeout(() => {
                            if (editorRef.current && isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                                try {
                                    editorRef.current.setScrollTop(scrollTop);
                                    editorRef.current.setScrollLeft(scrollLeft);
                                    editorRef.current.layout();
                                } catch (e) {
                                    // Ignore layout errors
                                }
                            }
                        }, 0);
                    }
                    if (onErrorsChange && isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                        setErrors([]);
                        onErrorsChange([]);
                        setMarkers([]);
                    }
                } catch (e) {
                    if (isMountedRef.current && instanceIdRef.current === currentInstanceId) {
                        console.warn('Error updating editor content:', e);
                    }
                }
            }
        }, [content, fileExtension, filename, monacoReady, onErrorsChange]);

        useEffect(() => {
            if (!isMountedRef.current) return;
            if (editorRef.current && monacoReady) {
                try {
                    editorRef.current.updateOptions({ readOnly });
                } catch (e) {
                    if (isMountedRef.current) {
                        console.warn('Error updating editor options:', e);
                    }
                }
            }
        }, [readOnly, monacoReady]);

        // Cleanup effect to dispose Monaco editor on unmount
        useEffect(() => {
            return () => {
                const instanceId = instanceIdRef.current;
                isMountedRef.current = false;
                
                // Clear any pending timeouts
                if (window.phpValidationTimeout) {
                    clearTimeout(window.phpValidationTimeout);
                    window.phpValidationTimeout = null;
                }
                
                if (editorRef.current) {
                    try {
                        editorRef.current.dispose();
                    } catch (e) {
                        // Ignore disposal errors - editor might already be disposed
                    }
                    editorRef.current = null;
                }
                monacoRef.current = null;
                initAttempted.current = false;
                
                // Reset state to prevent updates after unmount
                // Note: We can't call setState in cleanup, but we've already set isMountedRef to false
            };
        }, []);

        if (useFallback && !monacoReady) {
            return el('textarea', {
                className: 'nhrfm-code-editor', value: content, onChange: (e) => onChange(e.target.value),
                onKeyDown: (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        const start = e.target.selectionStart, end = e.target.selectionEnd, val = e.target.value;
                        e.target.value = val.substring(0, start) + '    ' + val.substring(end);
                        e.target.selectionStart = e.target.selectionEnd = start + 4;
                        onChange(e.target.value);
                    }
                },
                readOnly, spellCheck: false, style: { width: '100%', height: '100%' }
            });
        }

        if (initError && !useFallback) {
            return el('div', { className: 'nhrfm-monaco-editor-container', style: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4d4d4', background: '#1e1e1e', minHeight: '400px', padding: '20px', textAlign: 'center' } },
                el('div', null, el('p', { style: { color: '#d63638', marginBottom: '10px' } }, '⚠️ Error'), el('p', { style: { fontSize: '13px', lineHeight: '1.5' } }, initError))
            );
        }

        const containerRefCallback = useCallback((node) => {
            containerRef.current = node;
        }, []);

        return el('div', {
            ref: containerRefCallback,
            className: 'nhrfm-monaco-editor-container',
            style: { width: '100%', height: '100%', ...(monacoReady ? {} : { display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d4d4d4', background: '#1e1e1e', minHeight: '400px' }) }
        }, monacoReady ? null : el('div', { style: { textAlign: 'center', padding: '20px' } }, el(Spinner), el('p', { style: { marginTop: '10px', fontSize: '13px' } }, 'Loading Monaco Editor...')));
    }

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
        const [editorErrors, setEditorErrors] = useState([]);
        const isReadOnly = fileInfo?.readOnly || false;

        const loadFiles = useCallback(async () => {
            setLoading(true);
            try {
                const res = await apiFetch({ path: `nhrfm/v1/files?type=${fileType}` });
                setFiles(res || []);
            } catch (e) {
                console.error('Failed to load files:', e);
                showToast(nhrfmFileManager.i18n.loadError, 'error');
            } finally {
                setLoading(false);
            }
        }, [fileType]);

        useEffect(() => { loadFiles(); }, [loadFiles]);

        const loadFileContent = useCallback(async (path) => {
            setLoadingFile(true);
            try {
                const res = await apiFetch({ path: `nhrfm/v1/file?path=${encodeURIComponent(path)}&type=${fileType}` });
                setFileContent(res.content);
                setOriginalContent(res.content);
                setFileInfo(res);
            } catch (e) {
                console.error('Failed to load file:', e);
                showToast(e.message || nhrfmFileManager.i18n.loadError, 'error');
            } finally {
                setLoadingFile(false);
            }
        }, [fileType]);

        const handleSelectFile = useCallback((path) => { setSelectedFile(path); loadFileContent(path); }, [loadFileContent]);
        const handleSave = useCallback(async () => {
            if (!selectedFile || saving || isReadOnly) return;
            setSaving(true);
            try {
                await apiFetch({ path: 'nhrfm/v1/file', method: 'POST', data: { path: selectedFile, content: fileContent, type: fileType } });
                setOriginalContent(fileContent);
                showToast(nhrfmFileManager.i18n.saveSuccess, 'success');
            } catch (e) {
                console.error('Failed to save file:', e);
                showToast(e.message || nhrfmFileManager.i18n.saveError, 'error');
            } finally {
                setSaving(false);
            }
        }, [selectedFile, fileContent, fileType, saving, isReadOnly]);

        const handleDelete = useCallback(async (path, isFolder) => {
            if (deleting) return;
            setDeleting(true);
            try {
                await apiFetch({ path: `nhrfm/v1/file?path=${encodeURIComponent(path)}&type=${fileType}`, method: 'DELETE' });
                showToast(isFolder ? 'Folder deleted successfully' : 'File deleted successfully', 'success');
                if (selectedFile === path) { setSelectedFile(null); setFileContent(''); setFileInfo(null); }
                loadFiles();
            } catch (e) {
                console.error('Failed to delete:', e);
                showToast(e.message || 'Failed to delete item', 'error');
            } finally {
                setDeleting(false);
            }
        }, [fileType, deleting, selectedFile, loadFiles]);

        useEffect(() => {
            const handler = (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    if (!isReadOnly) handleSave();
                }
            };
            document.addEventListener('keydown', handler);
            return () => document.removeEventListener('keydown', handler);
        }, [handleSave, isReadOnly]);

        const handleFileTypeChange = useCallback((e) => {
            const newType = e.target.value;
            // Clear editor state first to prevent rendering with invalid props
            setSelectedFile(null);
            setFileContent('');
            setOriginalContent('');
            setFileInfo(null);
            setEditorErrors([]);
            // Then update file type - React will batch these updates
            setFileType(newType);
            setFiles([]); // Clear files to prevent state mismatch
        }, []);

        const fileTypeOptions = [
            { group: 'WordPress Content', options: [{ value: 'plugins', label: 'Plugins' }, { value: 'themes', label: 'Themes' }, { value: 'wp-content', label: 'WP Content' }] },
            { group: 'WordPress Root', options: [{ value: 'wp-config', label: 'wp-config.php' }] },
        ];

        return el('div', { className: 'nhrfm-main' },
            el('div', { className: 'nhrfm-sidebar' },
                el('div', { className: 'nhrfm-sidebar-header' },
                    el('h3', null, 'Files'),
                    el('select', {
                        className: 'nhrfm-type-select', value: fileType,
                        onChange: handleFileTypeChange
                    }, fileTypeOptions.map(g => el('optgroup', { key: g.group, label: g.group }, g.options.map(o => el('option', { key: o.value, value: o.value }, o.label)))))
                ),
                fileType !== 'wp-config' && el('div', { className: 'nhrfm-search' },
                    el('input', { type: 'text', placeholder: 'Search files...', value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) })
                ),
                el(FileTree, { files, selectedFile, onSelectFile: handleSelectFile, loading, searchQuery, onDeleteItem: handleDelete, fileType })
            ),
            el('div', { className: 'nhrfm-editor-panel' },
                selectedFile ? el('div', { key: 'editor-content' },
                    el('div', { className: 'nhrfm-editor-header' },
                        el('div', { className: 'nhrfm-file-info' },
                            el('span', { className: 'nhrfm-file-path' }, selectedFile),
                            isReadOnly && el('span', { className: 'nhrfm-file-readonly' }, Icons.lock, ' Read-only'),
                            fileContent !== originalContent && !isReadOnly && el('span', { className: 'nhrfm-file-modified' }, 'Modified')
                        ),
                        el('div', { className: 'nhrfm-editor-actions' },
                            !isReadOnly && el('button', {
                                className: 'nhrfm-btn nhrfm-btn-primary', onClick: handleSave,
                                disabled: fileContent === originalContent || saving,
                                type: 'button'
                            }, saving ? el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, el(Spinner), 'Saving...') : el('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, Icons.save, 'Save'))
                        )
                    ),
                    el('div', { className: 'nhrfm-editor-container' },
                        loadingFile ? el('div', { className: 'nhrfm-loading' }, el(Spinner), el('span', null, 'Loading file...')) :
                            fileInfo && el(CodeEditor, { 
                                key: `${fileType}-${selectedFile}`,
                                content: fileContent || '', 
                                onChange: setFileContent, 
                                readOnly: isReadOnly, 
                                fileExtension: fileInfo.extension || '', 
                                filename: selectedFile ? selectedFile.split('/').pop() : '', 
                                onErrorsChange: setEditorErrors 
                            })
                    ),
                    fileInfo && el('div', { className: 'nhrfm-status-bar' },
                        el('span', null, (fileInfo.extension || '').toUpperCase() + ' • ' + formatBytes(fileInfo.size || 0) + (isReadOnly ? ' • Read-only' : ''),
                            editorErrors.length > 0 && el('span', { className: 'nhrfm-error-count', key: 'errors' }, ` • ${editorErrors.length} error${editorErrors.length > 1 ? 's' : ''}`)
                        ),
                        el('span', null, `Last modified: ${new Date((fileInfo.modified || 0) * 1000).toLocaleString()}`)
                    )
                ) : el('div', { className: 'nhrfm-placeholder' }, Icons.code, el('p', null, 'Select a file to view and edit'))
            )
        );
    }

    document.addEventListener('DOMContentLoaded', () => {
        const container = document.getElementById('nhrfm-file-manager-app');
        if (container) {
            try {
                wp.element.render(el(ErrorBoundary, null, el(FileManagerApp)), container);
            } catch (e) {
                console.error('NHR File Manager: Failed to initialize', e);
                container.innerHTML = `<div style="padding: 20px; color: #d63638;"><p><strong>Error:</strong> Failed to initialize File Manager.</p><p>${e.message}</p></div>`;
            }
        }
    });
})();
