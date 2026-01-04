<?php

use Nhrfm\FileManager\Admin;
use Nhrfm\FileManager\Assets;

test('Admin class adds plugin action links', function () {
    $admin = new Admin();
    $links = ['<a href="old">Old Link</a>'];
    $file = 'nhrrob-file-manager/nhrrob-file-manager.php';

    // We need to mock NHRFM_FILE to match the file base name check in plugin_actions_links
    // Actually our Pest.php defines NHRFM_FILE as /tmp/plugin.php, let's adjust the test

    $links = $admin->plugin_actions_links($links, basename(NHRFM_FILE));

    expect($links)->toBeArray()
        ->and(count($links))->toBe(2)
        ->and($links[1])->toContain('tools.php?page=nhrfm-file-manager');
});

test('Assets class returns expected scripts and styles', function () {
    $assets = new Assets();

    $scripts = $assets->get_scripts();
    expect($scripts)->toBeArray()
        ->and($scripts)->toHaveKey('nhrfm-admin-script')
        ->and($scripts)->toHaveKey('nhrfm-monaco-editor-loader');

    $styles = $assets->get_styles();
    expect($styles)->toBeArray()
        ->and($styles)->toHaveKey('nhrfm-admin-style');
});

test('Assets class register_assets runs without errors', function () {
    $assets = new Assets();

    // This should run without errors as we mocked the WP functions in Pest.php
    $assets->register_assets();

    expect(true)->toBeTrue();
});
