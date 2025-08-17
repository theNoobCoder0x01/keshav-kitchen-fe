"use client";

import { useState } from "react";
import { LexicalEditor } from "./lexical-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LexicalEditorDemo() {
  const [value, setValue] = useState<string>("");

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Enhanced Lexical Editor with Table Support</CardTitle>
        <CardDescription>
          Paste tables from Excel or Google Sheets, use text formatting, and manage tables with the toolbar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <h4 className="font-medium mb-2">Features:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Table Support:</strong> Paste tables from Excel/Google Sheets - they'll automatically render as HTML tables</li>
              <li><strong>Text Formatting:</strong> Use the toolbar for bold, italic, underline, headings, lists, links, and code</li>
              <li><strong>Table Toolbar:</strong> When you select a table cell, additional table controls will appear</li>
              <li><strong>Markdown Shortcuts:</strong> Use markdown syntax (e.g., **bold**, *italic*, # heading)</li>
            </ul>
          </div>
          
          <LexicalEditor
            value={value}
            onChange={setValue}
            placeholder="Try pasting a table from Excel or Google Sheets, or type some text..."
            className="min-h-[400px]"
          />
          
          <div className="text-xs text-muted-foreground">
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Copy a table from Excel/Sheets and paste it here</li>
              <li>Click on a table cell to see table editing options</li>
              <li>Use the text formatting toolbar for rich text editing</li>
              <li>Try markdown shortcuts like **bold** or ## heading</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}