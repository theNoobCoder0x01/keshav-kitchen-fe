export function isLexicalSerialized(value?: string | null): boolean {
  if (!value) return false;
  try {
    const json = JSON.parse(value);
    return !!json && typeof json === "object" && !!(json as any).root;
  } catch {
    return false;
  }
}

function collectTextFromNode(node: any): string[] {
  if (!node) return [];
  const type = node.type;
  if (type === "text") {
    return [node.text || ""];
  }
  if (type === "paragraph" || type === "heading" || type === "quote") {
    const children = node.children || [];
    const text = children
      .map((c: any) => collectTextFromNode(c).join(""))
      .join("");
    return [text];
  }
  if (type === "list") {
    const items = node.children || [];
    const lines: string[] = [];
    for (const item of items) {
      lines.push(...collectTextFromNode(item));
    }
    return lines;
  }
  if (type === "listitem") {
    const children = node.children || [];
    const lines: string[] = [];
    for (const child of children) {
      const childLines = collectTextFromNode(child);
      // If paragraph under listitem produced a single line, keep it as one step
      lines.push(...childLines);
    }
    return lines;
  }
  // Fallback: traverse children generically
  const children = node.children || [];
  return children.flatMap((c: any) => collectTextFromNode(c));
}

export function extractStepsFromInstructions(value?: string | null): string[] {
  if (!value) return [];
  if (isLexicalSerialized(value)) {
    try {
      const json = JSON.parse(value);
      const root = json.root;
      if (!root) return [];
      const lines = collectTextFromNode(root)
        .map((line) => (line || "").replace(/\s+/g, " ").trim())
        .filter(Boolean);
      return lines;
    } catch {
      return [];
    }
  }
  // Plain text fallback
  return value
    .replace(/\r/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function extractPlainText(value?: string | null): string {
  if (!value) return "";
  if (isLexicalSerialized(value)) {
    try {
      const json = JSON.parse(value);
      const root = json.root;
      if (!root) return "";
      return collectTextFromNode(root)
        .map((line) => (line || "").trim())
        .filter(Boolean)
        .join("\n");
    } catch {
      return "";
    }
  }
  return value;
}