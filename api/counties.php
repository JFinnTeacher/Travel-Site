<?php
// County status API.
//   GET  → { "counties": { "cork": { "visited": true, "updated": "2026-10-16" }, ... } }
//   POST { "county": "cork", "visited": true } → saves it and returns the full list again
// Stored in DATA_DIR/counties.json, created empty on first use.

require dirname(__DIR__) . '/config.php';

header('Content-Type: application/json');
header('Cache-Control: no-store');

$file = DATA_DIR . '/counties.json';

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

$data = json_decode(stream_get_contents($fp), true);
if (!is_array($data)) {
    $data = [];
}

if ($method === 'POST') {
    // Requiring a JSON body means other websites can't post here from a plain form
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) {
        fail(415, 'Send JSON');
    }
    $in = json_decode(file_get_contents('php://input'), true);
    $county = $in['county'] ?? null;
    if (!in_array($county, COUNTIES, true) || !is_bool($in['visited'] ?? null)) {
        fail(400, 'Unknown county or missing "visited"');
    }

    if ($in['visited']) {
        $data[$county] = ['visited' => true, 'updated' => date('Y-m-d')];
    } else {
        unset($data[$county]);
    }
    ksort($data);

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT));
    fflush($fp);
} elseif ($method !== 'GET') {
    fail(405, 'Use GET or POST');
}

flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['counties' => (object) $data]);
