import { Scissors } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-muted/30">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Scissors className="h-8 w-8 text-primary" />
        <span className="text-2xl font-bold">ClipEngine</span>
      </Link>
      {children}
    </div>
  );
}
