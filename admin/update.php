<?php
// Admin page: pull the latest code from GitHub onto the server.
// Access is limited to Jim and Suzanne by YunoHost's login (My Webapp permissions).

session_start();
if (empty($_SESSION['token'])) {
    $_SESSION['token'] = bin2hex(random_bytes(16));
}

$repo = dirname(__DIR__);
putenv('HOME=' . sys_get_temp_dir()); // git wants a HOME; the web user may not have one

function git(string $args): array
{
    global $repo;
    $cmd = 'git -c safe.directory=' . escapeshellarg($repo)
         . ' -C ' . escapeshellarg($repo) . ' ' . $args . ' 2>&1';
    exec($cmd, $lines, $code);
    return [$code === 0, trim(implode("\n", $lines))];
}

$canRun = function_exists('exec'); // false if the server has disabled exec()
$message = null;
$ok = true;

if ($canRun && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['token'], $_POST['token'] ?? '')) {
        [$ok, $message] = [false, 'Form expired. Reload the page and try again.'];
    } else {
        [, $before] = git('rev-parse HEAD');
        [$ok, $output] = git('pull --ff-only');
        if (!$ok) {
            $message = "Update failed:\n" . $output;
        } else {
            [, $after] = git('rev-parse HEAD');
            if ($before === $after) {
                $message = 'Already up to date.';
            } else {
                [, $changes] = git('log --oneline ' . escapeshellarg("$before..$after"));
                $message = "Updated. New changes:\n" . $changes;
            }
        }
    }
}

[, $current] = $canRun ? git('log -1 --format=' . escapeshellarg('%h  %s  (%cr)')) : [false, ''];
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Update Site</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f8fc; color: #1c2a3a; }
  main { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
  h1 { font-size: 1.4rem; font-weight: 500; }
  .card { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(20, 60, 110, .15); margin-bottom: 16px; }
  .label { font-size: .8rem; color: #5b6f85; text-transform: uppercase; letter-spacing: .04em; }
  button, .button { display: inline-block; background: #1e6fd9; color: #fff; border: 0; border-radius: 20px; padding: 10px 24px; font-size: 1rem; cursor: pointer; text-decoration: none; }
  button:hover, .button:hover { background: #1859b0; }
  pre { white-space: pre-wrap; margin: 0; font-size: .9rem; }
  .error { border-left: 4px solid #c62828; }
  .success { border-left: 4px solid #1e6fd9; }
  .nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e6edf5; }
  .nav a { display: inline-block; background: #fff; color: #1e6fd9; text-decoration: none; border-radius: 20px; padding: 10px 24px; box-shadow: inset 0 0 0 1px #9dbbe3; }
  .nav a:hover { background: #dce8f7; }
</style>
</head>
<body>
<main>
  <h1>Update Site</h1>

  <?php if (!$canRun): ?>
    <div class="card error">This server doesn't allow PHP to run commands (exec is disabled), so the update button can't work here.</div>
  <?php else: ?>
    <div class="card">
      <div class="label">Current version</div>
      <pre><?= htmlspecialchars($current) ?></pre>
    </div>

    <?php if ($message !== null): ?>
      <div class="card <?= $ok ? 'success' : 'error' ?>"><pre><?= htmlspecialchars($message) ?></pre></div>
      <p><a class="button" href="../">Return to map</a></p>
    <?php endif; ?>

    <form method="post">
      <input type="hidden" name="token" value="<?= htmlspecialchars($_SESSION['token']) ?>">
      <button type="submit">Update from GitHub</button>
    </form>
  <?php endif; ?>

  <nav class="nav">
    <a href="../">Back to map</a>
    <a href="./">Admin home</a>
  </nav>
</main>
</body>
</html>
