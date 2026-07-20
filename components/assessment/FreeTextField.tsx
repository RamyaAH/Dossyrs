"use client";

export function FreeTextField({
  label,
  placeholder,
  value,
  onChange,
  onPaste,
  onBlur,
  minRows = 4,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onPaste: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onBlur: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
  minRows?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-ink">{label}</span>
      <textarea
        className="rounded-md border border-border bg-surface p-3 text-sm text-ink outline-none focus:border-brand"
        rows={minRows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste}
        onBlur={onBlur}
      />
    </label>
  );
}
