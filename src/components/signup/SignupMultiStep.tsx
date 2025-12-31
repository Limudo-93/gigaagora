"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase/client";
import { INSTRUMENT_OPTIONS } from "@/lib/instruments";
import {
  User,
  Mail,
  Lock,
  Camera,
  Music,
  MapPin,
  FileText,
  CheckCircle2,
  ArrowRight,
  Loader2,
  X,
  AlertCircle,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SignupData {
  // Etapa 1
  displayName: string;
  email: string;
  password: string;
  confirmPassword: string;
  
  // Etapa 2
  photoUrl: string | null;
  instrument: string;
  city: string;
  state: string;
  bio: string;
  cpf: string;
}

interface ValidationErrors {
  displayName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  instrument?: string;
  city?: string;
  state?: string;
  cpf?: string;
}

export default function SignupMultiStep({ referralCode }: { referralCode: string | null }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [data, setData] = useState<SignupData>({
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
    photoUrl: null,
    instrument: "",
    city: "",
    state: "",
    bio: "",
    cpf: "",
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Calcular progresso do perfil (Etapa 2)
  const calculateProfileProgress = () => {
    let completed = 0;
    let total = 5; // foto, instrumento, cidade, estado, bio
    
    if (data.photoUrl) completed++;
    if (data.instrument) completed++;
    if (data.city) completed++;
    if (data.state) completed++;
    if (data.bio) completed++;
    
    return Math.round((completed / total) * 100);
  };

  // Validações em tempo real
  const validateField = (name: keyof SignupData, value: string) => {
    const newErrors: ValidationErrors = { ...errors };

    switch (name) {
      case "displayName":
        if (!value.trim()) {
          newErrors.displayName = "Nome é obrigatório";
        } else if (value.trim().length < 2) {
          newErrors.displayName = "Nome deve ter pelo menos 2 caracteres";
        } else {
          delete newErrors.displayName;
        }
        break;

      case "email":
        if (!value.trim()) {
          newErrors.email = "Email é obrigatório";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Email inválido";
        } else {
          delete newErrors.email;
        }
        break;

      case "password":
        if (!value) {
          newErrors.password = "Senha é obrigatória";
        } else if (value.length < 6) {
          newErrors.password = "Senha deve ter no mínimo 6 caracteres";
        } else {
          delete newErrors.password;
        }
        // Revalidar confirmPassword se já foi tocado
        if (touched.confirmPassword) {
          if (value !== data.confirmPassword) {
            newErrors.confirmPassword = "As senhas não coincidem";
          } else {
            delete newErrors.confirmPassword;
          }
        }
        break;

      case "confirmPassword":
        if (!value) {
          newErrors.confirmPassword = "Confirme sua senha";
        } else if (value !== data.password) {
          newErrors.confirmPassword = "As senhas não coincidem";
        } else {
          delete newErrors.confirmPassword;
        }
        break;

      case "cpf":
        if (value && value.trim()) {
          const cpf = value.replace(/\D/g, "");
          if (cpf.length !== 11) {
            newErrors.cpf = "CPF deve ter 11 dígitos";
          } else if (!validateCPF(cpf)) {
            newErrors.cpf = "CPF inválido";
          } else {
            delete newErrors.cpf;
          }
        } else {
          delete newErrors.cpf;
        }
        break;
    }

    setErrors(newErrors);
  };

  // Validação de CPF
  const validateCPF = (cpf: string): boolean => {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    digit = 11 - (sum % 11);
    if (digit >= 10) digit = 0;
    if (digit !== parseInt(cpf.charAt(10))) return false;

    return true;
  };

  const handleChange = (name: keyof SignupData, value: string) => {
    setData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  // Upload de foto
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo e tamanho
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 5MB");
      return;
    }

    setUploadingPhoto(true);
    setError(null);

    try {
      // Se já tem userId, fazer upload direto
      if (userId) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("profile-photos")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(filePath);

        setData((prev) => ({ ...prev, photoUrl: publicUrl }));
      } else {
        // Se não tem userId ainda, salvar temporariamente (base64)
        const reader = new FileReader();
        reader.onloadend = () => {
          setData((prev) => ({ ...prev, photoUrl: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      setError("Erro ao fazer upload da foto. Tente novamente.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Etapa 1: Criar conta
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validar todos os campos
    const newErrors: ValidationErrors = {};
    if (!data.displayName.trim()) newErrors.displayName = "Nome é obrigatório";
    if (!data.email.trim()) newErrors.email = "Email é obrigatório";
    if (!data.password) newErrors.password = "Senha é obrigatória";
    if (!data.confirmPassword) newErrors.confirmPassword = "Confirme sua senha";
    if (data.password !== data.confirmPassword) {
      newErrors.confirmPassword = "As senhas não coincidem";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    try {
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          },
        },
      });

      if (signupError) {
        throw signupError;
      }

      if (!signupData.user) {
        throw new Error("Erro ao criar conta");
      }

      setUserId(signupData.user.id);

      // Criar perfil básico
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          user_id: signupData.user.id,
          user_type: "musician",
          display_name: data.displayName,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
        // Não bloqueia, continua
      }

      // Criar perfil de músico
      const { error: musicianError } = await supabase
        .from("musician_profiles")
        .insert({
          user_id: signupData.user.id,
          instruments: [],
          genres: [],
          skills: [],
          setup: [],
          portfolio_links: [],
        });

      if (musicianError) {
        console.error("Error creating musician profile:", musicianError);
        // Não bloqueia
      }

      // Registrar referral se houver
      if (referralCode && signupData.user.id) {
        try {
          await supabase.rpc("rpc_register_referral", {
            p_code: referralCode,
            p_referred_user_id: signupData.user.id,
            p_user_type: "musician",
          });
        } catch (refErr) {
          console.error("Error registering referral:", refErr);
        }
      }

      // Se tem foto temporária (base64), fazer upload agora
      if (data.photoUrl && data.photoUrl.startsWith("data:")) {
        try {
          // Converter base64 para blob e fazer upload
          const response = await fetch(data.photoUrl);
          const blob = await response.blob();
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
          
          const fileExt = "jpg";
          const fileName = `${signupData.user.id}-${Date.now()}.${fileExt}`;
          const filePath = `${signupData.user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("profile-photos")
            .upload(filePath, file, { upsert: true });

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("profile-photos")
              .getPublicUrl(filePath);
            setData((prev) => ({ ...prev, photoUrl: publicUrl }));
          }
        } catch (uploadErr) {
          console.error("Error uploading photo after signup:", uploadErr);
          // Não bloqueia, continua sem foto
        }
      }

      // Avançar para próxima etapa
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Etapa 2: Completar perfil
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const updates: any = {};

      if (data.photoUrl && !data.photoUrl.startsWith("data:")) {
        updates.photo_url = data.photoUrl;
      }

      if (data.city) updates.city = data.city;
      if (data.state) updates.state = data.state;

      // Atualizar perfil básico
      if (Object.keys(updates).length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("user_id", userId);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      // Atualizar perfil de músico
      const musicianUpdates: any = {};
      if (data.instrument) {
        musicianUpdates.instruments = [data.instrument];
      }
      if (data.bio) {
        musicianUpdates.bio = data.bio;
      }

      if (Object.keys(musicianUpdates).length > 0) {
        const { error: musicianError } = await supabase
          .from("musician_profiles")
          .update(musicianUpdates)
          .eq("user_id", userId);

        if (musicianError) {
          console.error("Error updating musician profile:", musicianError);
        }
      }

      // Se CPF foi preenchido, salvar (você pode criar uma tabela para isso ou adicionar ao perfil)
      if (data.cpf && validateCPF(data.cpf.replace(/\D/g, ""))) {
        // Por enquanto, vamos apenas marcar que o usuário preencheu o CPF
        // Você pode criar uma tabela de verificação ou adicionar ao perfil
        console.log("CPF fornecido:", data.cpf.replace(/\D/g, ""));
      }

      // Avançar para etapa 3
      setCurrentStep(3);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError("Erro ao salvar perfil. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Formatar CPF
  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const profileProgress = calculateProfileProgress();
  const isCPFProvided = data.cpf && data.cpf.replace(/\D/g, "").length === 11;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Indicador de etapas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step
                      ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] border-transparent text-white"
                      : "border-gray-300 bg-white text-gray-400"
                  }`}
                >
                  {currentStep > step ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{step}</span>
                  )}
                </div>
                {step < 3 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all duration-300 ${
                      currentStep > step
                        ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1]"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span className={currentStep >= 1 ? "font-semibold text-orange-600" : ""}>
            Criar Conta
          </span>
          <span className={currentStep >= 2 ? "font-semibold text-orange-600" : ""}>
            Completar Perfil
          </span>
          <span className={currentStep >= 3 ? "font-semibold text-orange-600" : ""}>
            Verificação
          </span>
        </div>
      </div>

      {/* Conteúdo das etapas */}
      <div className="rounded-2xl border border-white/20 backdrop-blur-xl bg-white/90 p-6 md:p-8 shadow-xl">
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-5 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] bg-clip-text text-transparent mb-2">
                Criar sua conta
              </h2>
              <p className="text-sm text-gray-600">
                Comece sua jornada musical hoje mesmo
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Nome
                </label>
                <input
                  type="text"
                  value={data.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, displayName: true }))}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                    errors.displayName
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                  placeholder="Seu nome completo"
                />
                {errors.displayName && touched.displayName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.displayName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline h-4 w-4 mr-1" />
                  Email
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                    errors.email
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                  placeholder="seu@email.com"
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Senha
                </label>
                <input
                  type="password"
                  value={data.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                    errors.password
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                  placeholder="••••••••"
                />
                {errors.password && touched.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">Mínimo de 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline h-4 w-4 mr-1" />
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  value={data.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                    errors.confirmPassword
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 flex-1">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || Object.keys(errors).length > 0}
              className="w-full bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] hover:from-[#ff6b4a] hover:via-[#ffb347] hover:to-[#2aa6a1] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  Criar conta
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>

            {/* Microcopy de segurança */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
              <Shield className="h-3 w-3 text-gray-400" />
              <span>Seus dados estão protegidos. Nunca compartilhamos suas informações.</span>
            </div>
          </form>
        )}

        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] bg-clip-text text-transparent mb-3">
                Complete seu perfil
              </h2>
              
              {/* Copy motivacional */}
              <p className="text-base text-gray-700 font-medium mb-4">
                Perfis completos recebem mais convites e melhores oportunidades
              </p>
              
              {/* Barra de progresso */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium text-gray-600">
                  <span>Progresso do perfil</span>
                  <span>{profileProgress}% completo</span>
                </div>
                <Progress value={profileProgress} className="h-3 transition-all duration-500" />
              </div>
            </div>

            <div className="space-y-5">
              {/* Foto de perfil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Camera className="inline h-4 w-4 mr-1" />
                  Foto de perfil
                </label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-2 ring-orange-500/20">
                    <AvatarImage src={data.photoUrl || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-[#ff6b4a] to-[#2aa6a1] text-white text-xl">
                      {data.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                        disabled={uploadingPhoto}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        disabled={uploadingPhoto}
                        className="w-full sm:w-auto"
                      >
                        {uploadingPhoto ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-4 w-4" />
                            {data.photoUrl ? "Trocar foto" : "Adicionar foto"}
                          </>
                        )}
                      </Button>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      JPG, PNG ou GIF. Máximo 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Instrumento principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  <Music className="inline h-4 w-4 mr-1" />
                  Instrumento principal
                </label>
                <div className="flex flex-wrap gap-2">
                  {INSTRUMENT_OPTIONS.map((instrument) => (
                    <button
                      key={instrument}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleChange("instrument", data.instrument === instrument ? "" : instrument);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        data.instrument === instrument
                          ? "bg-gradient-to-r from-[#ff6b4a] to-[#2aa6a1] text-white shadow-md"
                          : "bg-white border-2 border-gray-200 text-gray-700 hover:border-orange-300 hover:bg-orange-50"
                      }`}
                    >
                      {instrument}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cidade e Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={data.city}
                    onChange={(e) => handleChange("city", e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all hover:border-gray-300"
                    placeholder="São Paulo, Rio de Janeiro..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    value={data.state}
                    onChange={(e) => handleChange("state", e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm hover:border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>

              {/* Mini bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="inline h-4 w-4 mr-1" />
                  Mini bio
                </label>
                <textarea
                  value={data.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={4}
                  maxLength={200}
                  className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all resize-none"
                  placeholder="Conte um pouco sobre você, seus estilos favoritos e experiência..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  {data.bio.length}/200 caracteres
                </p>
              </div>

              {/* CPF (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={data.cpf}
                  onChange={(e) => handleChange("cpf", formatCPF(e.target.value))}
                  onBlur={() => setTouched((prev) => ({ ...prev, cpf: true }))}
                  maxLength={14}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-sm transition-all ${
                    errors.cpf
                      ? "border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  }`}
                  placeholder="000.000.000-00"
                />
                {errors.cpf && touched.cpf && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.cpf}
                  </p>
                )}
                <div className="mt-2 rounded-lg bg-blue-50 border border-blue-200 p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Usamos seu CPF apenas para confirmar sua identidade.</strong>{" "}
                    Perfis verificados têm mais destaque e confiança na plataforma.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 flex-1">{error}</p>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Nudge psicológico antes do botão "Pular" */}
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 mb-4">
              <p className="text-sm text-orange-800 text-center font-medium">
                🎯 Perfis completos recebem até 3x mais convites
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentStep(3)}
                className="flex-1 hover:bg-gray-50 transition-all"
              >
                Pular por enquanto
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] hover:from-[#ff6b4a] hover:via-[#ffb347] hover:to-[#2aa6a1] text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {currentStep === 3 && (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="flex justify-center">
              <div className={`h-20 w-20 rounded-full flex items-center justify-center ${
                isCPFProvided 
                  ? "bg-gradient-to-br from-green-500 to-emerald-500" 
                  : "bg-gradient-to-br from-gray-400 to-gray-500"
              }`}>
                {isCPFProvided ? (
                  <CheckCircle2 className="h-10 w-10 text-white" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-white" />
                )}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] bg-clip-text text-transparent mb-3">
                {isCPFProvided ? "Verificação em andamento" : "Seu perfil está quase pronto 🎶"}
              </h2>
              <p className="text-gray-600 text-base">
                {isCPFProvided
                  ? "Seu CPF foi recebido e está em processo de verificação. Isso pode levar alguns dias."
                  : "Você pode verificar seu perfil agora ou depois. Perfis verificados ganham mais destaque e confiança na plataforma."}
              </p>
            </div>

            {/* Badge de status */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                isCPFProvided
                  ? "bg-green-100 text-green-700 border-2 border-green-300"
                  : "bg-blue-100 text-blue-700 border-2 border-blue-300"
              }`}>
                {isCPFProvided ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-sm font-semibold">Em verificação</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm font-semibold">Perfil básico</span>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 space-y-3">
              <Button
                onClick={() => {
                  if (userId) {
                    window.location.href = "/dashboard";
                  } else {
                    router.push("/login");
                  }
                }}
                className="w-full bg-gradient-to-r from-[#ff6b4a] via-[#ffb347] to-[#2aa6a1] hover:from-[#ff6b4a] hover:via-[#ffb347] hover:to-[#2aa6a1] text-white shadow-lg hover:shadow-xl transition-all duration-200 h-12 text-base font-semibold hover:scale-[1.02]"
              >
                Ir para o Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Você pode completar ou verificar seu perfil a qualquer momento
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

