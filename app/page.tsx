import { redirect } from "next/navigation";

/**
 * Root page — redirect to dashboard if authenticated (handled by middleware),
 * or to login if not.
 */
export default function RootPage() {
  redirect("/dashboard");
}
