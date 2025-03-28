export function getLocationEnv(): "web" | "electron" | "demo" {
  const proto = window.location.protocol;

  if (window.location.host == "demo.nugget.cartesiancs.com") {
    return "demo";
  }

  if (["http:", "https:"].includes(proto)) {
    return "web";
  } else {
    return "electron";
  }
}
