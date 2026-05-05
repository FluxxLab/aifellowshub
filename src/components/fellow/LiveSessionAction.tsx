"use client";
import React, { useState } from "react";
import dynamic from "next/dynamic";
import Button from "@/components/ui/button/Button";
import { CheckLineIcon } from "@/icons";
import { toast } from "@/lib/toast";
import type { ModuleSession } from "@/lib/api/fellow-learning";

const ZoomMeetingRoom = dynamic(
  () => import("@/components/fellow/ZoomMeetingRoom"),
  { ssr: false, loading: () => <p className="text-sm text-gray-500">Loading meeting…</p> },
);

/**
 * Client-side session controls. Handles RSVP, in-app meeting embed, and
 * the external-link fallback. The Zoom Component View embed is rendered
 * full-screen via a fixed overlay so it has the room it needs without
 * fighting the existing card layout.
 *
 * Renders nothing for "ended"/"cancelled" — the parent SessionCard surfaces
 * the appropriate "no recording" copy in those states.
 */
export default function LiveSessionAction({
  session: s,
}: {
  session: ModuleSession;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rsvpd, setRsvpd] = useState(s.rsvpd);

  async function rsvp() {
    if (!s.id) {
      // Mock-only session — RSVP isn't wired to a real backend, just toggle UI.
      setRsvpd(true);
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(`/api/sessions/${encodeURIComponent(s.id)}/rsvp`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const body = (await r.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `RSVP failed (${r.status})`);
      }
      setRsvpd(true);
      toast.success("RSVP confirmed");
    } catch (e) {
      toast.errorFromException("Couldn't RSVP", e);
    }
    setBusy(false);
  }

  // Live: prefer in-app embed when we have a real session id (real backend
  // path); fall back to the external join URL for mock data.
  if (s.status === "live") {
    if (s.id) {
      return (
        <>
          <Button
            size="sm"
            variant="fellowship"
            className="w-full"
            onClick={() => setOpen(true)}
          >
            Join in app
          </Button>
          {open && (
            <div className="fixed inset-0 z-99999 flex flex-col bg-gray-900/95 p-4 sm:p-6">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-3">
                <div className="flex items-center justify-between text-white">
                  <h2 className="text-base font-semibold">Live session</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Close
                  </Button>
                </div>
                <ZoomMeetingRoom
                  sessionId={s.id}
                  onLeave={() => setOpen(false)}
                />
              </div>
            </div>
          )}
        </>
      );
    }
    return (
      <a
        href={s.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button size="sm" variant="fellowship" className="w-full">
          Join on Zoom
        </Button>
      </a>
    );
  }

  if (s.status === "upcoming") {
    return rsvpd ? (
      <Button size="sm" variant="outline" className="w-full" disabled={busy}>
        <CheckLineIcon className="h-3.5 w-3.5" />
        RSVP&apos;d · Add to calendar
      </Button>
    ) : (
      <>
        <Button
          size="sm"
          variant="primary"
          className="w-full"
          onClick={rsvp}
          disabled={busy}
        >
          {busy ? "Saving…" : "RSVP"}
        </Button>
      </>
    );
  }

  return null;
}
