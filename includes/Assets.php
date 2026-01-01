<?php

namespace Nhrfm\FileManager;

/**
 * Assets handler class
 */
class Assets extends App {
    /**
     * Class constructor
     */
    function __construct() {
        add_action( 'admin_enqueue_scripts', [ $this, 'register_assets' ] );
    }

    /**
     * All available scripts
     *
     * @return array
     */
    public function get_scripts() {
        $file_path = NHRFM_PATH . '/assets/js/admin.js';
        // Use filemtime for cache busting - updates when file changes
        $version = file_exists( $file_path ) ? filemtime( $file_path ) : NHRFM_VERSION;
        
        return [
            'nhrfm-admin-script' => [
                'src'     => NHRFM_ASSETS . '/js/admin.js',
                'version' => $version,
                'deps'    => [ 'wp-element', 'wp-components', 'wp-api-fetch', 'monaco-editor-loader' ]
            ],
        ];
    }

    /**
     * All available styles
     *
     * @return array
     */
    public function get_styles() {
        return [
            'nhrfm-admin-style' => [
                'src'     => NHRFM_ASSETS . '/css/admin.css',
                'version' => filemtime( NHRFM_PATH . '/assets/css/admin.css' )
            ],
        ];
    }

    /**
     * Register scripts and styles
     *
     * @return void
     */
    public function register_assets() {
        $scripts = $this->get_scripts();
        $styles  = $this->get_styles();

        foreach ( $scripts as $handle => $script ) {
            $deps = isset( $script['deps'] ) ? $script['deps'] : false;

            wp_register_script( $handle, $script['src'], $deps, $script['version'], true );
        }

        foreach ( $styles as $handle => $style ) {
            $deps = isset( $style['deps'] ) ? $style['deps'] : false;

            wp_register_style( $handle, $style['src'], $deps, $style['version'] );
        }

        // Register Monaco Editor from CDN
        wp_register_script( 
            'monaco-editor-loader', 
            'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js', 
            [], 
            '0.45.0', 
            true 
        );

        // Add inline script to configure Monaco before loader runs
        // This must run early, before any scripts are printed
        add_action( 'admin_head', function() {
            global $pagenow;
            // Check if we're on the file manager page
            if ( $pagenow === 'tools.php' && isset( $_GET['page'] ) && $_GET['page'] === 'nhrfm-file-manager' ) {
                ?>
                <script>
                // Configure Monaco Environment before loader runs
                (function() {
                    if (typeof window.MonacoEnvironment === 'undefined') {
                        // Disable web workers to avoid CORS issues
                        // Monaco will run in main thread (slightly slower but fully functional)
                        window.MonacoEnvironment = {
                            getWorkerUrl: function(moduleId, label) {
                                // Return empty string to indicate no worker URL
                                return '';
                            },
                            getWorker: function(moduleId, label) {
                                // Explicitly return undefined (not null) to disable workers
                                // This avoids CORS issues with CDN workers
                                // Returning undefined prevents the "Cannot read properties of null" error
                                return undefined;
                            }
                        };
                    }

                    // Prevent language bundle loading errors by setting empty language
                    if (window.require && window.require.config) {
                        window.require.config({
                            'vs/nls': {
                                availableLanguages: {
                                    '*': ''
                                }
                            }
                        });
                    }
                })();
                </script>
                <?php
            }
        }, 1 );

        wp_localize_script( 'nhrfm-admin-script', 'nhrfmFileManager', [
            'nonce'            => wp_create_nonce( 'wp_rest' ),
            'restUrl'          => rest_url( 'nhrfm/v1/' ),
            'ajaxUrl'          => admin_url('admin-ajax.php'),
            'pluginsDir'       => WP_PLUGIN_DIR,
            'themesDir'        => get_theme_root(),
            'wpContentDir'     => WP_CONTENT_DIR,
            'allowedExtensions' => $this->get_allowed_extensions(),
            'monacoPath'       => 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
            'i18n' => [
                'confirm'       => __( 'Are you sure?', 'nhrrob-file-manager' ),
                'error'         => __( 'Something went wrong', 'nhrrob-file-manager' ),
                'saveSuccess'   => __( 'File saved successfully!', 'nhrrob-file-manager' ),
                'saveError'     => __( 'Failed to save file', 'nhrrob-file-manager' ),
                'loadError'     => __( 'Failed to load file', 'nhrrob-file-manager' ),
            ],
        ] );
    }
}

