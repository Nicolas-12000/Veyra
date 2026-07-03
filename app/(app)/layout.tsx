import { redirect } from "next/navigation";
import { requireUserId } from "@/src/modules/auth/server";
import { AppNav } from "@/src/modules/shared/AppNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireUserId();
  } catch {
    redirect("/login");
  }

  return (
    <div className="layout-app">
      <AppNav />
      <div className="main-content">
        {children}
      </div>
    </div>
  );
}
