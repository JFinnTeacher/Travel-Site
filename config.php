<?php
// Site settings shared by all pages.

// Data lives outside the code folder (see CLAUDE.md "Keep data outside the code").
// On YunoHost the code is in /var/www/my_webapp/www, so this is /var/www/my_webapp/data.
define('DATA_DIR', dirname(__DIR__) . '/data');

// The 32 counties, as ids matching assets/counties.geojson
define('COUNTIES', [
    'antrim', 'armagh', 'carlow', 'cavan', 'clare', 'cork', 'donegal', 'down',
    'dublin', 'fermanagh', 'galway', 'kerry', 'kildare', 'kilkenny', 'laois', 'leitrim',
    'limerick', 'derry', 'longford', 'louth', 'mayo', 'meath', 'monaghan', 'offaly',
    'roscommon', 'sligo', 'tipperary', 'tyrone', 'waterford', 'westmeath', 'wexford', 'wicklow',
]);
