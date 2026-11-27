"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Table as TableIcon,
  Underline,
  X,
} from "lucide-react";
import { cn, wordCountFromHtml } from "@/lib/utils";

type ActivePanel = "link" | "image" | "table" | null;

async function fileToCompressedDataUrl(file: File): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Gagal membaca gambar"));
    reader.readAsDataURL(file);
  });

  if (file.size <= 300 * 1024) return raw;

  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const maxW = 960;
      const scale = img.width > maxW ? maxW / img.width : 1;
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(raw);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => resolve(raw);
    img.src = raw;
  });
}

export function RichTextEditor({
  label,
  required,
  hint,
  placeholder = "Mulai mengetik di sini...",
  value,
  onChange,
  minHeight = 190,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (html: string) => void;
  minHeight?: number;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const imageFileRef = useRef<HTMLInputElement>(null);
  const [panel, setPanel] = useState<ActivePanel>(null);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const [imageUrl, setImageUrl] = useState("https://");
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  function sync() {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML === "<br>" ? "" : el.innerHTML;
    onChange(html);
  }

  function exec(command: string, commandVal?: string) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, commandVal);
    sync();
  }

  function insertLink() {
    const cleanUrl = linkUrl.trim();
    if (!cleanUrl || cleanUrl === "https://") return;
    const safeHref = /^https?:\/\//i.test(cleanUrl) ? cleanUrl : `https://${cleanUrl}`;
    const labelText = linkText.trim() || safeHref;
    exec(
      "insertHTML",
      `<a href="${safeHref.replace(/"/g, "&quot;")}" target="_blank" rel="noopener noreferrer">${labelText.replace(/</g, "&lt;")}</a>&nbsp;`,
    );
    setLinkUrl("https://");
    setLinkText("");
    setPanel(null);
  }

  function insertImageByUrl() {
    const clean = imageUrl.trim();
    if (!clean || clean === "https://") return;
    exec("insertHTML", `<img src="${clean.replace(/"/g, "&quot;")}" alt="Gambar ilustrasi essay" /><p></p>`);
    setImageUrl("https://");
    setPanel(null);
  }

  async function onPickImageFile(file: File) {
    const dataUrl = await fileToCompressedDataUrl(file);
    exec("insertHTML", `<img src="${dataUrl}" alt="${file.name.replace(/"/g, "")}" /><p></p>`);
    setPanel(null);
  }

  function insertTable() {
    const r = Math.min(8, Math.max(2, tableRows));
    const c = Math.min(6, Math.max(2, tableCols));
    let html = "<table><thead><tr>";
    for (let j = 0; j < c; j++) {
      html += `<th>Kolom ${j + 1}</th>`;
    }
    html += "</tr></thead><tbody>";
    for (let i = 1; i < r; i++) {
      html += "<tr>";
      for (let j = 0; j < c; j++) {
        html += "<td>Isi data</td>";
      }
      html += "</tr>";
    }
    html += "</tbody></table><p></p>";
    exec("insertHTML", html);
    setPanel(null);
  }

  const words = wordCountFromHtml(value);

  const btnCls =
    "flex size-8 items-center justify-center rounded-lg text-ink/80 transition-colors hover:bg-forest-100 hover:text-forest-950";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="label !mb-0">
          {label} {required ? <span className="text-red-700">*</span> : <span className="font-normal text-muted">(opsional)</span>}
        </label>
        <span className="font-mono text-[11px] font-semibold text-muted">{words} kata</span>
      </div>

      {hint && <p className="text-xs text-muted">{hint}</p>}

      <div className="overflow-hidden rounded-xl border border-line-strong bg-sheet transition-colors focus-within:border-forest-700 focus-within:ring-2 focus-within:ring-forest-700/15">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-paper/90 px-2 py-1.5">
          <button type="button" onClick={() => exec("formatBlock", "P")} className={btnCls} title="Paragraf Normal">
            <Pilcrow className="size-4" />
          </button>
          <button type="button" onClick={() => exec("formatBlock", "H2")} className={btnCls} title="Heading 2">
            <Heading2 className="size-4" />
          </button>
          <button type="button" onClick={() => exec("formatBlock", "H3")} className={btnCls} title="Heading 3">
            <Heading3 className="size-4" />
          </button>

          <span className="mx-1 h-4 w-px bg-line-strong" />

          <button type="button" onClick={() => exec("bold")} className={btnCls} title="Tebal (Bold)">
            <Bold className="size-4" />
          </button>
          <button type="button" onClick={() => exec("italic")} className={btnCls} title="Miring (Italic)">
            <Italic className="size-4" />
          </button>
          <button type="button" onClick={() => exec("underline")} className={btnCls} title="Garis Bawah">
            <Underline className="size-4" />
          </button>

          <span className="mx-1 h-4 w-px bg-line-strong" />

          <button type="button" onClick={() => exec("insertUnorderedList")} className={btnCls} title="Bullet List">
            <List className="size-4" />
          </button>
          <button type="button" onClick={() => exec("insertOrderedList")} className={btnCls} title="Daftar Bernomor">
            <ListOrdered className="size-4" />
          </button>
          <button type="button" onClick={() => exec("formatBlock", "BLOCKQUOTE")} className={btnCls} title="Kutipan">
            <Quote className="size-4" />
          </button>

          <span className="mx-1 h-4 w-px bg-line-strong" />

          <button
            type="button"
            onClick={() => setPanel(panel === "table" ? null : "table")}
            className={cn(btnCls, panel === "table" && "bg-forest-950 text-gold-300")}
            title="Sisipkan Tabel"
          >
            <TableIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === "image" ? null : "image")}
            className={cn(btnCls, panel === "image" && "bg-forest-950 text-gold-300")}
            title="Sisipkan Gambar"
          >
            <ImageIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => setPanel(panel === "link" ? null : "link")}
            className={cn(btnCls, panel === "link" && "bg-forest-950 text-gold-300")}
            title="Sisipkan Tautan"
          >
            <LinkIcon className="size-4" />
          </button>
        </div>

        {/* Panel Bantu Sisipkan Tabel / Gambar / Tautan */}
        {panel === "link" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-gold-50/70 px-3 py-2 text-xs">
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="Teks tautan (opsional)"
              className="input !min-h-8 flex-1 bg-white !py-1 text-xs"
            />
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://contoh.ac.id/referensi"
              className="input !min-h-8 flex-1 bg-white !py-1 text-xs"
            />
            <button type="button" onClick={insertLink} className="btn btn-primary btn-sm">
              Sisipkan
            </button>
            <button type="button" onClick={() => setPanel(null)} className="p-1 text-muted hover:text-ink" aria-label="Tutup">
              <X className="size-4" />
            </button>
          </div>
        )}

        {panel === "image" && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-gold-50/70 px-3 py-2 text-xs">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Tempel URL gambar (https://...)"
              className="input !min-h-8 flex-1 bg-white !py-1 text-xs"
            />
            <button type="button" onClick={insertImageByUrl} className="btn btn-primary btn-sm">
              Dari URL
            </button>
            <button type="button" onClick={() => imageFileRef.current?.click()} className="btn btn-outline btn-sm bg-white">
              Pilih dari Perangkat
            </button>
            <input
              ref={imageFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onPickImageFile(f);
                e.target.value = "";
              }}
            />
            <button type="button" onClick={() => setPanel(null)} className="p-1 text-muted hover:text-ink" aria-label="Tutup">
              <X className="size-4" />
            </button>
          </div>
        )}

        {panel === "table" && (
          <div className="flex flex-wrap items-center gap-3 border-b border-line bg-gold-50/70 px-3 py-2 text-xs">
            <label className="flex items-center gap-1.5 font-semibold text-forest-950">
              Baris:
              <input
                type="number"
                min={2}
                max={8}
                value={tableRows}
                onChange={(e) => setTableRows(Number(e.target.value))}
                className="input !min-h-8 w-16 bg-white !py-1 text-center font-mono text-xs"
              />
            </label>
            <label className="flex items-center gap-1.5 font-semibold text-forest-950">
              Kolom:
              <input
                type="number"
                min={2}
                max={6}
                value={tableCols}
                onChange={(e) => setTableCols(Number(e.target.value))}
                className="input !min-h-8 w-16 bg-white !py-1 text-center font-mono text-xs"
              />
            </label>
            <button type="button" onClick={insertTable} className="btn btn-primary btn-sm">
              Sisipkan Tabel
            </button>
            <button type="button" onClick={() => setPanel(null)} className="ml-auto p-1 text-muted hover:text-ink" aria-label="Tutup">
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Editable Surface */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={sync}
          onBlur={sync}
          data-placeholder={placeholder}
          style={{ minHeight }}
          className="rich-content px-4 py-3.5 outline-none"
        />
      </div>
    </div>
  );
}
