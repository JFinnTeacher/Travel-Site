<?php
// Placeholder home page: confirms the site, PHP and the data folder work on the server.

require __DIR__ . '/config.php';

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
<title>Ireland Travels</title>
<style>
  :root { --blue: #1e6fd9; --blue-dark: #1859b0; --bg: #f5f8fc; --text: #1c2a3a; --muted: #5b6f85; --ok: #2e7d32; --bad: #c62828; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: var(--bg); color: var(--text); }
  header { background: var(--blue); color: #fff; padding: 16px; box-shadow: 0 2px 4px rgba(20, 60, 110, .25); }
  header h1 { margin: 0 auto; max-width: 720px; font-size: 1.3rem; font-weight: 500; }
  main { max-width: 720px; margin: 0 auto; padding: 24px 16px; }
  .card { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(20, 60, 110, .15); margin-bottom: 16px; }
  h2 { font-size: 1.05rem; font-weight: 500; margin: 0 0 12px; color: var(--blue-dark); }
  p { line-height: 1.5; margin: 0 0 8px; }
  ul { margin: 0; padding-left: 20px; line-height: 1.8; }
  .check { display: flex; gap: 12px; padding: 8px 0; border-top: 1px solid #e6edf5; }
  .check:first-of-type { border-top: 0; }
  .icon { font-weight: 700; width: 1.2em; }
  .ok { color: var(--ok); }
  .bad { color: var(--bad); }
  .detail { color: var(--muted); font-size: .85rem; word-break: break-all; }
  a.button { display: inline-block; background: var(--blue); color: #fff; text-decoration: none; border-radius: 20px; padding: 10px 24px; }
  a.button:hover { background: var(--blue-dark); }
</style>
</head>
<body>
<header><h1>Ireland Travels</h1></header>
<main>
  <div class="card">
    <h2>Coming soon</h2>
    <p>Jim and Suzanne's map for planning and recording visits around Ireland.</p>
    <p class="detail">Update button test 1</p>
    <ul>
      <li>Interactive map of the counties, with visited ones highlighted</li>
      <li>Wishlist of places we want to go</li>
      <li>Planned activities in each county, one each for Jim and Suzanne</li>
      <li>Log of visits with place, date and notes</li>
    </ul>
  </div>

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

  <a class="button" href="admin/update.php">Update from GitHub</a>
</main>
</body>
</html>
