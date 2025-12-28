import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export default function ProfileCompletion() {
  const progress = 75;

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-orange-50 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-orange-900">
          Complete seu perfil para receber mais convites
        </p>
        <div className="mt-2">
          <Progress value={progress} />
          <p className="mt-1 text-xs text-orange-800">{progress}% completo</p>
        </div>
      </div>

      <Button className="bg-orange-500 hover:bg-orange-600">
        Completar Perfil
      </Button>
    </div>
  );
}
