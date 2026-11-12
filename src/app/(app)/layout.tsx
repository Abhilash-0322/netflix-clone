import { requireProfile } from "@/lib/auth";
import { getMyListIds } from "@/lib/data";
import { MyListProvider } from "@/components/MyListProvider";
import { Navbar } from "@/components/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireProfile();
  const myListIds = await getMyListIds(profile.id);

  return (
    <MyListProvider initialIds={myListIds}>
      <Navbar profile={profile} />
      <main className="min-h-screen pb-20">{children}</main>
    </MyListProvider>
  );
}
