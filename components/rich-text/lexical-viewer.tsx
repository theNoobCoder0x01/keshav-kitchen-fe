"use client";

import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { useMemo } from "react";

interface LexicalViewerProps {
  value?: string | null;
  className?: string;
}

function parseInitialEditorStateString(value?: string | null): string | null {
  if (!value) return null;

  // Try to parse as JSON first (for Lexical editor state)
  try {
    const json = JSON.parse(value);
    if (json && typeof json === "object" && json.root) {
      return value;
    }
  } catch {
    // Not valid JSON, continue to handle as plain text
  }

  // If it's plain text, return null so it gets handled by the plain text fallback
  return null;
}

export function LexicalViewer({ value, className }: LexicalViewerProps) {
  const initialSerialized = useMemo(
    () => parseInitialEditorStateString(value),
    [value],
  );

  const initialConfig = useMemo(
    () => ({
      namespace: "recipe-instructions-viewer",
      editable: false,
      nodes: [
        HeadingNode,
        QuoteNode,
        ListNode,
        ListItemNode,
        CodeNode,
        HorizontalRuleNode,
        LinkNode,
        TableNode,
        TableRowNode,
        TableCellNode,
      ],
      onError(error: unknown) {
        // eslint-disable-next-line no-console
        console.error(error);
      },
      editorState: (editor: any) => {
        if (initialSerialized) {
          const state = editor.parseEditorState(initialSerialized);
          editor.setEditorState(state);
          return;
        }
        const plain = value || "";
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const lines = plain.replace(/\r/g, "").split("\n");
          lines.forEach((line) => {
            const p = $createParagraphNode();
            if (line) p.append($createTextNode(line));
            root.append(p);
          });
        });
      },
      theme: {
        paragraph: "mb-2",
        text: {
          bold: "font-semibold",
          italic: "italic",
          underline: "underline",
          strikethrough: "line-through",
        },
        link: "text-primary underline",
        list: {
          nested: {
            listitem: "ml-4",
          },
          ol: "list-decimal pl-6",
          ul: "list-disc pl-6",
          listitem: "mb-1",
        },
        heading: {
          h1: "text-2xl font-bold mb-3",
          h2: "text-xl font-bold mb-2",
          h3: "text-lg font-bold mb-2",
        },
        quote: "border-l-4 border-gray-300 pl-4 italic text-gray-600",
        code: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono",
        table: "border-collapse border border-gray-300",
        tableCell: "border border-gray-300 px-2 py-1 min-w-16",
        tableCellHeader:
          "border border-gray-300 px-2 py-1 bg-gray-100 font-semibold",
      },
    }),
    [initialSerialized, value],
  );

  return (
    <div className={className}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="prose max-w-none outline-none" />
          }
          placeholder={null}
          ErrorBoundary={() => null}
        />
      </LexicalComposer>
    </div>
  );
}
