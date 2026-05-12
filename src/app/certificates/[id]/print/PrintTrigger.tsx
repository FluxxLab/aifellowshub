"use client";
import { useEffect } from "react";

/**
 * Fires the browser's print dialog once the certificate canvas has had
 * a tick to paint. Without the small delay, decorative backgrounds and
 * the rosette occasionally render half-painted in the captured PDF.
 *
 * Triggers only once per mount — re-printing is a manual Ctrl/Cmd-P.
 */
export default function PrintTrigger() {
 useEffect(() => {
 const timeout = window.setTimeout(() => {
 window.print();
 }, 350);
 return () => window.clearTimeout(timeout);
 }, []);
 return null;
}
