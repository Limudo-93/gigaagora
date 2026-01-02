"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CollapsibleInfoCard({
  icon,
  title,
  description,
  defaultOpen = true,
  iconWrapperClassName,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  defaultOpen?: boolean;
  iconWrapperClassName?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card className="border border-white/60 bg-white/80 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                iconWrapperClassName || "bg-amber-100 text-amber-700"
              }`}
            >
              {icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              {description && open && (
                <p className="text-xs text-foreground/60">{description}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen((prev) => !prev)}
            aria-label={open ? "Ocultar card" : "Expandir card"}
          >
            {open ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
        {open && children ? <div className="mt-3">{children}</div> : null}
      </CardContent>
    </Card>
  );
}
