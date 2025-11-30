# NHR File Manager

A modern, React-powered file manager for WordPress administrators. Browse and edit plugin, theme, and wp-content files with a sleek, fast interface.

## Features

- **React-Powered UI** – Modern, fast, and responsive interface built with React
- **File Tree Navigation** – Browse through your plugins, themes, and wp-content directories
- **Built-in Code Editor** – Edit files with tab support and syntax highlighting
- **Instant Search** – Quickly find files using the built-in search functionality
- **Real-time Save** – Save files with Ctrl+S (Cmd+S on Mac) keyboard shortcut
- **Security First** – Only administrators can access, with REST API nonce verification

## Installation

1. Upload the plugin to `/wp-content/plugins/nhrrob-file-manager/`
2. Run `composer install` to generate autoload files
3. Activate the plugin through the WordPress admin
4. Navigate to **Tools → File Manager**

## Development

```bash
# Install dependencies
composer install

# Build for production
composer build
```

## License

GPL-2.0-or-later