import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Icon } from "@/components/icons";
import { primaryNav, secondaryNav, mobileNav } from "@/lib/nav-config";

export default async function MorePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const inBottomBar = new Set(mobileNav.map((i) => i.href));
  const items = [...primaryNav, ...secondaryNav].filter((i) => !inBottomBar.has(i.href));

  return (
    <div className="mx-auto max-w-md pb-6">
      <div className="mb-6">
        <p className="eyebrow mb-1">Menu</p>
        <h1 className="font-display text-2xl font-bold text-paper">More</h1>
      </div>

      <div className="card divide-y divide-line p-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-3.5 text-sm text-paper-dim transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-ink-700 hover:text-paper"
          >
            <Icon name={item.icon} width={18} height={18} className="text-paper-faint" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
