<?php
// Admin home (Settings): the people's names and the map and pin colours, with links to the
// update page and back to the map. Only shows a server warning if the data folder has a problem.

require dirname(__DIR__) . '/config.php';

session_start();
if (empty($_SESSION['token'])) {
    $_SESSION['token'] = bin2hex(random_bytes(16));
}

// Create the data folder on first run if it doesn't exist yet
if (!is_dir(DATA_DIR)) {
    @mkdir(DATA_DIR, 0750, true);
}
$dataOk = is_dir(DATA_DIR) && is_writable(DATA_DIR);

// Save the settings form
$message = null;
$ok = true;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!hash_equals($_SESSION['token'], $_POST['token'] ?? '')) {
        [$ok, $message] = [false, 'Form expired. Reload the page and try again.'];
    } else {
        $settings = load_settings();

        $settings['people'] = [];
        foreach (PEOPLE as $id => $default) {
            $name = trim((string) ($_POST['name'][$id] ?? ''));
            if ($name !== '') {
                $settings['people'][$id] = substr($name, 0, 120);
            }
        }

        if (isset($_POST['reset_colours'])) {
            unset($settings['colours']);
        } else {
            $colours = DEFAULT_COLOURS;
            if (is_colour($_POST['colour']['map'] ?? null)) {
                $colours['map'] = strtolower($_POST['colour']['map']);
            }
            foreach ($colours['pins'] as $who => $default) {
                if (is_colour($_POST['colour']['pins'][$who] ?? null)) {
                    $colours['pins'][$who] = strtolower($_POST['colour']['pins'][$who]);
                }
            }
            $settings['colours'] = $colours;
        }

        $saved = @file_put_contents(DATA_DIR . '/settings.json',
            json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
        [$ok, $message] = $saved !== false
            ? [true, isset($_POST['reset_colours']) ? 'Colours reset to the defaults.' : 'Settings saved.']
            : [false, 'Couldn\'t save. The data folder isn\'t writable (see the warning above).'];
    }
}

$names = load_settings()['people'] ?? [];
$colours = site_colours();
$pinLabels = ['shared' => 'Shared places'];
foreach (people_names() as $id => $name) {
    $pinLabels[$id] = $name . '\'s places';
}
?>
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Settings</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f8fc; color: #1c2a3a; }
  main { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
  h1 { font-size: 1.4rem; font-weight: 500; }
  .card { background: #fff; border-radius: 12px; padding: 16px 20px; box-shadow: 0 1px 3px rgba(20, 60, 110, .15); margin-bottom: 16px; }
  .card.warning { border-left: 4px solid #c62828; }
  h2 { font-size: 1.05rem; font-weight: 500; margin: 0 0 12px; color: #1859b0; }
  h2 + .hint { margin-top: -6px; }
  .hint { font-size: .85rem; color: #5b6f85; margin: 0 0 12px; }
  .section { padding-top: 14px; margin-top: 14px; border-top: 1px solid #e6edf5; }
  .ok { color: #2e7d32; }
  .bad { color: #c62828; }
  code { font-size: .8rem; word-break: break-all; background: #f5f8fc; padding: 2px 4px; border-radius: 4px; }
  a.button { display: inline-block; background: #1e6fd9; color: #fff; text-decoration: none; border-radius: 20px; padding: 10px 24px; margin-right: 8px; }
  a.button:hover { background: #1859b0; }
  a.button.outlined, button.outlined { background: #fff; color: #1e6fd9; box-shadow: inset 0 0 0 1px #9dbbe3; }
  a.button.outlined:hover, button.outlined:hover { background: #dce8f7; }
  .field { display: block; margin-bottom: 12px; }
  .field span { display: block; font-size: .8rem; color: #5b6f85; margin-bottom: 4px; }
  .field input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #c5d6ec; border-radius: 8px; font: inherit; color: #1c2a3a; }
  .field input:focus { outline: none; border-color: #1e6fd9; box-shadow: 0 0 0 2px #dce8f7; }
  button { background: #1e6fd9; color: #fff; border: 0; border-radius: 20px; padding: 10px 24px; font-size: 1rem; cursor: pointer; }
  button:hover { background: #1859b0; }
  .buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .note { margin: 12px 0 0; font-size: .9rem; }

  /* Colour pickers */
  .colour { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
  .colour input[type=color] { width: 44px; height: 36px; padding: 2px; border: 1px solid #c5d6ec; border-radius: 8px; background: #fff; cursor: pointer; }
  .shades { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: .8rem; color: #5b6f85; }
  .shades span { display: flex; align-items: center; gap: 5px; }
  .shades i { width: 14px; height: 14px; border-radius: 3px; border: 1px solid rgba(20, 60, 110, .25); }
  .pin-mark { width: 14px; height: 14px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid #fff; box-shadow: 0 1px 3px rgba(0, 0, 0, .35); }
</style>
</head>
<body>
<main>
  <h1>Settings</h1>

  <?php if (!$dataOk): ?>
    <div class="card warning">
      <h2>The data folder isn't writable</h2>
      <p class="hint">Nothing can be saved until this is fixed. On the server, run:</p>
      <code>sudo mkdir -p <?= htmlspecialchars(DATA_DIR) ?> &amp;&amp; sudo chown my_webapp: <?= htmlspecialchars(DATA_DIR) ?></code>
    </div>
  <?php endif; ?>

  <form class="card" method="post">
    <input type="hidden" name="token" value="<?= htmlspecialchars($_SESSION['token']) ?>">

    <h2>User names</h2>
    <?php foreach (PEOPLE as $id => $default): ?>
      <label class="field">
        <span><?= htmlspecialchars($default) ?></span>
        <input type="text" name="name[<?= htmlspecialchars($id) ?>]" maxlength="40"
               value="<?= htmlspecialchars($names[$id] ?? '') ?>" placeholder="<?= htmlspecialchars($default) ?>">
      </label>
    <?php endforeach; ?>

    <div class="section">
      <h2>Map colour</h2>
      <p class="hint">Pick one colour. The county shades, from "Nothing planned" to "Both done", are made from it.</p>
      <div class="colour">
        <input type="color" id="map-colour" name="colour[map]" value="<?= htmlspecialchars($colours['map']) ?>" aria-label="Map colour">
        <div class="shades" id="map-shades"></div>
      </div>
    </div>

    <div class="section">
      <h2>Pin colours</h2>
      <?php foreach ($colours['pins'] as $who => $colour): ?>
        <label class="colour">
          <input type="color" class="pin-colour" name="colour[pins][<?= htmlspecialchars($who) ?>]" value="<?= htmlspecialchars($colour) ?>">
          <i class="pin-mark" style="background: <?= htmlspecialchars($colour) ?>"></i>
          <?= htmlspecialchars($pinLabels[$who]) ?>
        </label>
      <?php endforeach; ?>
    </div>

    <div class="buttons">
      <button type="submit">Save settings</button>
      <button type="submit" class="outlined" name="reset_colours" value="1">Reset colours</button>
    </div>
    <?php if ($message !== null): ?>
      <p class="note <?= $ok ? 'ok' : 'bad' ?>"><?= htmlspecialchars($message) ?></p>
    <?php endif; ?>
  </form>

  <a class="button" href="update.php">Update from GitHub</a>
  <a class="button outlined" href="../">Back to map</a>
</main>

<script src="../assets/colours.js"></script>
<script>
  // Live preview: show the five county shades for the chosen map colour, and recolour the pin marks
  const LABELS = { 'none': 'Nothing planned', 'one-chosen': 'One chosen', 'both-chosen': 'Both chosen', 'one-done': 'One done', 'both-done': 'Both done' };
  const mapInput = document.getElementById('map-colour');
  function showShades() {
    const shades = mapShades(mapInput.value);
    document.getElementById('map-shades').replaceChildren(...Object.keys(LABELS).map((key) => {
      const item = document.createElement('span');
      const swatch = document.createElement('i');
      swatch.style.background = shades[key];
      item.append(swatch, LABELS[key]);
      return item;
    }));
  }
  mapInput.addEventListener('input', showShades);
  showShades();
  document.querySelectorAll('.pin-colour').forEach((input) => {
    input.addEventListener('input', () => { input.nextElementSibling.style.background = input.value; });
  });
</script>
</body>
</html>
