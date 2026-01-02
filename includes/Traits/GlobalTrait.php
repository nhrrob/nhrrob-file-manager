<?php

namespace Nhrfm\FileManager\Traits;

trait GlobalTrait
{
    public function dd($var)
    {
        echo "<pre>";
        // phpcs:ignore:WordPress.PHP.DevelopmentFunctions.error_log_print_r
        print_r($var);
        wp_die('ok');
    }

    public function allowed_html(){
        $allowed_tags = wp_kses_allowed_html('post');

        $allowed_tags_extra = array(
            'a' => array(
                'href'   => 1,
                'class'  => 1,
                'id'     => 1,
                'target' => 1,
            ),
            'svg' => array(
                'class'           => 1,
                'xmlns'           => 1,
                'aria-hidden'     => 1,
                'aria-labelledby' => 1,
                'fill'            => 1,
                'role'            => 1,
                'width'           => 1,
                'height'          => 1,
                'viewbox'         => 1,
                'stroke-width'    => 1,
                'stroke'          => 1,
            ),
            'path' => array(
                'stroke-linecap'  => 1,
                'stroke-linejoin' => 1,
                'd'               => 1,
                'fill'            => 1,
            ),
        );

        $allowed_tags = array_merge( $allowed_tags, $allowed_tags_extra );

        return $allowed_tags;
    }

    /**
     * Get allowed file extensions for editing
     *
     * @return array
     */
    public function get_allowed_extensions() {
        return [
            'php', 'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'less',
            'html', 'htm', 'json', 'xml', 'txt', 'md', 'yaml', 'yml',
            'sql', 'htaccess', 'ini', 'conf', 'pot', 'po', 'twig'
        ];
    }

    /**
     * Get read-only file extensions (can view but not edit)
     *
     * @return array
     */
    public function get_readonly_extensions() {
        return [
            'log'
        ];
    }

    /**
     * Get all viewable extensions (editable + read-only)
     *
     * @return array
     */
    public function get_viewable_extensions() {
        return array_merge(
            $this->get_allowed_extensions(),
            $this->get_readonly_extensions()
        );
    }

    /**
     * Check if file extension is read-only
     *
     * @param string $extension
     * @return bool
     */
    public function is_readonly_extension( $extension ) {
        return in_array( strtolower( $extension ), $this->get_readonly_extensions() );
    }

    /**
     * Get protected directories that cannot be modified
     *
     * @return array
     */
    public function get_protected_directories() {
        return [
            'wp-admin',
            'wp-includes',
        ];
    }
}

