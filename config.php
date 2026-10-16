<?php
// Site settings shared by all pages.

// Data lives outside the code folder (see CLAUDE.md "Keep data outside the code").
// On YunoHost the code is in /var/www/my_webapp/www, so this is /var/www/my_webapp/data.
define('DATA_DIR', dirname(__DIR__) . '/data');
