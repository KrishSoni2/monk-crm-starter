"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggleButton } from "@/components/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/modules";

// A floating control pill in the top-right corner instead of a full-width header bar.
// It rests as a single round button and slides open on hover or focus to show the
// theme toggle. No backdrop blur: it sits over scrolling tables, where blur is costly.
export function HeaderPill({ canSignOut }: { canSignOut: boolean }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initial = APP_NAME.trim().charAt(0).toUpperCase();

  return (
    <header
      className={cn(
        "group fixed top-4 right-6 z-30 hidden items-center justify-end gap-1.5 overflow-hidden rounded-full md:flex",
        "border border-border/70 bg-background/95 py-1.5 pr-1.5 pl-1.5 shadow-card",
        "transition-[width] duration-[240ms] hover:w-[6.25rem] focus-within:w-[6.25rem] motion-reduce:transition-none",
        menuOpen ? "w-[6.25rem]" : "w-[3.25rem]",
      )}
      style={{ transitionTimingFunction: "var(--ease-settle)" }}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-1 transition-[transform,opacity] duration-200",
          "translate-x-3 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
          "group-focus-within:translate-x-0 group-focus-within:opacity-100",
          menuOpen && "!translate-x-0 !opacity-100",
          "motion-reduce:translate-x-0 motion-reduce:transition-none",
        )}
        style={{ transitionTimingFunction: "var(--ease-settle)" }}
      >
        <ThemeToggleButton />
      </div>

      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative size-9 shrink-0 rounded-full p-0" aria-label="Account">
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-sm text-primary-foreground">{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm leading-none font-medium">{APP_NAME}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {canSignOut ? "Signed in with the team password" : "No password set"}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings className="mr-2 size-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          {canSignOut && (
            <>
              <DropdownMenuSeparator />
              <form action="/api/auth/logout" method="post">
                <DropdownMenuItem asChild>
                  <button type="submit" className="w-full">
                    <LogOut className="mr-2 size-4" />
                    Sign out
                  </button>
                </DropdownMenuItem>
              </form>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
