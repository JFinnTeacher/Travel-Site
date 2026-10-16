<?php
// Admin home: confirms PHP and the data folder work on the server, lets you set the
// people's names shown on the map, and links to the update page.

require dirname(__DIR__) . '/config.php';

session_start();
if (empty($_SESSION['token'])) {
    $_SESSION['token'] = bin2hex(random_bytes(16));
}

// Create the data folder on first run if it doesn't exist yet
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0750, true);
}

// Save the user names form
$namesMessage = null;
$namesOk = true;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['token'], $_POST['token'] ?? '')) {
        [$namesOk, $namesMessage] = [false, 'Form expired. Reload the page and try again.'];
    } else {
        $settings = load_settings();
        $settings['people'] = [];
        foreach (PEOPLE as $id => $default) {
            $name = trim((string) ($_POST['name'][$id] ?? ''));
            if ($name !== '') {
                $settings['people'][$id] = substr($name, 0, 120);
            }
        }
        $saved = @file_put_contents(DATA_DIR . '/settings.json',
            json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        [$namesOk, $namesMessage] = $saved !== false
            ? [true, 'Names saved.']
            : [false, 'Couldn\'t save. Check the data folder is writable (see Server check).'];
    }
}
$names = load_settings()['people'] ?? [];

$checks = [
    ['PHP is running', true, 'Version ' . PHP_VERSION],
    ['Data folder exists', is_dir(DATA_DIR), DATA_DIR],
    ['Data folder is writable', is_writable(DATA_DIR), is_writable(DATA_DIR) ? 'Visits can be saved' : 'Run: sudo mkdir -p ' . DATA_DIR . ' && sudo chown my_webapp: ' . DATA_DIR],
];
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Site Admin</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f8fc; color: #1c2a3a; }
  main { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
  h1 { font-size: 1.4rem; font-weight: 500; }
  .card { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(20, 60, 110, .15); margin-bottom: 16px; }
  h2 { font-size: 1.05rem; font-weight: 500; margin: 0 0 12px; color: #1859b0; }
  .check { display: flex; gap: 12px; padding: 8px 0; border-top: 1px solid #e6edf5; }
  .check:first-of-type { border-top: 0; }
  .icon { font-weight: 700; width: 1.2em; }
  .ok { color: #2e7d32; }
  .bad { color: #c62828; }
  .detail { color: #5b6f85; font-size: .85rem; word-break: break-all; }
  a.button { display: inline-block; background: #1e6fd9; color: #fff; text-decoration: none; border-radius: 20px; padding: 10px 24px; margin-right: 8px; }
  a.button:hover { background: #1859b0; }
  a.button.outlined { background: #fff; color: #1e6fd9; box-shadow: inset 0 0 0 1px #9dbbe3; }
  .field { display: block; margin-bottom: 12px; }
  .field span { display: block; font-size: .8rem; color: #5b6f85; margin-bottom: 4px; }
  .field input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #c5d6ec; border-radius: 8px; font: inherit; color: #1c2a3a; }
  .field input:focus { outline: none; border-color: #1e6fd9; box-shadow: 0 0 0 2px #dce8f7; }
  button { background: #1e6fd9; color: #fff; border: 0; border-radius: 20px; padding: 10px 24px; font-size: 1rem; cursor: pointer; }
  button:hover { background: #1859b0; }
  .note { margin: 12px 0 0; font-size: .9rem; }
</style>
</head>
<body>
<main>
  <h1>Site Admin</h1>

  <div class="card">
    <h2>Server check</h2>
    <?php foreach ($checks as [$label, $passed, $detail]): ?>
      <div class="check">
        <span class="icon <?= $passed ? 'ok' : 'bad' ?>"><?= $passed ? '✓' : '✗' ?></span>
        <div>
          <div><?= htmlspecialchars($label) ?></div>
          <div class="detail"><?= htmlspecialchars($detail) ?></div>
        </div>
      </div>
    <?php endforeach; ?>
  </div>

  <form class="card" method="post">
    <h2>User names</h2>
    <input type="hidden" name="token" value="<?= htmlspecialchars($_SESSION['token']) ?>">
    <?php foreach (PEOPLE as $id => $default): ?>
      <label class="field">
        <span><?= htmlspecialchars($default) ?></span>
        <input type="text" name="name[<?= htmlspecialchars($id) ?>]" maxlength="40"
               value="<?= htmlspecialchars($names[$id] ?? '') ?>" placeholder="<?= htmlspecialchars($default) ?>">
      </label>
    <?php endforeach; ?>
    <button type="submit">Save names</button>
    <?php if ($namesMessage !== null): ?>
      <p class="note <?= $namesOk ? 'ok' : 'bad' ?>"><?= htmlspecialchars($namesMessage) ?></p>
    <?php endif; ?>
  </form>

  <a class="button" href="update.php">Update from GitHub</a>
  <a class="button outlined" href="../">Back to map</a>
</main>
</body>
</html>
