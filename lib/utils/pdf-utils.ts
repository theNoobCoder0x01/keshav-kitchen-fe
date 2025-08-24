import fs from "fs";
import path from "path";
import { createTw } from "react-pdf-tailwind";
import defaultTheme from "tailwindcss/defaultTheme";

function parseBlock(css: string, regex: RegExp) {
  const match = css.match(regex);
  if (!match) return {};
  const block = match[1];
  const regexVar = /--([a-zA-Z0-9-]+):\s*([^;]+);/g;
  const vars: Record<string, string> = {};
  let m;
  while ((m = regexVar.exec(block))) {
    vars[m[1]] = m[2].trim();
  }
  return vars;
}

export function extractCssVars(filePath: string) {
  const css = fs.readFileSync(filePath, "utf8");

  const theme = parseBlock(css, /@theme\s*{([^}]+)}/);
  const root = parseBlock(css, /:root\s*{([^}]+)}/);

  return { theme, root };
}

const cssPath = path.join(process.cwd(), "app", "globals.css");
const { theme, root } = extractCssVars(cssPath);

function resolveTheme(
  vars: Record<string, string>,
  base: Record<string, string>,
) {
  const resolved: Record<string, string> = {};

  for (const [key, val] of Object.entries(vars)) {
    const resolvedVal = val.replace(/var\(--([^)]+)\)/g, (_, name) => {
      return base[name] || `var(--${name})`;
    });

    // If it's an HSL tuple, wrap it
    if (/^\d+(\.\d+)?\s+\d+(\.\d+)?%\s+\d+(\.\d+)?%$/.test(resolvedVal)) {
      resolved[key] = `hsl(${resolvedVal})`;
    } else {
      resolved[key] = resolvedVal;
    }
  }

  return resolved;
}

const resolvedTheme = resolveTheme(theme, root);

const themeConfig = {
  colors: {
    ...Object.fromEntries(
      Object.entries(resolvedTheme)
        .filter(([k]) => k.startsWith("color-"))
        .map(([k, v]) => [k.replace(/^color-/, ""), v]),
    ),
  },
  borderRadius: {
    ...defaultTheme.borderRadius,
    ...Object.fromEntries(
      Object.entries(resolvedTheme)
        .filter(([k]) => k.startsWith("radius-"))
        .map(([k, v]) => [k.replace(/^radius-/, ""), v]),
    ),
  },
  spacing: {
    ...defaultTheme.spacing,
    ...Object.fromEntries(
      Object.entries(resolvedTheme)
        .filter(([k]) => k.startsWith("spacing-"))
        .map(([k, v]) => [k.replace(/^spacing-/, ""), v]),
    ),
  },
  // add more categories if your @theme defines them
};

// Create Tailwind instance with all tokens
export const tw = createTw(themeConfig);
