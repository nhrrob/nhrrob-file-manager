=== NHR File Manager | Browse and Edit Files ===
Contributors: nhrrob
Tags: file manager, edit files, browse files, wp-config.php editor, vs code editor
Requires at least: 6.0
Tested up to: 6.9
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

A modern, React-powered file manager (plugins, themes, wp-content, and wp-config.php) for WordPress administrators. Browse and edit plugin, theme, and wp-content files with a sleek, fast interface and VS Code-like code editor.

== Description ==

🚀 [GitHub Repository](https://github.com/nhrrob/nhrrob-file-manager) – Found a bug or have a feature request? Let us know!
💬 [Slack Community](https://join.slack.com/t/nhrrob/shared_invite/zt-2m3nyrl1f-eKv7wwJzsiALcg0nY6~e0Q) – Got questions or just want to chat? Come hang out with us on Slack!

NHR File Manager is a lightweight, modern file manager designed specifically for WordPress administrators. Built with React for a blazing-fast user experience.

`<?php echo 'Edit Your WordPress Files Like a Pro!'; ?>`

### ✨ Key Features

- **React-Powered UI** – Modern, fast, and responsive interface built with React
- **File Tree Navigation** – Browse through your plugins, themes, and wp-content directories with ease
- **Syntax Highlighting** – Edit PHP, JavaScript, CSS, and more with a beautiful code editor
- **Instant Search** – Quickly find files using the built-in search functionality
- **File Information** – View file size, extension, and last modified date
- **wp-config.php file editor** – Edit your wp-config.php file with a beautiful code editor
- **VS Code-like code editor** with features like auto-completion, code folding, and more

### 🔒 Security First

- Only administrators can access the file manager
- Protected core WordPress directories (wp-admin, wp-includes)
- Restricted to safe, editable file types
- Full WordPress REST API security with nonce verification

### � Supported File Types

PHP, JavaScript, JSX, TypeScript, CSS, SCSS, HTML, JSON, XML, TXT, Markdown, YAML, SQL, and more!

== Installation ==

1. Upload the `nhrrob-file-manager` plugin folder to your `/wp-content/plugins/` directory.
2. Activate the plugin through the 'Plugins' menu in WordPress.
3. Navigate to **Tools → File Manager** to start managing your files.

That's it! No configuration required.

== Frequently Asked Questions ==

= Who can access the file manager? =
Only users with the `manage_options` capability (typically administrators) can access the file manager.

= What file types can I edit? =
You can edit PHP, JS, JSX, TS, TSX, CSS, SCSS, LESS, HTML, JSON, XML, TXT, MD, YAML, SQL, and several other text-based file formats.

= Is it safe to edit plugin files directly? =
While the plugin provides safeguards, we recommend always keeping backups before editing any files. A syntax error in a PHP file could make your site inaccessible.

= Can I edit WordPress core files? =
No, for security reasons, wp-admin and wp-includes directories are protected and cannot be modified.

= Will it affect my site performance? =
No. The file manager only loads on its dedicated admin page and has zero impact on your frontend performance.

== Screenshots ==

1. Modern file tree with folder expansion
2. Code editor with syntax highlighting
3. Search functionality for quick file access
4. File information in the status bar

== Changelog ==

= 1.0.1 - 02/01/2026 =
- composer.json file added

= 1.0.0 - 02/01/2026 =
- Initial release
- React-powered file browser
- File tree navigation for plugins, themes, and wp-content
- Syntax highlighting for all popular file types
- VS Code-like code editor with features like auto-completion, code folding, and more
- File search functionality
- Status bar with file information
- Beautiful and modern UI

== Upgrade Notice ==

= 1.0.0 =
Initial release. Welcome to NHR File Manager!