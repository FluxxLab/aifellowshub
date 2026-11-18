import { apiFetch } from "@/lib/api/client";
import { toast } from "@/lib/toast";

/**
 * Open a capstone's uploaded document in a new tab. Files are private in
 * storage, so each click asks the API for a short-lived link. Pass a capstone
 * id, or nothing for the signed-in fellow's own capstone.
 */
export async function openCapstoneDocument(capstoneId?: string): Promise<void> {
  // Open the tab during the click: browsers block one opened after an await.
  const tab = window.open("", "_blank");
  if (tab) tab.opener = null;
  const path = capstoneId
    ? `/capstones/${encodeURIComponent(capstoneId)}/download-url`
    : "/me/capstone/download-url";
  try {
    const { url } = await apiFetch<{ url: string }>(path);
    if (tab) tab.location.href = url;
    else window.location.assign(url);
  } catch (err) {
    tab?.close();
    toast.errorFromException("Couldn't open the document", err);
  }
}
