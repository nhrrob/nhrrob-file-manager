<?php
/**
 * Plugin Name: NHR File Manager | Browse and Edit Files
 * Plugin URI: http://wordpress.org/plugins/nhrrob-file-manager/
 * Description: Browse and edit WordPress files with ease. Modern React-powered file manager for WordPress administrators.
 * Author: Nazmul Hasan Robin
 * Author URI: https://profiles.wordpress.org/nhrrob/
 * Version: 1.0.2
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Text Domain: nhrrob-file-manager
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 */

if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly

require_once __DIR__ . '/vendor/autoload.php';

/**
 * The main plugin class
 */
final class Nhrfm_File_Manager {

    /**
     * Plugin version
     *
     * @var string
     */
    const NHRFM_VERSION = '1.0.2';

    /**
     * Class constructor
     */
    private function __construct() {
        $this->define_constants();

        add_action( 'plugins_loaded', [ $this, 'init_plugin' ] );
    }

    /**
     * Initialize a singleton instance
     *
     * @return \Nhrfm_File_Manager
     */
    public static function init() {
        static $instance = false;

        if ( ! $instance ) {
            $instance = new self();
        }

        return $instance;
    }

    /**
     * Define the required plugin constants
     *
     * @return void
     */
    public function define_constants() {
        define( 'NHRFM_VERSION', self::NHRFM_VERSION );
        define( 'NHRFM_FILE', __FILE__ );
        define( 'NHRFM_PATH', __DIR__ );
        define( 'NHRFM_URL', plugins_url( '', NHRFM_FILE ) );
        define( 'NHRFM_ASSETS', NHRFM_URL . '/assets' );
    }

    /**
     * Initialize the plugin
     *
     * @return void
     */
    public function init_plugin() {

        new Nhrfm\FileManager\Assets();

        if ( is_admin() ) {
            new Nhrfm\FileManager\Admin();
        }

        // Register REST API endpoints
        add_action( 'rest_api_init', [ $this, 'register_rest_routes' ] );
    }

    /**
     * Register REST API routes
     *
     * @return void
     */
    public function register_rest_routes() {
        $api = new Nhrfm\FileManager\Api\FileApi();
        $api->register_routes();
    }
}

/**
 * Initializes the main plugin
 *
 * @return \Nhrfm_File_Manager
 */
function nhrfm_file_manager() {
    return Nhrfm_File_Manager::init();
}

// Call the plugin
nhrfm_file_manager();
