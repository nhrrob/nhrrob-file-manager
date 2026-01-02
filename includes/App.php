<?php

namespace Nhrfm\FileManager;

use Nhrfm\FileManager\Traits\GlobalTrait;

/**
 * Base App Class
 */
class App {
    
    use GlobalTrait;
    
    protected $page_slug;
    
    public function __construct()
    {
        $this->page_slug = 'nhrfm-file-manager';
    }
}

