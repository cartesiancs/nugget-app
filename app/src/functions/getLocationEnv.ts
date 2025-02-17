export function getLocationEnv(): "web" | "electron" {
  const proto = window.location.protocol;
  if (["http:", "https:"].includes(proto)) {
    return "web";
  } else {
    return "electron";
  }
}
