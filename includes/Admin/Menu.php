<?php

namespace Nhrfm\FileManager\Admin;

use Nhrfm\FileManager\App;

/**
 * The Menu handler class
 */
class Menu extends App
{
    /**
     * Initialize the class
     */
    function __construct()
    {
        add_action('admin_menu', [$this, 'admin_menu']);
    }

    /**
     * Register admin menu
     *
     * @return void
     */
    public function admin_menu()
    {
        $parent_slug = 'nhrfm-file-manager';
        $capability = apply_filters('nhrfm-file-manager/menu/capability', 'manage_options');

        $hook = add_submenu_page(
            'tools.php',
            __('File Manager', 'nhrrob-file-manager'),
            __('File Manager', 'nhrrob-file-manager'),
            $capability,
            $parent_slug,
            [$this, 'file_manager_page']
        );

        add_action('admin_head-' . $hook, [$this, 'enqueue_assets']);
    }

    /**
     * Enqueue assets for the page
     *
     * @return void
     */
    public function enqueue_assets()
    {
        wp_enqueue_style('nhrfm-admin-style');
        wp_enqueue_script('nhrfm-monaco-editor-loader');
        wp_enqueue_script('nhrfm-admin-script');
    }

    /**
     * Render the file manager page
     *
     * @return void
     */
    public function file_manager_page()
    {
        include NHRFM_PATH . '/includes/views/admin/file-manager/index.php';
    }
}

