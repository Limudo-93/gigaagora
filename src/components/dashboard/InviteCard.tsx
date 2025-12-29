"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, DollarSign } from "lucide-react";

export default function InviteCard({ invite, onAccept, onDecline, onDetails }: any) {
  const gig = invite.gig;

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{gig.genre}</Badge>
          <Badge variant="secondary">{gig.type}</Badge>
        </div>

        <Badge className="bg-amber-500 text-white">
          48h
        </Badge>
      </div>

      <p className="mt-3 text-base font-semibold">
        {gig.city}, {gig.state}
      </p>

      <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar size={14} /> {gig.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} /> {gig.time}
        </span>
        <span className="flex items-center gap-1">
          <DollarSign size={14} /> {gig.fee}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onAccept}>Aceitar</Button>
        <Button variant="outline" onClick={onDecline}>
          Recusar
        </Button>
        <Button variant="ghost" onClick={onDetails}>
          Ver Detalhes
        </Button>
      </div>
    </div>
  );
}
