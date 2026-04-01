import { redirect } from "next/navigation";

// Paywall disabled — all content is free (monetised via ads).
// Redirect anyone who hits an old /subscribe link.
export default function SubscribePage() {
  redirect("/");
}
