"use client";

import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode } from "@lexical/rich-text";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { useMemo } from "react";

interface LexicalViewerProps {
  value?: string | null;
  className?: string;
}

function parseInitialEditorStateString(value?: string | null): string | null {
  if (!value) return null;
  try {
    const json = JSON.parse(value);
    if (json && typeof json === "object" && json.root) {
      return value;
    }
    return null;
  } catch {
    return null;
  }
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
      nodes: [HeadingNode, ListItemNode, ListNode, LinkNode],
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
        link: "text-primary underline",
        list: {
          nested: { listitem: "ml-4" },
          ol: "list-decimal pl-6",
          ul: "list-disc pl-6",
          listitem: "mb-1",
        },
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
