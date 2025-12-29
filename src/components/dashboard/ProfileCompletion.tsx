import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

function calculateProfileCompletion(
  profile: any,
  musicianProfile: any
): number {
  if (!profile) return 0;

  let completedFields = 0;
  let totalFields = 0;

  // Função auxiliar para verificar se um valor está preenchido
  const isFieldFilled = (value: any): boolean => {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "string") return value.trim() !== "";
    if (typeof value === "number") return value > 0;
    return Boolean(value);
  };

  // Campos básicos do perfil (sempre contam)
  const basicFields = [
    { value: profile.display_name, weight: 1 },
    { value: profile.phone_e164, weight: 1 },
    { value: profile.city, weight: 1 },
    { value: profile.state, weight: 1 },
    { value: profile.photo_url, weight: 1 },
  ];

  basicFields.forEach((field) => {
    totalFields += field.weight;
    if (isFieldFilled(field.value)) {
      completedFields += field.weight;
    }
  });

  // Campos do perfil de músico (sempre contam, mesmo se não houver perfil de músico)
  const musicianFields = [
    { 
      value: musicianProfile?.bio, 
      weight: 2,
      check: (v: any) => v && typeof v === "string" && v.trim() !== ""
    },
    { 
      value: musicianProfile?.instruments, 
      weight: 2,
      check: (v: any) => Array.isArray(v) && v.length > 0 && v.some((item: any) => item && String(item).trim() !== "")
    },
    { 
      value: musicianProfile?.genres, 
      weight: 1,
      check: (v: any) => Array.isArray(v) && v.length > 0 && v.some((item: any) => item && String(item).trim() !== "")
    },
    { 
      value: musicianProfile?.skills, 
      weight: 1,
      check: (v: any) => Array.isArray(v) && v.length > 0 && v.some((item: any) => item && String(item).trim() !== "")
    },
    { 
      value: musicianProfile?.setup, 
      weight: 1,
      check: (v: any) => Array.isArray(v) && v.length > 0 && v.some((item: any) => item && String(item).trim() !== "")
    },
    { 
      value: musicianProfile?.portfolio_links, 
      weight: 1,
      check: (v: any) => Array.isArray(v) && v.length > 0 && v.some((item: any) => item && String(item).trim() !== "")
    },
  ];

  musicianFields.forEach((field) => {
    totalFields += field.weight;
    const checkFn = field.check || isFieldFilled;
    if (checkFn(field.value)) {
      completedFields += field.weight;
    }
  });

  if (totalFields === 0) return 0;
  const percentage = Math.round((completedFields / totalFields) * 100);
  // Garantir que não ultrapasse 100%
  return Math.min(percentage, 100);
}

export default async function ProfileCompletion() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Buscar perfil básico
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    // Se não tem perfil, mostrar 0%
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-orange-50 border-orange-200 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 flex-1">
          <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-900">
              Complete seu perfil para receber mais convites
            </p>
            <div className="mt-2">
              <div className="w-full h-2.5 bg-orange-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
                  style={{ width: "0%" }}
                />
              </div>
              <p className="mt-1.5 text-xs font-semibold text-orange-900">0% completo</p>
            </div>
          </div>
        </div>
        <Button
          className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
          asChild
        >
          <Link href={"/dashboard/perfil/edit" as any}>Completar Perfil</Link>
        </Button>
      </div>
    );
  }

  // Buscar perfil de músico (todos os usuários têm perfil de músico)
  const { data: musicianProfile } = await supabase
    .from("musician_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const progress = calculateProfileCompletion(profile, musicianProfile);

  // Não mostrar se o perfil estiver 100% completo
  if (progress >= 100) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-orange-50 border-orange-200 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3 flex-1">
        <Info className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-900">
            Complete seu perfil para receber mais convites
          </p>
          <div className="mt-2">
            <div className="w-full h-2.5 bg-orange-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1.5 text-xs font-semibold text-orange-900">
              {progress}% completo
            </p>
          </div>
        </div>
      </div>

      <Button
        className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
        asChild
      >
        <Link href="/dashboard/perfil/edit">Completar Perfil</Link>
      </Button>
    </div>
  );
}
