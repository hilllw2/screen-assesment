import { AntiCheatLayer } from "@/components/test/AntiCheatLayer";

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AntiCheatLayer>
      {children}
    </AntiCheatLayer>
  );
}
