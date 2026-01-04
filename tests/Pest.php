<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind a different classes or traits.
|
*/

pest()->extend(Tests\TestCase::class)->in('Feature');

/*
|--------------------------------------------------------------------------
| WordPress Mocks
|--------------------------------------------------------------------------
|
| These dummy functions simulate the WordPress environment so we can test
| plugin logic without a full WP installation.
|
*/

if (!defined('ABSPATH')) {
    define('ABSPATH', sys_get_temp_dir() . '/');
}
if (!defined('WP_CONTENT_DIR')) {
    define('WP_CONTENT_DIR', sys_get_temp_dir() . '/wp-content');
}
if (!defined('WP_PLUGIN_DIR')) {
    define('WP_PLUGIN_DIR', sys_get_temp_dir() . '/wp-content/plugins');
}

function add_action($tag, $callback, $priority = 10, $accepted_args = 1)
{
}
function add_filter($tag, $callback, $priority = 10, $accepted_args = 1)
{
}
function register_rest_route($namespace, $route, $args = [], $override = false)
{
}
function current_user_can($capability, ...$args)
{
    return true;
}
function __($text, $domain = 'default')
{
    return $text;
}
function esc_html($text)
{
    return $text;
}
function wp_die($message = '', $title = '', $args = [])
{
    die($message);
}
function get_theme_root()
{
    return sys_get_temp_dir() . '/wp-content/themes';
}
function plugins_url($path = '', $plugin = '')
{
    return 'http://example.com/wp-content/plugins';
}
function wp_is_writable($path)
{
    return is_writable($path);
}
function wp_kses_allowed_html($context)
{
    return [];
}
function plugin_basename($file)
{
    return basename($file);
}
function admin_url($path = '')
{
    return 'http://example.com/wp-admin/' . $path;
}
function wp_register_script($handle, $src, $deps = [], $ver = false, $in_footer = false)
{
    return true;
}
function wp_register_style($handle, $src, $deps = [], $ver = false, $media = 'all')
{
    return true;
}
function wp_localize_script($handle, $object_name, $l10n)
{
    return true;
}
function wp_create_nonce($action = -1)
{
    return 'dummy_nonce';
}
function rest_url($url = '')
{
    return 'http://example.com/wp-json/' . $url;
}

if (!defined('NHRFM_VERSION'))
    define('NHRFM_VERSION', '1.0.0');
if (!defined('NHRFM_FILE'))
    define('NHRFM_FILE', '/tmp/plugin.php');
if (!defined('NHRFM_PATH'))
    define('NHRFM_PATH', sys_get_temp_dir() . '/plugin');
if (!defined('NHRFM_URL'))
    define('NHRFM_URL', 'http://example.com/wp-content/plugins/plugin');
if (!defined('NHRFM_ASSETS'))
    define('NHRFM_ASSETS', NHRFM_URL . '/assets');

// Ensure assets directory exists for filemtime calls
if (!is_dir(NHRFM_PATH . '/assets/js'))
    mkdir(NHRFM_PATH . '/assets/js', 0777, true);
if (!is_dir(NHRFM_PATH . '/assets/css'))
    mkdir(NHRFM_PATH . '/assets/css', 0777, true);
file_put_contents(NHRFM_PATH . '/assets/js/admin.js', '');
file_put_contents(NHRFM_PATH . '/assets/css/admin.css', '');

// Mock WP_REST_Request and WP_REST_Response classes
if (!class_exists('WP_REST_Request')) {
    class WP_REST_Request
    {
        protected $params = [];
        public function __construct($method = '', $route = '', $params = [])
        {
            $this->params = $params;
        }
        public function get_param($key)
        {
            return $this->params[$key] ?? null;
        }
        public function set_param($key, $value)
        {
            $this->params[$key] = $value;
        }
    }
}

if (!class_exists('WP_REST_Response')) {
    class WP_REST_Response
    {
        public $data;
        public $status;
        public function __construct($data = null, $status = 200)
        {
            $this->data = $data;
            $this->status = $status;
        }
    }
}

if (!class_exists('WP_Error')) {
    class WP_Error
    {
        public $code;
        public $message;
        public $data;
        public function __construct($code = '', $message = '', $data = '')
        {
            $this->code = $code;
            $this->message = $message;
            $this->data = $data;
        }
    }
}
