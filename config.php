<?php
// Site settings shared by all pages.

// Data lives outside the code folder (see CLAUDE.md "Keep data outside the code").
// On YunoHost the code is in /var/www/my_webapp/www, so this is /var/www/my_webapp/data.
define('DATA_DIR', dirname(__DIR__) . '/data');

// The two people planning trips: id => default name. The names shown on the site are
// typed in on the admin page and saved in DATA_DIR/settings.json (see people_names()).
define('PEOPLE', [
    'user1' => 'User 1',
    'user2' => 'User 2',
]);

// Saved site settings, e.g. { "people": { "user1": "Jim" } }. Empty if none saved yet.
function load_settings(): array
{
    $settings = json_decode(@file_get_contents(DATA_DIR . '/settings.json') ?: '', true);
    return is_array($settings) ? $settings : [];
}

// Default colours: one base colour for the county shading (see assets/colours.js) and one per pin owner.
// Changed on the admin page and saved in DATA_DIR/settings.json under "colours".
define('DEFAULT_COLOURS', [
    'map' => '#1e6fd9',
    'pins' => ['shared' => '#0d3d80', 'user1' => '#7e57c2', 'user2' => '#d81b60'],
]);

function is_colour($value): bool
{
    return is_string($value) && preg_match('/^#[0-9a-f]{6}$/i', $value) === 1;
}

// Colours to use: the saved ones, or the defaults for any not set
function site_colours(): array
{
    $saved = load_settings()['colours'] ?? [];
    $colours = DEFAULT_COLOURS;
    if (is_colour($saved['map'] ?? null)) {
        $colours['map'] = strtolower($saved['map']);
    }
    foreach ($colours['pins'] as $who => $default) {
        $pin = is_array($saved['pins'] ?? null) ? ($saved['pins'][$who] ?? null) : null;
        if (is_colour($pin)) {
            $colours['pins'][$who] = strtolower($pin);
        }
    }
    return $colours;
}

// Names to show for each person: the saved name, or the default if none is set
function people_names(): array
{
    $saved = load_settings()['people'] ?? [];
    $names = [];
    foreach (PEOPLE as $id => $default) {
        $name = $saved[$id] ?? '';
        $names[$id] = is_string($name) && $name !== '' ? $name : $default;
    }
    return $names;
}

// The 32 counties, as ids matching assets/counties.geojson
define('COUNTIES', [
    'antrim', 'armagh', 'carlow', 'cavan', 'clare', 'cork', 'donegal', 'down',
    'dublin', 'fermanagh', 'galway', 'kerry', 'kildare', 'kilkenny', 'laois', 'leitrim',
    'limerick', 'derry', 'longford', 'louth', 'mayo', 'meath', 'monaghan', 'offaly',
    'roscommon', 'sligo', 'tipperary', 'tyrone', 'waterford', 'westmeath', 'wexford', 'wicklow',
]);
