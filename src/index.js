export { extract as extractAngular } from "./angular/extract.js";
export { replace as replaceAngular } from "./angular/replace.js";
export { extract as extractReact } from "./react/extract.js";
export { replace as replaceReact } from "./react/replace.js";

// Keep backward-compatible exports (default to Angular behavior).
export { extract } from "./angular/extract.js";
export { replace } from "./angular/replace.js";
