<?php

namespace Nhrfm\FileManager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Assets handler class
 */
class Assets extends App
{
    /**
     * Class constructor
     */
    function __construct()
    {
        add_action('admin_enqueue_scripts', [$this, 'register_assets']);
    }

    /**
     * All available scripts
     *
     * @return array
     */
    public function get_scripts()
    {
        return [
            'nhrfm-admin-script' => [
                'src' => NHRFM_ASSETS . '/js/admin.js',
                'version' => filemtime(NHRFM_PATH . '/assets/js/admin.js'),
                'deps' => ['wp-element', 'wp-components', 'wp-api-fetch', 'nhrfm-monaco-editor-loader']
            ],
            'nhrfm-monaco-editor-loader' => [
                'src' => 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js',
                'version' => '0.45.0',
            ],
        ];
    }

    /**
     * All available styles
     *
     * @return array
     */
    public function get_styles()
    {
        return [
            'nhrfm-admin-style' => [
                'src' => NHRFM_ASSETS . '/css/admin.css',
                'version' => filemtime(NHRFM_PATH . '/assets/css/admin.css')
            ],
        ];
    }

    /**
     * Register scripts and styles
     *
     * @return void
     */
    public function register_assets()
    {
        $scripts = $this->get_scripts();
        $styles = $this->get_styles();

        foreach ($scripts as $handle => $script) {
            $deps = isset($script['deps']) ? $script['deps'] : false;

            wp_register_script($handle, $script['src'], $deps, $script['version'], true);
        }

        foreach ($styles as $handle => $style) {
            $deps = isset($style['deps']) ? $style['deps'] : false;

            wp_register_style($handle, $style['src'], $deps, $style['version']);
        }

        wp_localize_script('nhrfm-admin-script', 'nhrfmFileManager', [
            'nonce' => wp_create_nonce('wp_rest'),
            'restUrl' => rest_url('nhrfm/v1/'),
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'pluginsDir' => WP_PLUGIN_DIR,
            'themesDir' => get_theme_root(),
            'wpContentDir' => WP_CONTENT_DIR,
            'adminUrl' => admin_url(),
            'allowedExtensions' => $this->get_allowed_extensions(),
            'monacoPath' => 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
            'i18n' => [
                'confirm' => __('Are you sure?', 'nhrrob-file-manager'),
                'error' => __('Something went wrong', 'nhrrob-file-manager'),
                'saveSuccess' => __('File saved successfully!', 'nhrrob-file-manager'),
                'saveError' => __('Failed to save file', 'nhrrob-file-manager'),
                'loadError' => __('Failed to load file', 'nhrrob-file-manager'),
            ],
        ]);
    }
}

