"use client";
import React, { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/button/Button";
import { CheckLineIcon } from "@/icons";
import { toast } from "@/lib/toast";
import type { ModuleSession } from "@/lib/api/fellow-learning";

/**
 * Client-side session controls. Handles registration, in-app meeting redirect, and
 * the external-link fallback.
 */
export default function LiveSessionAction({
  session: s,
}: {
  session: ModuleSession;
}) {
  const [busy, setBusy] = useState(false);
  const [rsvpd, setRsvpd] = useState(s.rsvpd);

  async function rsvp() {
    if (!s.id) {
      // Mock-only session — registration isn't wired to a real backend, just toggle UI.
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
        throw new Error(body.message ?? `Registration failed (${r.status})`);
      }
      setRsvpd(true);
      toast.success("Registered", "You'll get a reminder before the session.");
    } catch (e) {
      toast.errorFromException("Couldn't register", e);
    }
    setBusy(false);
  }

  // Live: prefer in-app embed when we have a real session id (real backend
  // path); fall back to the external join URL for mock data without an id.
  if (s.status === "live") {
    if (s.id) {
      return (
        <Link href={`/my-sessions/${s.id}`} className="block">
          <Button
            size="sm"
            variant="fellowship"
            className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
          >
            Join in app
          </Button>
        </Link>
      );
    }
    return (
      <a
        href={s.joinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <Button
          size="sm"
          variant="fellowship"
          className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
        >
          Join on Zoom
        </Button>
      </a>
    );
  }

  if (s.status === "upcoming") {
    if (rsvpd) {
      const hasJoinUrl = s.joinUrl && s.joinUrl !== "#";
      if (s.id) {
        return (
          <div className="flex flex-col gap-2">
            <Link href={`/my-sessions/${s.id}`} className="block">
              <Button
                size="sm"
                variant="fellowship"
                className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
              >
                Join in app
              </Button>
            </Link>
            <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-success-700">
              <CheckLineIcon className="h-3.5 w-3.5" />
              You're registered
            </p>
          </div>
        );
      }
      return (
        <div className="flex flex-col gap-2">
          {hasJoinUrl ? (
            <a
              href={s.joinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button
                size="sm"
                variant="fellowship"
                className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
              >
                Join session
              </Button>
            </a>
          ) : (
            <Button size="sm" variant="outline" className="w-full" disabled>
              Join link coming soon
            </Button>
          )}
          <p className="flex items-center justify-center gap-1.5 text-xs font-medium text-success-700">
            <CheckLineIcon className="h-3.5 w-3.5" />
            You're registered
          </p>
        </div>
      );
    }
    return (
      <Button
        size="sm"
        variant="primary"
        className="w-full bg-fellowship-navy! text-white! hover:bg-fellowship-navy-dark!"
        onClick={rsvp}
        disabled={busy}
      >
        {busy ? "Saving…" : "Register"}
      </Button>
    );
  }

  return null;
}
