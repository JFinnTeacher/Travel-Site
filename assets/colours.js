// Colour helpers shared by the map (app.js) and the admin page's preview.
// The map uses one base colour; the five county shades and the outline colours are worked out from it.

// Blend a #rrggbb colour towards another: amount 0 = unchanged, 1 = fully the other colour
function mixColour(hex, other, amount) {
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = rgb(hex);
  const b = rgb(other);
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
}

// Lightest for "nothing planned" through to darkest for "both done"
function mapShades(base) {
  return {
    'none': mixColour(base, '#ffffff', 0.85),
    'one-chosen': mixColour(base, '#ffffff', 0.55),
    'both-chosen': base,
    'one-done': mixColour(base, '#000000', 0.3),
    'both-done': mixColour(base, '#000000', 0.55),
    border: mixColour(base, '#ffffff', 0.45),
    hover: mixColour(base, '#000000', 0.2),
    selected: mixColour(base, '#000000', 0.55),
  };
}
