/**
 * Shares text using the native share sheet on mobile, or copies to clipboard on desktop.
 * Returns true if the share/copy was successful.
 */
export async function shareOrCopy(text: string): Promise<boolean> {
  // Use native share on mobile if available
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch (err) {
      // User cancelled or share failed — fall through to clipboard
      if (err instanceof Error && err.name === "AbortError") return false;
    }
  }

  // Clipboard API
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers that block clipboard API
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  }
}
