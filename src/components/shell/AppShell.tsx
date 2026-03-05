'use client';

import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Navbar } from "@/components/navbar";

type AppShellProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  contextTitle?: string;
  roleLabel?: string;
};

export function AppShell({
  sidebar,
  children,
  contextTitle,
  roleLabel,
}: AppShellProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop grid shell */}
      <div className="hidden md:grid min-h-screen grid-cols-[260px_minmax(0,1fr)]">
        <aside className="border-r bg-muted/40">
          {sidebar}
        </aside>
        <div className="flex min-h-screen flex-col">
          <Navbar contextTitle={contextTitle} roleLabel={roleLabel} />
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-6 lg:px-8 lg:py-8">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout with drawer sidebar */}
      <div className="flex min-h-screen flex-col md:hidden">
        <Navbar
          contextTitle={contextTitle}
          roleLabel={roleLabel}
          leadingSlot={
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          }
        />
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4">
            {children}
          </div>
        </div>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="p-0 max-w-xs h-screen left-0 top-0 translate-x-0 translate-y-0 rounded-none border-r">
            <div className="h-full bg-background">
              {sidebar}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

