import { hintsRedirect } from "@/lib/hints/page-helpers";

export const dynamic = "force-dynamic";

export default function HintsTodayPage() {
  hintsRedirect("word-bloom");
}
