"use client";

import { useCallback, useMemo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { $getRoot, $createParagraphNode, $createTextNode, EditorState } from "lexical";
import { HeadingNode } from "@lexical/rich-text";
import { ListNode, ListItemNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";

interface LexicalEditorProps {
  value?: string | null;
  onChange?: (serialized: string) => void;
  className?: string;
  placeholder?: string;
}

function Placeholder({ text }: { text: string }) {
  return <div className="absolute top-3 left-3 pointer-events-none select-none text-muted-foreground/70 text-sm">{text}</div>;
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

export function LexicalEditor({ value, onChange, className, placeholder = "Write instructions..." }: LexicalEditorProps) {
  const initialSerialized = useMemo(() => parseInitialEditorStateString(value), [value]);

  const initialConfig = useMemo(
    () => ({
      namespace: "recipe-instructions",
      nodes: [HeadingNode, ListNode, ListItemNode, LinkNode],
      onError(error: unknown) {
        // eslint-disable-next-line no-console
        console.error(error);
      },
      editable: true,
      editorState: (editor: any) => {
        if (initialSerialized) {
          const editorState = editor.parseEditorState(initialSerialized);
          editor.setEditorState(editorState);
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
      },
    }),
    [initialSerialized, value],
  );

  const handleChange = useCallback(
    (editorState: EditorState) => {
      const serialized = JSON.stringify(editorState);
      onChange?.(serialized);
    },
    [onChange],
  );

  return (
    <div className={"relative border rounded-md px-3 py-2 bg-background " + (className || "")}> 
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable className="min-h-[160px] outline-none text-sm leading-6" />}
          placeholder={<Placeholder text={placeholder} />}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoFocusPlugin />
        <MarkdownShortcutPlugin />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange={true} />
      </LexicalComposer>
    </div>
  );
}