<?php

use Nhrfm\FileManager\Api\FileApi;

beforeEach(function () {
    // Ensure directories exist from Pest.php constants
    if (!is_dir(WP_PLUGIN_DIR)) {
        mkdir(WP_PLUGIN_DIR, 0777, true);
    }

    // Create some dummy files in the plugin dir
    file_put_contents(WP_PLUGIN_DIR . '/test.php', '<?php echo "hello";');
    if (!is_dir(WP_PLUGIN_DIR . '/subdir')) {
        @mkdir(WP_PLUGIN_DIR . '/subdir');
    }
    file_put_contents(WP_PLUGIN_DIR . '/subdir/inner.php', '<?php echo "inner";');

    $this->api = new FileApi();
});

afterEach(function () {
    // Cleanup files but keep directories for other tests
    if (file_exists(WP_PLUGIN_DIR . '/test.php'))
        @unlink(WP_PLUGIN_DIR . '/test.php');
    if (file_exists(WP_PLUGIN_DIR . '/subdir/inner.php'))
        @unlink(WP_PLUGIN_DIR . '/subdir/inner.php');
    @rmdir(WP_PLUGIN_DIR . '/subdir');
});

test('it correctly scans a directory', function () {
    $request = new WP_REST_Request('GET', '/files', ['type' => 'plugins']);
    $response = $this->api->get_files($request);

    expect($response->status)->toBe(200)
        ->and($response->data)->toBeArray()
        ->and(count($response->data))->toBe(2); // test.php and subdir

    $names = array_column($response->data, 'name');
    expect($names)->toContain('test.php', 'subdir');
});

test('it prevents access outside base directory', function () {
    $request = new WP_REST_Request('GET', '/files', ['type' => 'plugins', 'path' => '../../']);
    $response = $this->api->get_files($request);

    expect($response)->toBeInstanceOf(WP_Error::class)
        ->and($response->code)->toBe('invalid_path');
});

test('it reads file content correctly', function () {
    $request = new WP_REST_Request('GET', '/file', ['type' => 'plugins', 'path' => 'test.php']);
    $response = $this->api->read_file($request);

    expect($response->status)->toBe(200)
        ->and($response->data['content'])->toBe('<?php echo "hello";')
        ->and($response->data['name'])->toBe('test.php');
});

test('it saves file content correctly', function () {
    $request = new WP_REST_Request('POST', '/file', [
        'type' => 'plugins',
        'path' => 'test.php',
        'content' => '<?php echo "updated";'
    ]);
    $response = $this->api->save_file($request);

    expect($response->status)->toBe(200)
        ->and($response->data['success'])->toBeTrue();

    expect(file_get_contents(WP_PLUGIN_DIR . '/test.php'))->toBe('<?php echo "updated";');
});

test('it deletes a file correctly', function () {
    // Mock wp_delete_file
    if (!function_exists('wp_delete_file')) {
        function wp_delete_file($file)
        {
            return unlink($file);
        }
    }

    $request = new WP_REST_Request('DELETE', '/file', [
        'type' => 'plugins',
        'path' => 'test.php'
    ]);
    $response = $this->api->delete_file($request);

    expect($response->status)->toBe(200)
        ->and($response->data['success'])->toBeTrue();

    expect(file_exists(WP_PLUGIN_DIR . '/test.php'))->toBeFalse();
});

test('it validates PHP syntax', function () {
    // Test valid code
    $request = new WP_REST_Request('POST', '/validate-php', [
        'code' => '<?php echo "hello";'
    ]);
    $response = $this->api->validate_php($request);
    expect($response->data['valid'])->toBeTrue();

    // Test invalid code (mismatched brace)
    $request = new WP_REST_Request('POST', '/validate-php', [
        'code' => '<?php if(true) {'
    ]);
    $response = $this->api->validate_php($request);
    expect($response->data['valid'])->toBeFalse();
});

test('it scans wp-content directory', function () {
    if (!is_dir(WP_CONTENT_DIR))
        mkdir(WP_CONTENT_DIR, 0777, true);
    if (!is_dir(WP_CONTENT_DIR . '/uploads'))
        mkdir(WP_CONTENT_DIR . '/uploads');

    $request = new WP_REST_Request('GET', '/files', ['type' => 'wp-content']);
    $response = $this->api->get_files($request);

    expect($response->status)->toBe(200)
        ->and(array_column($response->data, 'name'))->toContain('uploads');
});

test('it handles wp-config.php specifically', function () {
    $wpConfigFile = ABSPATH . 'wp-config.php';
    file_put_contents($wpConfigFile, '<?php define("DB_NAME", "test");');

    // Test getting files for wp-config type
    $request = new WP_REST_Request('GET', '/files', ['type' => 'wp-config']);
    $response = $this->api->get_files($request);
    expect($response->status)->toBe(200)
        ->and($response->data[0]['name'])->toBe('wp-config.php');

    // Test reading wp-config
    $request = new WP_REST_Request('GET', '/file', ['type' => 'wp-config', 'path' => 'wp-config.php']);
    $response = $this->api->read_file($request);
    expect($response->status)->toBe(200)
        ->and($response->data['content'])->toContain('DB_NAME');

    unlink($wpConfigFile);
});

test('it enforces read-only for debug.log', function () {
    $logFile = WP_PLUGIN_DIR . '/debug.log';
    file_put_contents($logFile, 'log content');

    // Attempt to save to debug.log
    $request = new WP_REST_Request('POST', '/file', [
        'type' => 'plugins',
        'path' => 'debug.log',
        'content' => 'new content'
    ]);

    // In our App/Traits, log is read-only
    $response = $this->api->save_file($request);

    expect($response)->toBeInstanceOf(WP_Error::class)
        ->and($response->code)->toBe('read_only');

    expect(file_get_contents($logFile))->toBe('log content');
    unlink($logFile);
});

test('it scans themes directory', function () {
    $themeDir = sys_get_temp_dir() . '/wp-content/themes';
    if (!is_dir($themeDir))
        mkdir($themeDir, 0777, true);

    // In Pest.php get_theme_root() points here
    if (!is_dir($themeDir . '/my-theme'))
        mkdir($themeDir . '/my-theme');
    file_put_contents($themeDir . '/my-theme/style.css', '/* Theme */');

    $request = new WP_REST_Request('GET', '/files', ['type' => 'themes']);
    $response = $this->api->get_files($request);

    expect($response->status)->toBe(200)
        ->and(array_column($response->data, 'name'))->toContain('my-theme');
});
