export function darkenColor(rgb: string | undefined | null, opacity: number) {
  if (!rgb || typeof rgb !== "string") {
    // Fallback to black if color is missing
    return `rgba(0, 0, 0, ${opacity})`;
  }

  const match = rgb.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (!match) {
    // If format is wrong, try to convert from a hex like "#888" => rgb(136,136,136)
    if (rgb.startsWith("#")) {
      const hex = rgb.slice(1);
      const bigint = parseInt(hex.length === 3 ? hex.replace(/(.)/g, "$1$1") : hex, 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    // Unknown format – default to black
    return `rgba(0, 0, 0, ${opacity})`;
  }

  const [, rStr, gStr, bStr] = match;
  const r = Number(rStr);
  const g = Number(gStr);
  const b = Number(bStr);

  const darkFactor = 0.8;
  const newR = Math.round(r * (1 - darkFactor));
  const newG = Math.round(g * (1 - darkFactor));
  const newB = Math.round(b * (1 - darkFactor));

  return `rgba(${newR}, ${newG}, ${newB}, ${opacity})`;
}
