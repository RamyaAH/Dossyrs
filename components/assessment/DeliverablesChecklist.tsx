"use client";

// Purely presentational — reflects completion state already computed by
// the parent scenario component (same MIN_ANSWER_LENGTH gate used for
// canSubmit). No new event, no payload field, no server round-trip.
export function DeliverablesChecklist({
  items,
}: {
  items: { label: string; done: boolean }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            item.done
              ? "border-brand-bg bg-brand-bg text-brand-dark"
              : "border-border text-muted"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${item.done ? "bg-brand" : "bg-border"}`}
          />
          {item.label}
        </span>
      ))}
    </div>
  );
}
