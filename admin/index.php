<?php
// Admin home: confirms PHP and the data folder work on the server, with a link to the update page.

require dirname(__DIR__) . '/config.php';

// Create the data folder on first run if it doesn't exist yet
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0750, true);
}

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

  <a class="button" href="update.php">Update from GitHub</a>
  <a class="button outlined" href="../">Back to map</a>
</main>
</body>
</html>
