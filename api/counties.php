<?php
// County plans API.
//   GET  → { "counties": { "cork": { "user1": { "suggestion": "...", "done": true, "done_on": "2026-10-16" } }, ... } }
//   POST { "county": "cork", "people": { "user1": { "suggestion": "...", "done": true } } }
//        (people ids come from PEOPLE in config.php) → saves just the fields sent and returns the full list again
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
    if (!in_array($county, COUNTIES, true)) {
        fail(400, 'Unknown county');
    }
    $people = $in['people'] ?? null;
    if (!$people || !is_array($people)) {
        fail(400, '"people" must be an object');
    }
    foreach ($people as $person => $changes) {
        if (!array_key_exists($person, PEOPLE) || !is_array($changes)) {
            fail(400, 'Unknown person: ' . $person);
        }
        if (array_key_exists('suggestion', $changes)
            && (!is_string($changes['suggestion']) || strlen($changes['suggestion']) > 8000)) {
            fail(400, '"suggestion" must be text (2000 characters at most)');
        }
        if (array_key_exists('done', $changes) && !is_bool($changes['done'])) {
            fail(400, '"done" must be true or false');
        }
    }

    $entry = $data[$county] ?? [];
    foreach ($people as $person => $changes) {
        $plan = $entry[$person] ?? [];
        if (array_key_exists('suggestion', $changes)) {
            $suggestion = trim($changes['suggestion']);
            if ($suggestion === '') {
                unset($plan['suggestion']);
            } else {
                $plan['suggestion'] = $suggestion;
            }
        }
        if (array_key_exists('done', $changes)) {
            if (!$changes['done']) {
                unset($plan['done'], $plan['done_on']);
            } elseif (empty($plan['done'])) { // keep the original date if already done
                $plan['done'] = true;
                $plan['done_on'] = date('Y-m-d');
            }
        }
        if ($plan) {
            $entry[$person] = $plan;
        } else {
            unset($entry[$person]);
        }
    }

    // Drop counties with nothing saved, so the file only lists ones that matter
    if ($entry) {
        $data[$county] = $entry;
    } else {
        unset($data[$county]);
    }
    ksort($data);

    ftruncate($fp, 0);
    rewind($fp);
    fwrite($fp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    fflush($fp);
} elseif ($method !== 'GET') {
    fail(405, 'Use GET or POST');
}

flock($fp, LOCK_UN);
fclose($fp);

echo json_encode(['counties' => (object) $data]);
