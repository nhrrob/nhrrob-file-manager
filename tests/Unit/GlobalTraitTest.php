<?php

use Nhrfm\FileManager\Traits\GlobalTrait;

// Create a dummy class to test the trait
class GlobalTraitTestClass
{
    use GlobalTrait;
}

beforeEach(function () {
    $this->trait = new GlobalTraitTestClass();
});

test('it returns expected allowed extensions', function () {
    $extensions = $this->trait->get_allowed_extensions();

    expect($extensions)->toBeArray()
        ->and($extensions)->toContain('php', 'js', 'css', 'html', 'json');
});

test('it returns expected read-only extensions', function () {
    $extensions = $this->trait->get_readonly_extensions();

    expect($extensions)->toBeArray()
        ->and($extensions)->toContain('log');
});

test('it correctly identifies read-only extensions', function () {
    expect($this->trait->is_readonly_extension('log'))->toBeTrue()
        ->and($this->trait->is_readonly_extension('php'))->toBeFalse();
});

test('it returns expected viewable extensions', function () {
    $extensions = $this->trait->get_viewable_extensions();

    expect($extensions)->toBeArray()
        ->and($extensions)->toContain('php', 'log');
});

test('it returns expected protected directories', function () {
    $dirs = $this->trait->get_protected_directories();

    expect($dirs)->toBeArray()
        ->and($dirs)->toContain('wp-admin', 'wp-includes');
});
