<?php
// Map pins API: places marked on the map, each in a county.
//   GET  → { "pins": [ { "id": "a1b2c3d4e5f6", "county": "cork", "name": "Blarney Castle",
//                        "note": "...", "who": "user1", "lat": 51.929, "lng": -8.571, "added": "2026-10-16" }, ... ] }
//        "who" is a person id from PEOPLE in config.php, or left out when the place is for both
//   POST { "action": "save", "id": "..." (leave out to add a new pin), "county", "name", "note", "who", "lat", "lng" }
//   POST { "action": "delete", "id": "..." }
//        → both return the full list again
// Stored in DATA_DIR/pins.json, created empty on first use.

require dirname(__DIR__) . '/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

$file = DATA_DIR . '/pins.json';

function fail(int $code, string $message): void
{
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit;
}

if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0750, true);
}

// Open the data file (creating it if needed) and lock it, so two saves at once can't clash
$fp = @fopen($file, 'c+');
if (!$fp) {
    fail(500, 'Can\'t open the data file. Check the data folder exists and is writable: ' . DATA_DIR);
}
$method = $_SERVER['REQUEST_METHOD'];
flock($fp, $method === 'POST' ? LOCK_EX : LOCK_SH);

$pins = json_decode(stream_get_contents($fp), true);
if (!is_array($pins)) {
    $pins = [];
}

if ($method === 'POST') {
    // Requiring a JSON body means other websites can't post here from a plain form
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        fail(415, 'Send JSON');
    }
    $in = json_decode(file_get_contents('php://input'), true);
    if (!is_array($in)) {
        fail(400, 'Send JSON');
    }
    $id = $in['id'] ?? null;
    $index = null;
    if ($id !== null) {
        $index = array_search($id, array_column($pins, 'id'), true);
        if ($index === false) {
            fail(404, 'That pin no longer exists');
        }
    }

    if (($in['action'] ?? '') === 'delete') {
        if ($index === null) {
            fail(400, 'Missing "id"');
        }
        array_splice($pins, $index, 1);
    } elseif (($in['action'] ?? '') === 'save') {
        $name = trim((string) ($in['name'] ?? ''));
        $note = trim((string) ($in['note'] ?? ''));
        $lat = $in['lat'] ?? null;
        $lng = $in['lng'] ?? null;
        if ($name === '' || strlen($name) > 400 || strlen($note) > 8000) {
            fail(400, 'A pin needs a name (100 characters at most) and a note of 2000 at most');
        }
        if (!in_array($in['county'] ?? null, COUNTIES, true)) {
            fail(400, 'Unknown county');
        }
        $who = $in['who'] ?? '';
        if ($who !== '' && !array_key_exists($who, PEOPLE)) {
            fail(400, 'Unknown person');
        }
        // Roughly the island of Ireland, so a bad tap or search can't land a pin in the sea
        if (!is_numeric($lat) || !is_numeric($lng) || $lat < 51 || $lat > 56 || $lng < -11 || $lng > -5) {
            fail(400, 'That location isn\'t in Ireland');
        }
        $pin = [
            'id' => $id ?? bin2hex(random_bytes(6)),
            'county' => $in['county'],
            'name' => $name,
            'note' => $note,
        ];
        if ($who !== '') {
            $pin['who'] = $who;
        }
        $pin += [
            'lat' => round((float) $lat, 6),
            'lng' => round((float) $lng, 6),
            'added' => $index === null ? date('Y-m-d') : $pins[$index]['added'],
        ];
        if ($index === null) {
            $pins[] = $pin;
        } else {
            $pins[$index] = $pin;
        }
    } else {
        fail(400, 'Unknown action');
    }

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($pins, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
} elseif ($method !== 'GET') {
    fail(405, 'Use GET or POST');
}

flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['pins' => $pins]);
