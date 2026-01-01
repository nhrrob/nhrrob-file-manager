<?php

namespace Nhrfm\FileManager\Api;

use Nhrfm\FileManager\App;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

/**
 * REST API handler for file operations
 */
class FileApi extends App {

    /**
     * Namespace for the API
     */
    protected $namespace = 'nhrfm/v1';

    /**
     * Register REST API routes
     *
     * @return void
     */
    public function register_routes() {
        register_rest_route( $this->namespace, '/files', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'get_files' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        register_rest_route( $this->namespace, '/file', [
            'methods'             => 'GET',
            'callback'            => [ $this, 'read_file' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        register_rest_route( $this->namespace, '/file', [
            'methods'             => 'POST',
            'callback'            => [ $this, 'save_file' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);

        register_rest_route( $this->namespace, '/file', [
            'methods'             => 'DELETE',
            'callback'            => [ $this, 'delete_file' ],
            'permission_callback' => [ $this, 'check_permission' ],
        ]);
    }

    /**
     * Check if user has permission
     *
     * @return bool
     */
    public function check_permission() {
        return current_user_can( 'manage_options' );
    }

    /**
     * Get file tree structure
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response
     */
    public function get_files( WP_REST_Request $request ) {
        $base_path = $request->get_param( 'path' );
        $type = $request->get_param( 'type' ) ?? 'plugins';

        // Special handling for wp-config.php
        if ( $type === 'wp-config' ) {
            return $this->get_wpconfig_file();
        }

        // Determine base directory
        switch( $type ) {
            case 'themes':
                $base_dir = get_theme_root();
                break;
            case 'wp-content':
                $base_dir = WP_CONTENT_DIR;
                break;
            case 'plugins':
            default:
                $base_dir = WP_PLUGIN_DIR;
                break;
        }

        if ( $base_path ) {
            $full_path = $base_dir . '/' . ltrim( $base_path, '/' );
        } else {
            $full_path = $base_dir;
        }

        // Security check - ensure path is within allowed directories
        $real_path = realpath( $full_path );
        $real_base = realpath( $base_dir );

        if ( $real_path === false || strpos( $real_path, $real_base ) !== 0 ) {
            return new WP_Error( 'invalid_path', __( 'Invalid path', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        $files = $this->scan_directory( $real_path, $real_base );

        return new WP_REST_Response( $files, 200 );
    }

    /**
     * Get wp-config.php file info
     *
     * @return WP_REST_Response
     */
    private function get_wpconfig_file() {
        $wpconfig_path = ABSPATH . 'wp-config.php';

        if ( ! file_exists( $wpconfig_path ) ) {
            return new WP_REST_Response( [], 200 );
        }

        return new WP_REST_Response([
            [
                'id'        => 'wp-config.php',
                'name'      => 'wp-config.php',
                'isFolder'  => false,
                'extension' => 'php',
                'size'      => filesize( $wpconfig_path ),
            ]
        ], 200 );
    }

    /**
     * Scan directory and return file tree structure
     *
     * @param string $path
     * @param string $base_path
     * @return array
     */
    private function scan_directory( $path, $base_path ) {
        $items = [];

        if ( ! is_dir( $path ) || ! is_readable( $path ) ) {
            return $items;
        }

        $entries = scandir( $path );

        foreach ( $entries as $entry ) {
            if ( $entry === '.' || $entry === '..' ) {
                continue;
            }

            $full_path = $path . '/' . $entry;
            $relative_path = str_replace( $base_path . '/', '', $full_path );
            $is_dir = is_dir( $full_path );

            $item = [
                'id'       => $relative_path,
                'name'     => $entry,
                'isFolder' => $is_dir,
            ];

            if ( $is_dir ) {
                $item['children'] = $this->scan_directory( $full_path, $base_path );
            } else {
                $item['extension'] = pathinfo( $entry, PATHINFO_EXTENSION );
                $item['size'] = filesize( $full_path );
            }

            $items[] = $item;
        }

        // Sort: folders first, then files alphabetically
        usort( $items, function( $a, $b ) {
            if ( $a['isFolder'] && ! $b['isFolder'] ) return -1;
            if ( ! $a['isFolder'] && $b['isFolder'] ) return 1;
            return strcasecmp( $a['name'], $b['name'] );
        });

        return $items;
    }

    /**
     * Read file content
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function read_file( WP_REST_Request $request ) {
        $file_path = $request->get_param( 'path' );
        $type = $request->get_param( 'type' ) ?? 'plugins';

        if ( empty( $file_path ) ) {
            return new WP_Error( 'missing_path', __( 'File path is required', 'nhrrob-file-manager' ), [ 'status' => 400 ] );
        }

        // Special handling for wp-config.php
        if ( $type === 'wp-config' ) {
            return $this->read_wpconfig_file();
        }

        // Determine base directory
        switch( $type ) {
            case 'themes':
                $base_dir = get_theme_root();
                break;
            case 'wp-content':
                $base_dir = WP_CONTENT_DIR;
                break;
            case 'plugins':
            default:
                $base_dir = WP_PLUGIN_DIR;
                break;
        }

        $full_path = $base_dir . '/' . ltrim( $file_path, '/' );
        $real_path = realpath( $full_path );
        $real_base = realpath( $base_dir );

        // Security check
        if ( $real_path === false || strpos( $real_path, $real_base ) !== 0 ) {
            return new WP_Error( 'invalid_path', __( 'Invalid file path', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        if ( ! is_file( $real_path ) || ! is_readable( $real_path ) ) {
            return new WP_Error( 'file_not_found', __( 'File not found or not readable', 'nhrrob-file-manager' ), [ 'status' => 404 ] );
        }

        // Check file extension
        $extension = strtolower( pathinfo( $real_path, PATHINFO_EXTENSION ) );
        $viewable_extensions = $this->get_viewable_extensions();

        if ( ! in_array( $extension, $viewable_extensions ) ) {
            return new WP_Error( 'invalid_extension', __( 'File type not allowed for viewing', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        // Determine if file is read-only
        $is_readonly = $this->is_readonly_extension( $extension );

        $content = file_get_contents( $real_path );

        if ( $content === false ) {
            return new WP_Error( 'read_error', __( 'Failed to read file', 'nhrrob-file-manager' ), [ 'status' => 500 ] );
        }

        return new WP_REST_Response([
            'content'   => $content,
            'path'      => $file_path,
            'name'      => basename( $real_path ),
            'extension' => $extension,
            'size'      => filesize( $real_path ),
            'modified'  => filemtime( $real_path ),
            'readOnly'  => $is_readonly,
        ], 200 );
    }

    /**
     * Read wp-config.php file content
     *
     * @return WP_REST_Response|WP_Error
     */
    private function read_wpconfig_file() {
        $wpconfig_path = ABSPATH . 'wp-config.php';

        if ( ! file_exists( $wpconfig_path ) || ! is_readable( $wpconfig_path ) ) {
            return new WP_Error( 'file_not_found', __( 'wp-config.php not found or not readable', 'nhrrob-file-manager' ), [ 'status' => 404 ] );
        }

        $content = file_get_contents( $wpconfig_path );

        if ( $content === false ) {
            return new WP_Error( 'read_error', __( 'Failed to read wp-config.php', 'nhrrob-file-manager' ), [ 'status' => 500 ] );
        }

        return new WP_REST_Response([
            'content'   => $content,
            'path'      => 'wp-config.php',
            'name'      => 'wp-config.php',
            'extension' => 'php',
            'size'      => filesize( $wpconfig_path ),
            'modified'  => filemtime( $wpconfig_path ),
        ], 200 );
    }

    /**
     * Save wp-config.php file content
     *
     * @param string $content
     * @return WP_REST_Response|WP_Error
     */
    private function save_wpconfig_file( $content ) {
        if ( $content === null ) {
            return new WP_Error( 'missing_content', __( 'File content is required', 'nhrrob-file-manager' ), [ 'status' => 400 ] );
        }

        $wpconfig_path = ABSPATH . 'wp-config.php';

        if ( ! file_exists( $wpconfig_path ) || ! is_writable( $wpconfig_path ) ) {
            return new WP_Error( 'file_not_writable', __( 'wp-config.php not found or not writable', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        $result = file_put_contents( $wpconfig_path, $content );

        if ( $result === false ) {
            return new WP_Error( 'write_error', __( 'Failed to save wp-config.php', 'nhrrob-file-manager' ), [ 'status' => 500 ] );
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => __( 'wp-config.php saved successfully', 'nhrrob-file-manager' ),
            'path'    => 'wp-config.php',
            'size'    => $result,
        ], 200 );
    }

    /**
     * Save file content
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function save_file( WP_REST_Request $request ) {
        $file_path = $request->get_param( 'path' );
        $content = $request->get_param( 'content' );
        $type = $request->get_param( 'type' ) ?? 'plugins';

        if ( empty( $file_path ) ) {
            return new WP_Error( 'missing_path', __( 'File path is required', 'nhrrob-file-manager' ), [ 'status' => 400 ] );
        }

        // Special handling for wp-config.php
        if ( $type === 'wp-config' ) {
            return $this->save_wpconfig_file( $content );
        }

        if ( $content === null ) {
            return new WP_Error( 'missing_content', __( 'File content is required', 'nhrrob-file-manager' ), [ 'status' => 400 ] );
        }

        // Determine base directory
        switch( $type ) {
            case 'themes':
                $base_dir = get_theme_root();
                break;
            case 'wp-content':
                $base_dir = WP_CONTENT_DIR;
                break;
            case 'plugins':
            default:
                $base_dir = WP_PLUGIN_DIR;
                break;
        }

        $full_path = $base_dir . '/' . ltrim( $file_path, '/' );
        $real_path = realpath( $full_path );
        $real_base = realpath( $base_dir );

        // Security check
        if ( $real_path === false || strpos( $real_path, $real_base ) !== 0 ) {
            return new WP_Error( 'invalid_path', __( 'Invalid file path', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        if ( ! is_file( $real_path ) || ! is_writable( $real_path ) ) {
            return new WP_Error( 'file_not_writable', __( 'File not found or not writable', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        // Check file extension
        $extension = strtolower( pathinfo( $real_path, PATHINFO_EXTENSION ) );

        // Prevent saving read-only file types
        if ( $this->is_readonly_extension( $extension ) ) {
            return new WP_Error( 'read_only', __( 'This file type is read-only', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        $allowed_extensions = $this->get_allowed_extensions();

        if ( ! in_array( $extension, $allowed_extensions ) ) {
            return new WP_Error( 'invalid_extension', __( 'File type not allowed for editing', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        $result = file_put_contents( $real_path, $content );

        if ( $result === false ) {
            return new WP_Error( 'write_error', __( 'Failed to save file', 'nhrrob-file-manager' ), [ 'status' => 500 ] );
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => __( 'File saved successfully', 'nhrrob-file-manager' ),
            'path'    => $file_path,
            'size'    => $result,
        ], 200 );
    }

    /**
     * Delete file or folder
     *
     * @param WP_REST_Request $request
     * @return WP_REST_Response|WP_Error
     */
    public function delete_file( WP_REST_Request $request ) {
        $file_path = $request->get_param( 'path' );
        $type = $request->get_param( 'type' ) ?? 'plugins';

        if ( empty( $file_path ) ) {
            return new WP_Error( 'missing_path', __( 'File path is required', 'nhrrob-file-manager' ), [ 'status' => 400 ] );
        }

        // Prevent deleting wp-config.php
        if ( $type === 'wp-config' ) {
            return new WP_Error( 'protected_file', __( 'Cannot delete wp-config.php', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        // Determine base directory
        switch( $type ) {
            case 'themes':
                $base_dir = get_theme_root();
                break;
            case 'wp-content':
                $base_dir = WP_CONTENT_DIR;
                break;
            case 'plugins':
            default:
                $base_dir = WP_PLUGIN_DIR;
                break;
        }

        $full_path = $base_dir . '/' . ltrim( $file_path, '/' );
        $real_path = realpath( $full_path );
        $real_base = realpath( $base_dir );

        // Security check - ensure path is within allowed directories
        if ( $real_path === false || strpos( $real_path, $real_base ) !== 0 ) {
            return new WP_Error( 'invalid_path', __( 'Invalid file path', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        // Prevent deleting the base directory itself
        if ( $real_path === $real_base ) {
            return new WP_Error( 'protected_path', __( 'Cannot delete root directory', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        // Check if it's a file or directory
        $is_dir = is_dir( $real_path );
        $item_name = basename( $real_path );

        // Protected file patterns that cannot be deleted
        $protected_patterns = [
            'wp-config.php',
            '.htaccess',
            'index.php', // Only root index.php files
        ];

        // Check if file is in protected list (for root-level critical files)
        if ( in_array( $item_name, $protected_patterns ) && dirname( $real_path ) === $real_base ) {
            return new WP_Error( 'protected_file', __( 'This file is protected and cannot be deleted', 'nhrrob-file-manager' ), [ 'status' => 403 ] );
        }

        if ( $is_dir ) {
            // Delete directory recursively
            $result = $this->delete_directory_recursive( $real_path );
        } else {
            // Delete single file
            $result = unlink( $real_path );
        }

        if ( ! $result ) {
            return new WP_Error( 'delete_error', __( 'Failed to delete item', 'nhrrob-file-manager' ), [ 'status' => 500 ] );
        }

        return new WP_REST_Response([
            'success' => true,
            'message' => $is_dir
                ? __( 'Folder deleted successfully', 'nhrrob-file-manager' )
                : __( 'File deleted successfully', 'nhrrob-file-manager' ),
            'path'    => $file_path,
        ], 200 );
    }

    /**
     * Recursively delete a directory
     *
     * @param string $dir
     * @return bool
     */
    private function delete_directory_recursive( $dir ) {
        if ( ! is_dir( $dir ) ) {
            return false;
        }

        $items = array_diff( scandir( $dir ), [ '.', '..' ] );

        foreach ( $items as $item ) {
            $path = $dir . '/' . $item;

            if ( is_dir( $path ) ) {
                $this->delete_directory_recursive( $path );
            } else {
                unlink( $path );
            }
        }

        return rmdir( $dir );
    }
}

