"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  Download,
  Filter,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";
import { Button, Card, Badge, EmptyState } from "@/components/ui";
import {
  DOCUMENT_TAGS,
  DOCUMENT_TAG_META,
  type DocumentTag,
} from "@/lib/constants";
import { formatBytes, formatDate, cn } from "@/lib/utils";
import type { TripDTO, DocumentDTO } from "@/lib/types";

export function DocumentsVault({ trip }: { trip: TripDTO }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTag, setUploadTag] = useState<DocumentTag>("FLIGHT");
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<DocumentTag | "ALL">("ALL");
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [previewDoc, setPreviewDoc] = useState<DocumentDTO | null>(null);

  const docs = trip.documents;

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const d of docs) c[d.tag] = (c[d.tag] ?? 0) + 1;
    return c;
  }, [docs]);

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      if (filter !== "ALL" && d.tag !== filter) return false;
      if (search && !d.originalName.toLowerCase().includes(search.toLowerCase()))
        return false;
      return true;
    });
  }, [docs, filter, search]);

  async function upload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("tag", uploadTag);
    Array.from(files).forEach((f) => fd.append("files", f));
    const res = await fetch(`/api/trips/${trip.id}/documents`, {
      method: "POST",
      body: fd,
    });
    setUploading(false);
    if (!res.ok) {
      const rawText = await res.text().catch(() => "");
      let errorMsg = rawText;
      if (rawText.startsWith("{")) {
        try {
          const j = JSON.parse(rawText);
          errorMsg = j.error || rawText;
        } catch {}
      } else {
        // If it's an HTML page (like 413 Payload Too Large or 500 error), extract the <title> or show a snippet
        const match = rawText.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (match) errorMsg = `HTML Error: ${match[1]}`;
        else errorMsg = `Raw Error: ${rawText.slice(0, 100)}`;
      }
      alert(`שגיאה בהעלאת המסמך (סטטוס ${res.status}): ${errorMsg || res.statusText}`);
    } else {
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
      {/* Upload + filter sidebar */}
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-ink-900">העלאת מסמכים</h3>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-500">
            תייג כ
          </label>
          <select
            value={uploadTag}
            onChange={(e) => setUploadTag(e.target.value as DocumentTag)}
            className="mb-3 w-full rounded-lg border border-ink-200 bg-white px-2 py-2 text-sm"
          >
            {DOCUMENT_TAGS.map((t) => (
              <option key={t} value={t}>
                {DOCUMENT_TAG_META[t].label}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg,.webp"
            className="hidden"
            onChange={(e) => upload(e.target.files)}
          />
          <Button
            className="w-full"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "מעלה ומחלץ..." : "בחר קבצים (PDF, Word, תמונות)"}
          </Button>
          <p className="mt-2 text-[11px] text-ink-400 leading-relaxed">
            העלה כרטיסים, אישורים, ויזות וקבצי Word/PDF. אישורי מלון וכרטיסי טיסה יקלטו ויפיקו נתונים אוטומטית בדף הלוגיסטיקה!
          </p>
        </Card>

        {/* Collapsible Tag Filter Card */}
        <Card className="p-3">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex w-full items-center justify-between text-sm font-bold text-ink-900"
          >
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-brand-600" />
              <span>סנן לפי תגית</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
                {filter === "ALL"
                  ? `כל המסמכים (${docs.length})`
                  : `${DOCUMENT_TAG_META[filter].label} (${counts[filter] ?? 0})`}
              </span>
            </div>
            <ChevronDown
              size={16}
              className={cn(
                "text-ink-400 transition-transform duration-200",
                filterOpen && "rotate-180"
              )}
            />
          </button>

          {filterOpen && (
            <div className="mt-3 space-y-1 border-t border-ink-100 pt-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <FilterRow
                label="כל המסמכים"
                count={docs.length}
                active={filter === "ALL"}
                onClick={() => {
                  setFilter("ALL");
                  setFilterOpen(false);
                }}
              />
              {DOCUMENT_TAGS.filter((t) => counts[t]).map((t) => (
                <FilterRow
                  key={t}
                  label={DOCUMENT_TAG_META[t].label}
                  count={counts[t] ?? 0}
                  active={filter === t}
                  onClick={() => {
                    setFilter(t);
                    setFilterOpen(false);
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Document grid */}
      <div>
        <input
          placeholder="חיפוש לפי שם קובץ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={36} />}
            title="אין מסמכים כאן"
            hint="העלה כרטיסי טיסה, אישורי מלון או ויזות לקליטה וצפייה מהירה."
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                onChange={() => router.refresh()}
                onPreview={() => setPreviewDoc(doc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}
    </div>
  );
}

function FilterRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm",
        active ? "bg-brand-50 font-semibold text-brand-700" : "text-ink-600 hover:bg-ink-50"
      )}
    >
      <span>{label}</span>
      <span className="text-xs text-ink-400">{count}</span>
    </button>
  );
}

function DocRow({
  doc,
  onChange,
  onPreview,
}: {
  doc: DocumentDTO;
  onChange: () => void;
  onPreview: () => void;
}) {
  const meta = DOCUMENT_TAG_META[doc.tag as DocumentTag] ?? DOCUMENT_TAG_META.OTHER;
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <Card className="flex items-center gap-3 p-3 transition-shadow hover:shadow-md">
      <span
        onClick={onPreview}
        className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-ink-100 text-ink-500 hover:bg-brand-100 hover:text-brand-600 transition-colors"
        title="לחץ לתצוגה מקדימה"
      >
        <FileText size={18} />
      </span>
      <div className="min-w-0 flex-1 cursor-pointer" onClick={onPreview}>
        <div className="truncate text-sm font-semibold text-ink-900 hover:text-brand-600 transition-colors">
          {doc.originalName}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <Badge className={meta.color}>{meta.label}</Badge>
          <span className="text-xs text-ink-400">
            {formatBytes(doc.sizeBytes)} · {formatDate(doc.uploadedAt)}
          </span>
        </div>
      </div>

      <button
        onClick={onPreview}
        className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 transition-colors"
        title="תצוגה מקדימה"
      >
        <Eye size={16} />
      </button>
      <a
        href={doc.fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        download={doc.originalName}
        className="rounded p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
        title="הורד קובץ"
      >
        <Download size={15} />
      </a>
      <button
        onClick={remove}
        disabled={deleting}
        className="rounded p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-500"
        title="מחק מסמך"
      >
        {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
    </Card>
  );
}

function DocumentPreviewModal({
  doc,
  onClose,
}: {
  doc: DocumentDTO;
  onClose: () => void;
}) {
  const meta = DOCUMENT_TAG_META[doc.tag as DocumentTag] ?? DOCUMENT_TAG_META.OTHER;
  const isImage = /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(doc.originalName) || doc.fileType.startsWith("image/");
  const isPdf = /\.pdf$/i.test(doc.originalName) || doc.fileType.includes("pdf");

  // Construct absolute URL for Google Docs Viewer if available
  const fullUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${doc.fileUrl}`
      : doc.fileUrl;

  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
    fullUrl
  )}&embedded=true`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="flex h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden relative" dir="rtl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5 bg-slate-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-bold text-base text-ink-900">{doc.originalName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge className={meta.color}>{meta.label}</Badge>
                <span className="text-xs text-ink-400">{formatBytes(doc.sizeBytes)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={doc.originalName}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Download size={14} />
              הורד מסמך
            </a>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-200 hover:text-ink-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.fileUrl}
              alt={doc.originalName}
              className="max-h-full max-w-full rounded-lg object-contain shadow-md"
            />
          ) : isPdf ? (
            <iframe
              src={doc.fileUrl}
              title={doc.originalName}
              className="h-full w-full rounded-lg border-0 bg-white shadow-sm"
            />
          ) : (
            // Fallback for Word / Office documents via Google Docs Viewer
            <iframe
              src={googleDocsViewerUrl}
              title={doc.originalName}
              className="h-full w-full rounded-lg border-0 bg-white shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}

