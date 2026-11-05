/**
 * renderMarkdown — lightweight inline markdown renderer.
 * Supports: **bold**, *italic*, `code`, newlines, horizontal rules (---).
 * Returns an array of React nodes safe to embed inside any element.
 */
import React from "react";

/**
 * Parse a single line into React nodes handling **bold**, *italic*, `code`.
 */
function parseLine(line: string, lineKey: number): React.ReactNode {
  // Regex captures: **bold**, *italic*, `code`, or plain text
  const TOKEN_RE = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_RE.exec(line)) !== null) {
    // Push any plain text before this token
    if (match.index > lastIndex) {
      nodes.push(line.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      nodes.push(<strong key={`b-${lineKey}-${match.index}`} className="font-bold text-navy-950">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      // *italic*
      nodes.push(<em key={`i-${lineKey}-${match.index}`} className="italic text-navy-800">{match[3]}</em>);
    } else if (match[4] !== undefined) {
      // `code`
      nodes.push(
        <code
          key={`c-${lineKey}-${match.index}`}
          className="rounded bg-gray-100 px-1 py-0.5 text-xs font-mono text-gray-800"
        >
          {match[4]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining plain text after last token
  if (lastIndex < line.length) {
    nodes.push(line.slice(lastIndex));
  }

  return nodes.length === 1 ? nodes[0] : nodes;
}

/**
 * Render a full markdown string into React elements.
 * Handles block-level: horizontal rules (---), blank lines, ordered/unordered lists, and inline tokens.
 */
export function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  function flushList() {
    if (listBuffer.length === 0) return;
    const Tag = listType === "ol" ? "ol" : "ul";
    elements.push(
      <Tag
        key={`list-${elements.length}`}
        className={Tag === "ol" ? "list-decimal pl-5 space-y-1" : "list-disc pl-5 space-y-1"}
      >
        {listBuffer}
      </Tag>
    );
    listBuffer = [];
    listType = null;
  }

  lines.forEach((line, idx) => {
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      flushList();
      elements.push(<hr key={`hr-${idx}`} className="my-2 border-gray-200" />);
      return;
    }

    // Blockquote: "> "
    if (line.trim().startsWith(">")) {
      flushList();
      const quoteText = line.trim().replace(/^>\s*/, "");
      elements.push(
        <blockquote
          key={`quote-${idx}`}
          className="border-l-4 border-navy-300 bg-navy-50/50 pl-3 py-1 my-1 italic text-navy-800 text-xs rounded-r"
        >
          {parseLine(quoteText, idx)}
        </blockquote>
      );
      return;
    }

    // Unordered list item: "- " or "* " (not bold)
    const ulMatch = line.match(/^(\s*)[*-] (.+)/);
    if (ulMatch && !line.startsWith("**")) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listBuffer.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {parseLine(ulMatch[2], idx)}
        </li>
      );
      return;
    }

    // Ordered list item: "1. " etc.
    const olMatch = line.match(/^\s*\d+\.\s(.+)/);
    if (olMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listBuffer.push(
        <li key={`li-${idx}`} className="leading-relaxed">
          {parseLine(olMatch[1], idx)}
        </li>
      );
      return;
    }

    // Blank line — flush list, add spacing paragraph
    if (line.trim() === "") {
      flushList();
      elements.push(<span key={`br-${idx}`} className="block h-2" />);
      return;
    }

    // Regular paragraph line
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {parseLine(line, idx)}
      </p>
    );
  });

  flushList();
  return <>{elements}</>;
}

