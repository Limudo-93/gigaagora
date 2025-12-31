"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ForcePushRegisterButton from "@/components/push-notifications/ForcePushRegisterButton";
import { supabase } from "@/lib/supabase/client";

function ForcePushRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const targetUserId = searchParams?.get("userId");
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Verificar se o usuário está autorizado (pode ser o próprio usuário ou um admin)
      if (user && targetUserId) {
        setIsAuthorized(user.id === targetUserId); // Por enquanto, apenas o próprio usuário
      } else if (user && !targetUserId) {
        // Se não especificou userId, usar o próprio
        setIsAuthorized(true);
      }
    };
    getUser();
  }, [targetUserId]);

  const handleSuccess = () => {
    // Redirecionar de volta ao dashboard após 2 segundos
    setTimeout(() => {
      router.push("/dashboard");
    }, 2000);
  };

  if (!isAuthorized) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-900 mb-2">Não Autorizado</h2>
            <p className="text-red-700">
              Você só pode forçar o registro de notificações para sua própria conta.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const actualUserId = targetUserId || userId;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <ForcePushRegisterButton
          userId={actualUserId || ""}
          onSuccess={handleSuccess}
        />
      </div>
    </DashboardLayout>
  );
}

export default function ForcePushRegisterPage() {
  return (
    <Suspense fallback={
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </DashboardLayout>
    }>
      <ForcePushRegisterContent />
    </Suspense>
  );
}

