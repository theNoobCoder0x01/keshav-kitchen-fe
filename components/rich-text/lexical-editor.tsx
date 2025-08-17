"use client";

import { CodeNode } from "@lexical/code";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import { TRANSFORMERS } from "@lexical/markdown";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { TableCellNode, TableNode, TableRowNode } from "@lexical/table";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  EditorState,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $isParagraphNode,
} from "lexical";
import {
  $createHeadingNode,
  $isHeadingNode,
} from "@lexical/rich-text";
import {
  $createListNode,
  $createListItemNode,
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
} from "@lexical/list";
import {
  $createLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link";
import {
  $createCodeNode,
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  CODE_LANGUAGE_MAP,
  getDefaultCodeLanguage,
} from "@lexical/code";
import {
  $getTableCellNodeFromLexicalNode,
  $getTableColumnIndexFromTableCellNode,
  $getTableNodeFromLexicalNodeOrThrow,
  $getTableRowIndexFromTableCellNode,
  $insertTableColumn,
  $insertTableRow,
  $isTableCellNode,
  $isTableRowNode,
  $isTableSelection,
  getTableObserverFromTableElement,
} from "@lexical/table";
import { $getNearestNodeOfType, mergeRegister } from "@lexical/utils";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Minus,
  Plus,
  Trash2,
  Merge,
  Split,
} from "lucide-react";

interface LexicalEditorProps {
  value?: string | null;
  onChange?: (serialized: string) => void;
  className?: string;
  placeholder?: string;
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="absolute top-3 left-3 pointer-events-none select-none text-muted-foreground/70 text-sm">
      {text}
    </div>
  );
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

// Text formatting toolbar component
function TextFormattingToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [blockType, setBlockType] = useState("paragraph");

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
      setIsCode(selection.hasFormat("code"));

      const node = selection.anchor.getNode();
      const parent = node.getParent();
      
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $getNearestNodeOfType(anchorNode, HeadingNode) ||
            $getNearestNodeOfType(anchorNode, ListNode) ||
            $getNearestNodeOfType(anchorNode, QuoteNode) ||
            anchorNode.getTopLevelElementOrThrow();

      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type);
        }
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }: any) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  const formatText = (format: string) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const insertLink = () => {
    if (!isLink) {
      const url = prompt("Enter URL:");
      if (url) {
        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      }
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  };

  const formatHeading = (headingSize: string) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getTopLevelElementOrThrow();
          const newHeading = $createHeadingNode(headingSize as "h1" | "h2" | "h3");
          element.replace(newHeading);
        }
      });
    }
  };

  const formatParagraph = () => {
    if (blockType !== "paragraph") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element = anchorNode.getTopLevelElementOrThrow();
          const newParagraph = $createParagraphNode();
          element.replace(newParagraph);
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const insertCodeBlock = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchorNode = selection.anchor.getNode();
        const element = anchorNode.getTopLevelElementOrThrow();
        const codeNode = $createCodeNode();
        element.replace(codeNode);
      }
    });
  };

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-muted/30">
      <Select
        value={blockType}
        onValueChange={(value) => {
          if (value === "paragraph") formatParagraph();
          else if (value === "h1") formatHeading("h1");
          else if (value === "h2") formatHeading("h2");
          else if (value === "h3") formatHeading("h3");
          else if (value === "bullet") formatBulletList();
          else if (value === "number") formatNumberedList();
        }}
      >
        <SelectTrigger className="w-32 h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="paragraph">Paragraph</SelectItem>
          <SelectItem value="h1">Heading 1</SelectItem>
          <SelectItem value="h2">Heading 2</SelectItem>
          <SelectItem value="h3">Heading 3</SelectItem>
          <SelectItem value="bullet">Bullet List</SelectItem>
          <SelectItem value="number">Numbered List</SelectItem>
        </SelectContent>
      </Select>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant={isBold ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText("bold")}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant={isItalic ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText("italic")}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant={isUnderline ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText("underline")}
      >
        <Underline className="h-4 w-4" />
      </Button>
      <Button
        variant={isStrikethrough ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText("strikethrough")}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant={isCode ? "default" : "ghost"}
        size="sm"
        onClick={() => formatText("code")}
      >
        <Code className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        variant={isLink ? "default" : "ghost"}
        size="sm"
        onClick={insertLink}
      >
        <Link className="h-4 w-4" />
      </Button>
      <Button
        variant={blockType === "bullet" ? "default" : "ghost"}
        size="sm"
        onClick={formatBulletList}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant={blockType === "number" ? "default" : "ghost"}
        size="sm"
        onClick={formatNumberedList}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={insertCodeBlock}>
        <Code className="h-4 w-4" />
        <span className="text-xs ml-1">Block</span>
      </Button>
    </div>
  );
}

// Table toolbar component
function TableToolbar() {
  const [editor] = useLexicalComposerContext();
  const [isTableSelected, setIsTableSelected] = useState(false);
  const [tableCellNode, setTableCellNode] = useState<any>(null);

  const updateTableToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection) || $isTableSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const cellNode = $getNearestNodeOfType(anchorNode, TableCellNode);
      
      if ($isTableCellNode(cellNode)) {
        setIsTableSelected(true);
        setTableCellNode(cellNode);
      } else {
        setIsTableSelected(false);
        setTableCellNode(null);
      }
    } else {
      setIsTableSelected(false);
      setTableCellNode(null);
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }: any) => {
        editorState.read(() => {
          updateTableToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateTableToolbar();
          return false;
        },
        1
      )
    );
  }, [editor, updateTableToolbar]);

  const insertRowAbove = () => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const rowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
        $insertTableRow(tableNode, rowIndex);
      }
    });
  };

  const insertRowBelow = () => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const rowIndex = $getTableRowIndexFromTableCellNode(tableCellNode);
        $insertTableRow(tableNode, rowIndex + 1);
      }
    });
  };

  const insertColumnLeft = () => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const columnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
        $insertTableColumn(tableNode, columnIndex);
      }
    });
  };

  const insertColumnRight = () => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const columnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
        $insertTableColumn(tableNode, columnIndex + 1);
      }
    });
  };

  const deleteRow = () => {
    editor.update(() => {
      if (tableCellNode) {
        const rowNode = tableCellNode.getParent();
        if ($isTableRowNode(rowNode)) {
          rowNode.remove();
        }
      }
    });
  };

  const deleteColumn = () => {
    editor.update(() => {
      if (tableCellNode) {
        const tableNode = $getTableNodeFromLexicalNodeOrThrow(tableCellNode);
        const columnIndex = $getTableColumnIndexFromTableCellNode(tableCellNode);
        
        // Remove cells from each row at the specified column index
        const tableRows = tableNode.getChildren();
        tableRows.forEach((row) => {
          if ($isTableRowNode(row)) {
            const cells = row.getChildren();
            if (cells[columnIndex]) {
              cells[columnIndex].remove();
            }
          }
        });
      }
    });
  };

  if (!isTableSelected) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-2 border-b bg-blue-50">
      <span className="text-xs font-medium text-blue-700 mr-2">Table:</span>
      
      <Button variant="ghost" size="sm" onClick={insertRowAbove}>
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Row Above</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={insertRowBelow}>
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Row Below</span>
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button variant="ghost" size="sm" onClick={insertColumnLeft}>
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Col Left</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={insertColumnRight}>
        <Plus className="h-3 w-3" />
        <span className="text-xs ml-1">Col Right</span>
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button variant="ghost" size="sm" onClick={deleteRow}>
        <Trash2 className="h-3 w-3" />
        <span className="text-xs ml-1">Delete Row</span>
      </Button>
      <Button variant="ghost" size="sm" onClick={deleteColumn}>
        <Trash2 className="h-3 w-3" />
        <span className="text-xs ml-1">Delete Col</span>
      </Button>
    </div>
  );
}

export function LexicalEditor({
  value,
  onChange,
  className,
  placeholder = "Write instructions...",
}: LexicalEditorProps) {
  const initialSerialized = useMemo(
    () => parseInitialEditorStateString(value),
    [value],
  );

  const initialConfig = useMemo(
    () => ({
      namespace: "recipe-instructions",
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
        heading: {
          h1: "text-2xl font-bold mb-3",
          h2: "text-xl font-bold mb-2",
          h3: "text-lg font-bold mb-2",
        },
        quote: "border-l-4 border-gray-300 pl-4 italic text-gray-600",
        code: "bg-gray-100 px-1 py-0.5 rounded text-sm font-mono",
        codeHighlight: {
          atrule: "text-purple-600",
          attr: "text-blue-600",
          boolean: "text-red-600",
          builtin: "text-purple-600",
          cdata: "text-gray-600",
          char: "text-green-600",
          class: "text-blue-600",
          "class-name": "text-blue-600",
          comment: "text-gray-500",
          constant: "text-red-600",
          deleted: "text-red-600",
          doctype: "text-gray-600",
          entity: "text-orange-600",
          function: "text-blue-600",
          important: "text-red-600",
          inserted: "text-green-600",
          keyword: "text-purple-600",
          namespace: "text-blue-600",
          number: "text-red-600",
          operator: "text-gray-800",
          prolog: "text-gray-600",
          property: "text-blue-600",
          punctuation: "text-gray-800",
          regex: "text-green-600",
          selector: "text-green-600",
          string: "text-green-600",
          symbol: "text-red-600",
          tag: "text-red-600",
          url: "text-blue-600",
          variable: "text-orange-600",
        },
        table: "border-collapse border border-gray-300",
        tableCell: "border border-gray-300 px-2 py-1 min-w-16",
        tableCellHeader: "border border-gray-300 px-2 py-1 bg-gray-100 font-semibold",
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
    <div
      className={
        "relative border rounded-md bg-background " +
        (className || "")
      }
    >
      <LexicalComposer initialConfig={initialConfig}>
        <TextFormattingToolbar />
        <TableToolbar />
        <div className="px-3 py-2">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-[160px] outline-none text-sm leading-6" />
            }
            placeholder={<Placeholder text={placeholder} />}
            ErrorBoundary={() => (
              <div className="text-red-500">
                An error occurred while rendering the editor.
              </div>
            )}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <TablePlugin hasCellMerge={true} hasCellBackgroundColor={false} />
        <AutoFocusPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <OnChangePlugin onChange={handleChange} ignoreSelectionChange={true} />
      </LexicalComposer>
    </div>
  );
}
