"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Star, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileCard({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("display_name, photo_url, city, state")
        .eq("user_id", user.id)
        .single();

      setProfile(profileData);

      // Load badges
      const { data: badgesData } = await supabase
        .from("user_badges")
        .select("badge_type, earned_at, expires_at")
        .eq("user_id", user.id)
        .or("expires_at.is.null,expires_at.gt.now()");

      setBadges(badgesData || []);

      // Load ratings
      const { data: ratingsData } = await supabase
        .from("ratings")
        .select("rating, rated_type, musician_id, contractor_id")
        .eq("is_public", true)
        .or(`musician_id.eq.${user.id},contractor_id.eq.${user.id}`);

      if (ratingsData && ratingsData.length > 0) {
        const userRatings = ratingsData.filter((r: any) => {
          if (r.rated_type === "musician" && r.musician_id === user.id)
            return true;
          if (r.rated_type === "contractor" && r.contractor_id === user.id)
            return true;
          return false;
        });

        if (userRatings.length > 0) {
          const sum = userRatings.reduce(
            (acc: number, r: any) => acc + (r.rating || 0),
            0
          );
          setAvgRating(sum / userRatings.length);
          setRatingCount(userRatings.length);
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-2 animate-pulse">
        <CardContent className="p-6">
          <div className="h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const displayName =
    profile?.display_name || "Usuário";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const location =
    profile?.city && profile?.state
      ? `${profile.city}, ${profile.state}`
      : profile?.city || profile?.state || null;

  const badgeLabels: Record<string, string> = {
    verified: "Verificado",
    active: "Ativo",
    top_rated: "Top Avaliado",
    reliable: "Confiável",
    popular: "Popular",
  };

  return (
    <Card className="border-2 bg-gradient-to-br from-background to-muted/20 backdrop-blur-xl shadow-lg">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-lg" />
            <Avatar className="relative h-16 w-16 md:h-20 md:w-20 ring-4 ring-background shadow-lg">
              <AvatarImage src={profile?.photo_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-bold text-foreground truncate">
                  {displayName}
                </h3>
                {badges.some((b) => b.badge_type === "verified") && (
                  <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                )}
              </div>
              {location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              )}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.slice(0, 4).map((badge, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="text-xs font-medium"
                  >
                    {badgeLabels[badge.badge_type] || badge.badge_type}
                  </Badge>
                ))}
                {badges.length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{badges.length - 4}
                  </Badge>
                )}
              </div>
            )}

            {/* Rating */}
            {avgRating && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-semibold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-sm text-muted-foreground">
                  ({ratingCount} {ratingCount === 1 ? "avaliação" : "avaliações"})
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="w-full md:w-auto">
            <Button asChild variant="outline" className="w-full md:w-auto">
              <Link href={"/dashboard/perfil/edit" as any}>
                Editar Perfil
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
