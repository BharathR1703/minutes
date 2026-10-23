import { redirect } from "next/navigation";
import { DEALS } from "@/lib/seed";

// /deal with no id is a dead end — land on the first (currently only) deal room.
export default function DealIndexPage() {
  redirect(`/deal/${DEALS[0].id}`);
}