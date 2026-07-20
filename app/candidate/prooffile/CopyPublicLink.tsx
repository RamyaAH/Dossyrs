"use client";

import { useState } from "react";

export function CopyPublicLink({ assessmentId }: { assessmentId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/prooffile/${assessmentId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button type="button" className="btn-secondary" onClick={handleCopy}>
      {copied ? "Link copied!" : "Copy shareable link"}
    </button>
  );
}
