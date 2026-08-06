"use client";

import React from "react";

// Minimal, dependency-free Markdown renderer tuned for the AI consultant output
// (headings, bold, bullet lists, and "- [ ]" checkboxes). Not a full parser —
// intentionally small and safe (no raw HTML injection).
export function Markdown({
  content,
  onContentChange,
}: {
  content: string;
  onContentChange?: (newContent: string) => void;
}) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  let listIsCheckbox = false;

  const handleCheckboxToggle = (lineIdx: number, currentChecked: boolean) => {
    if (!onContentChange) return;
    const newLines = [...lines];
    const targetLine = newLines[lineIdx];
    if (currentChecked) {
      // Uncheck it
      newLines[lineIdx] = targetLine.replace(/\[(x|X)\]/, "[ ]");
    } else {
      // Check it
      newLines[lineIdx] = targetLine.replace(/\[ \]/, "[x]");
    }
    onContentChange(newLines.join("\n"));
  };

  const flushList = (key: string) => {
    if (list.length) {
      blocks.push(
        <ul key={key} className={listIsCheckbox ? "space-y-1.5" : undefined}>
          {list}
        </ul>
      );
      list = [];
      listIsCheckbox = false;
    }
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList(`l-${i}`);
      return;
    }

    const checkbox = line.match(/^\s*[-*]\s+\[( |x|X)\]\s+(.*)$/);
    if (checkbox) {
      listIsCheckbox = true;
      const isChecked = checkbox[1].toLowerCase() === "x";
      list.push(
        <li key={`cb-${i}`} className="checkbox-item flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() => handleCheckboxToggle(i, isChecked)}
            className="mt-1 h-4 w-4 cursor-pointer rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={isChecked ? "line-through text-zinc-400 transition-all" : "text-zinc-800"}>
            {inline(checkbox[2])}
          </span>
        </li>
      );
      return;
    }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    if (bullet) {
      list.push(<li key={`b-${i}`}>{inline(bullet[1])}</li>);
      return;
    }

    flushList(`l-${i}`);

    const h = line.match(/^(#{1,3})\s+(.*)$/);
    if (h) {
      const level = h[1].length;
      const text = inline(h[2]);
      if (level === 1) blocks.push(<h1 key={`h1-${i}`}>{text}</h1>);
      else if (level === 2) blocks.push(<h2 key={`h2-${i}`}>{text}</h2>);
      else blocks.push(<h3 key={`h3-${i}`}>{text}</h3>);
      return;
    }

    blocks.push(<p key={`p-${i}`}>{inline(line)}</p>);
  });
  flushList("l-final");

  return <div className="prose-ai text-[15px] text-ink-800">{blocks}</div>;
}

// Inline formatting: **bold** and `code`.
function inline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = regex.exec(text))) {
    if (m.index > last) {
      parts.push(
        <React.Fragment key={`txt-${key++}`}>
          {text.slice(last, m.index)}
        </React.Fragment>
      );
    }
    if (m[2]) {
      parts.push(<strong key={`b-${key++}`}>{m[2]}</strong>);
    } else if (m[3]) {
      parts.push(<code key={`c-${key++}`}>{m[3]}</code>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    parts.push(
      <React.Fragment key={`txt-${key++}`}>
        {text.slice(last)}
      </React.Fragment>
    );
  }
  return parts;
}
