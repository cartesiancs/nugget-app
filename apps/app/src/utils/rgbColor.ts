export function darkenColor(rgb, opacity) {
  // Parse the RGB values from the input string
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) {
    throw new Error("Invalid RGB format. Use 'rgb(r, g, b)'.");
  }

  const [_, r, g, b] = match.map(Number); // Extract RGB values as numbers

  // Mix with dark (0, 0, 0) by 80%
  const darkFactor = 0.8;
  const newR = Math.round(r * (1 - darkFactor));
  const newG = Math.round(g * (1 - darkFactor));
  const newB = Math.round(b * (1 - darkFactor));

  // Return the new color with opacity as RGBA
  return `rgba(${newR}, ${newG}, ${newB}, ${opacity})`;
}
