<?php if (!defined('ABSPATH')) exit; // Exit if accessed directly 
?>

<div class="wrap nhrfm-wrap">
    <!-- Page Title  -->
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <!-- React App Root -->
    <div id="nhrfm-file-manager-app" class="nhrfm-app-container">
        <div class="nhrfm-loading">
            <span class="spinner is-active"></span>
            <span><?php esc_html_e('Loading File Manager...', 'nhrrob-file-manager'); ?></span>
        </div>
    </div>
</div>

