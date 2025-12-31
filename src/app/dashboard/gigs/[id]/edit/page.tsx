"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Loader2, Upload, X, Image as ImageIcon } from "lucide-react";

type GigRole = {
  id: string;
  instrument: string;
  quantity: number;
  desired_genres: string[];
  desired_skills: string[];
  desired_setup: string[];
  notes: string;
  cache: number | "";
};

export default function EditGigPage() {
  const router = useRouter();
  const params = useParams();
  const gigId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dados da gig
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [numEntradas, setNumEntradas] = useState<number | "">(1);
  const [duracaoEntrada, setDuracaoEntrada] = useState("1:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState<number | "">(0);
  const [currentStatus, setCurrentStatus] = useState<string>("draft");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [currentFlyerUrl, setCurrentFlyerUrl] = useState<string | null>(null);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lista de instrumentos para o dropdown (Pagode e Sertanejo) - Ordem alfabética
  const instrumentos = [
    "Acordeon",
    "Agogô",
    "Aparelhagem de som",
    "Baixo",
    "Bandolim",
    "Banjo",
    "Bateria",
    "Cavaquinho",
    "Contrabaixo",
    "Cuíca",
    "Flauta",
    "Guitarra",
    "Outro",
    "Pandeiro",
    "Percussão",
    "Piano",
    "Reco-reco",
    "Repique de mão",
    "Sanfona",
    "Saxofone",
    "Surdo",
    "Tamborim",
    "Tantã",
    "Teclado",
    "Trombone",
    "Trompete",
    "Viola",
    "Viola Caipira",
    "Violino",
    "Violoncelo",
    "Violão",
    "Vocal",
  ];

  // Roles (vagas)
  const [roles, setRoles] = useState<GigRole[]>([]);
  const [cacheInputs, setCacheInputs] = useState<Record<string, string>>({});

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const normalizeCurrencyInput = (value: string) => {
    let cleaned = value.replace(/[^\d,]/g, "");
    const parts = cleaned.split(",");
    if (parts.length > 2) {
      cleaned = `${parts[0]},${parts.slice(1).join("")}`;
    }
    return cleaned;
  };

  const parseCurrencyInput = (value: string) => {
    if (!value) return "";
    const parsed = Number.parseFloat(value.replace(",", "."));
    return Number.isNaN(parsed) ? "" : parsed;
  };

  // Função para converter minutos em HH:MM
  const minutosParaHorasMinutos = (minutos: number): string => {
    if (!minutos || minutos <= 0) return "1:00";
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${horas}:${mins.toString().padStart(2, "0")}`;
  };

  // Carrega os dados da gig
  useEffect(() => {
    const loadGig = async () => {
      if (!gigId) return;

      setLoading(true);
      setError(null);

      try {
        // Busca a gig
        const { data: gigData, error: gigError } = await supabase
          .from("gigs")
          .select("*")
          .eq("id", gigId)
          .single();

        if (gigError) throw gigError;
        if (!gigData) throw new Error("Gig não encontrada");

        // Preenche os campos
        setTitle(gigData.title || "");
        setDescription(gigData.description || "");
        setLocationName(gigData.location_name || "");
        setAddressText(gigData.address_text || "");
        setCity(gigData.city || "");
        setState(gigData.state || "");
        setTimezone(gigData.timezone || "America/Sao_Paulo");
        setCurrentStatus(gigData.status || "draft");
        setCurrentFlyerUrl(gigData.flyer_url || null);
        if (gigData.flyer_url) {
          setFlyerPreview(gigData.flyer_url);
        }

        // Data e hora
        if (gigData.start_time) {
          const start = new Date(gigData.start_time);
          setStartDate(start.toISOString().split("T")[0]);
          setStartTime(start.toTimeString().slice(0, 5));
        }

        // Calcula numEntradas, duracaoEntrada e intervaloMinutos
        // Tenta estimar baseado nos dados existentes
        if (gigData.show_minutes && gigData.show_minutes > 0) {
          const totalMinutos = gigData.show_minutes;
          const breakMinutos = gigData.break_minutes || 0;
          
          // Se há break_minutes, estima que há pelo menos 2 entradas
          // Tenta descobrir quantas entradas baseado no break_minutes
          let estimatedEntradas = 1;
          if (breakMinutos > 0) {
            // Assume intervalo padrão de 15-30 minutos entre entradas
            estimatedEntradas = Math.max(2, Math.floor(breakMinutos / 15) + 1);
          }
          
          // Calcula duração por entrada
          const minutosPorEntrada = Math.floor(totalMinutos / estimatedEntradas);
          setDuracaoEntrada(minutosParaHorasMinutos(minutosPorEntrada || 60));
          setNumEntradas(estimatedEntradas);
          
          if (estimatedEntradas > 1 && breakMinutos > 0) {
            setIntervaloMinutos(Math.floor(breakMinutos / (estimatedEntradas - 1)));
          } else {
            setIntervaloMinutos(0);
          }
        }

        // Busca as roles
        const { data: rolesData, error: rolesError } = await supabase
          .from("gig_roles")
          .select("*")
          .eq("gig_id", gigId)
          .order("instrument", { ascending: true });

        if (rolesError) throw rolesError;

        const rolesMapped = (rolesData || []).map((r: any) => ({
          id: r.id,
          instrument: r.instrument || "",
          quantity: r.quantity || 1,
          desired_genres: r.desired_genres || [],
          desired_skills: r.desired_skills || [],
          desired_setup: r.desired_setup || [],
          notes: r.notes || "",
          cache: r.cache && typeof r.cache === "number" ? r.cache : "",
        }));

        setRoles(rolesMapped);
        setCacheInputs(
          rolesMapped.reduce<Record<string, string>>((acc, role) => {
            acc[role.id] =
              role.cache === "" || typeof role.cache !== "number"
                ? ""
                : formatCurrency(role.cache);
            return acc;
          }, {})
        );
      } catch (e: any) {
        console.error("Error loading gig:", e);
        setError(e?.message ?? "Erro ao carregar gig.");
      } finally {
        setLoading(false);
      }
    };

    loadGig();
  }, [gigId]);

  // Função para lidar com seleção de arquivo de flyer
  const handleFlyerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    // Valida tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 5MB.");
      return;
    }

    setFlyerFile(file);
    setError(null);

    // Cria preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setFlyerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Função para remover flyer selecionado
  const handleRemoveFlyer = () => {
    setFlyerFile(null);
    setFlyerPreview(currentFlyerUrl);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Função para fazer upload do flyer para Supabase Storage
  const uploadFlyer = async (gigId: string, userId: string): Promise<string | null> => {
    if (!flyerFile) return currentFlyerUrl;

    setUploadingFlyer(true);
    try {
      // Gera nome único para o arquivo
      const fileExt = flyerFile.name.split(".").pop();
      const fileName = `${gigId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Faz upload para o bucket 'gig-flyers' (ou 'public' se não existir)
      const { data, error } = await supabase.storage
        .from("gig-flyers")
        .upload(filePath, flyerFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        // Se o bucket não existir, tenta usar 'public'
        if (error.message.includes("Bucket not found")) {
          const { data: publicData, error: publicError } = await supabase.storage
            .from("public")
            .upload(`${userId}/${fileName}`, flyerFile, {
              cacheControl: "3600",
              upsert: false,
            });

          if (publicError) {
            console.error("Error uploading to public bucket:", publicError);
            throw publicError;
          }

          // Obtém URL pública
          const { data: urlData } = supabase.storage
            .from("public")
            .getPublicUrl(`${userId}/${fileName}`);

          setUploadingFlyer(false);
          return urlData.publicUrl;
        }

        throw error;
      }

      // Obtém URL pública
      const { data: urlData } = supabase.storage
        .from("gig-flyers")
        .getPublicUrl(filePath);

      setUploadingFlyer(false);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error("Error uploading flyer:", err);
      setError(`Erro ao fazer upload do flyer: ${err.message}`);
      setUploadingFlyer(false);
      return currentFlyerUrl;
    }
  };

  const addRole = () => {
    const newRoleId = crypto.randomUUID();
    setRoles([
      ...roles,
      {
        id: newRoleId,
        instrument: "",
        quantity: 1,
        desired_genres: [],
        desired_skills: [],
        desired_setup: [],
        notes: "",
        cache: "",
      },
    ]);
    setCacheInputs((prev) => ({ ...prev, [newRoleId]: "" }));
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
    setCacheInputs((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateRole = (id: string, field: keyof GigRole, value: any) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const setCacheForRole = (id: string, value: number | "") => {
    updateRole(id, "cache", value);
    setCacheInputs((prev) => ({
      ...prev,
      [id]: value === "" ? "" : formatCurrency(value),
    }));
  };

  // Função para converter HH:MM em minutos
  const horasMinutosParaMinutos = (horasMinutos: string): number => {
    if (!horasMinutos || !horasMinutos.includes(":")) return 0;
    const parts = horasMinutos.split(":");
    const horas = parseInt(parts[0] || "0", 10);
    const minutos = parseInt(parts[1] || "0", 10);
    return horas * 60 + minutos;
  };

  // Função para calcular o horário de término automaticamente
  const calcularHorarioTermino = () => {
    if (!startDate || !startTime || !numEntradas || !duracaoEntrada) {
      return null;
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    const duracaoMinutos = horasMinutosParaMinutos(duracaoEntrada);
    const totalShowMinutes = Number(numEntradas) * duracaoMinutos;
    const totalIntervaloMinutos = (Number(numEntradas) - 1) * Number(intervaloMinutos || 0);
    const totalMinutos = totalShowMinutes + totalIntervaloMinutos;

    return new Date(startDateTime.getTime() + totalMinutos * 60000);
  };

  // Calcula show_minutes e break_minutes para salvar no banco
  const calcularMinutosParaBanco = () => {
    if (!numEntradas || !duracaoEntrada) {
      return { showMinutes: null, breakMinutes: 0 };
    }

    const duracaoMinutos = horasMinutosParaMinutos(duracaoEntrada);
    const showMinutes = Number(numEntradas) * duracaoMinutos;
    const breakMinutes = (Number(numEntradas) - 1) * Number(intervaloMinutos || 0);

    return { showMinutes, breakMinutes };
  };

  const saveGig = async (saveStatus: "draft" | "published") => {
    setError(null);
    setSaving(true);

    try {
      // Validações básicas
      if (!title.trim()) {
        setError("O título é obrigatório.");
        setSaving(false);
        return;
      }

      if (!startDate || !startTime) {
        setError("Data e horário de início são obrigatórios.");
        setSaving(false);
        return;
      }

      if (!numEntradas || Number(numEntradas) < 1) {
        setError("O número de entradas deve ser pelo menos 1.");
        setSaving(false);
        return;
      }

      // Valida formato HH:MM
      const duracaoRegex = /^\d{1,2}:\d{2}$/;
      if (!duracaoEntrada || !duracaoRegex.test(duracaoEntrada)) {
        setError("A duração de cada entrada deve estar no formato HH:MM (ex: 1:15 para 1h15min).");
        setSaving(false);
        return;
      }

      // Valida que os valores são válidos
      const duracaoMinutos = horasMinutosParaMinutos(duracaoEntrada);
      if (duracaoMinutos <= 0) {
        setError("A duração de cada entrada deve ser maior que zero.");
        setSaving(false);
        return;
      }

      if (roles.length === 0) {
        setError("Adicione pelo menos uma vaga (role).");
        setSaving(false);
        return;
      }

      // Valida roles
      for (const role of roles) {
        if (!role.instrument.trim()) {
          setError("Todos os instrumentos devem ser preenchidos.");
          setSaving(false);
          return;
        }
        if (role.quantity < 1) {
          setError("A quantidade de cada vaga deve ser pelo menos 1.");
          setSaving(false);
          return;
        }
      }

      // Busca o usuário atual
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Erro ao verificar autenticação. Faça login novamente.");
        setSaving(false);
        return;
      }

      // Monta a data de início
      const startDateTime = new Date(`${startDate}T${startTime}`);

      // Calcula o horário de término automaticamente
      const finalEndTime = calcularHorarioTermino();
      if (!finalEndTime) {
        setError("Erro ao calcular o horário de término.");
        setSaving(false);
        return;
      }

      // Calcula show_minutes e break_minutes
      const { showMinutes: calculatedShowMinutes, breakMinutes: calculatedBreakMinutes } =
        calcularMinutosParaBanco();

      // Faz upload do flyer se houver
      let flyerUrl: string | null = currentFlyerUrl;
      if (flyerFile) {
        flyerUrl = await uploadFlyer(gigId, user.id);
      }

      // Atualiza a gig
      const { error: gigError } = await supabase
        .from("gigs")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          location_name: locationName.trim() || null,
          address_text: addressText.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          timezone: "America/Sao_Paulo",
          start_time: startDateTime.toISOString(),
          end_time: finalEndTime.toISOString(),
          show_minutes: calculatedShowMinutes,
          break_minutes: calculatedBreakMinutes,
          status: saveStatus,
          flyer_url: flyerUrl,
        })
        .eq("id", gigId)
        .eq("contractor_id", user.id); // Garantir que só atualiza suas próprias gigs

      if (gigError) {
        console.error("Error updating gig:", gigError);
        setError(`Erro ao atualizar gig: ${gigError.message}`);
        setSaving(false);
        return;
      }

      // Busca roles existentes
      const { data: existingRoles } = await supabase
        .from("gig_roles")
        .select("id")
        .eq("gig_id", gigId);

      const existingRoleIds = (existingRoles || []).map((r) => r.id);
      const currentRoleIds = roles
        .filter((r) => r.id && !r.id.startsWith("crypto"))
        .map((r) => r.id);

      // Deleta roles que não estão mais na lista
      const rolesToDelete = existingRoleIds.filter((id) => !currentRoleIds.includes(id));
      if (rolesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from("gig_roles")
          .delete()
          .in("id", rolesToDelete);

        if (deleteError) {
          console.error("Error deleting old roles:", deleteError);
        }
      }

      // Atualiza ou cria roles
      for (const role of roles) {
        const roleData = {
          gig_id: gigId,
          instrument: role.instrument.trim(),
          quantity: role.quantity,
          desired_genres: role.desired_genres.length > 0 ? role.desired_genres : [],
          desired_skills: role.desired_skills.length > 0 ? role.desired_skills : [],
          desired_setup: role.desired_setup.length > 0 ? role.desired_setup : [],
          notes: role.notes.trim() || null,
          cache: role.cache && typeof role.cache === "number" ? role.cache : null,
        };

        if (role.id && !role.id.startsWith("crypto") && existingRoleIds.includes(role.id)) {
          // Atualiza role existente
          const { error: updateError } = await supabase
            .from("gig_roles")
            .update(roleData)
            .eq("id", role.id);

          if (updateError) {
            console.error("Error updating role:", updateError);
          }
        } else {
          // Cria nova role
          const { error: insertError } = await supabase
            .from("gig_roles")
            .insert(roleData);

          if (insertError) {
            console.error("Error creating role:", insertError);
          }
        }
      }

      // Sucesso
      console.log("Gig updated successfully:", gigId);
      
      // Redireciona para o dashboard
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Exception updating gig:", err);
      setError(err?.message ?? "Erro inesperado ao atualizar gig.");
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGig("published");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-700" />
          <span className="ml-2 text-sm text-gray-700">Carregando gig...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar Gig</h1>
            <p className="text-sm text-gray-700">
              Edite os dados da gig e as vagas necessárias
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900" htmlFor="title">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex: Show no Bar do João"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900" htmlFor="description">
                  Descrição
                </label>
                <textarea
                  id="description"
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada da gig..."
                />
              </div>

              {/* Campo de Flyer */}
              <div>
                <label className="text-sm font-medium text-gray-900" htmlFor="flyer">
                  Flyer do Evento
                </label>
                <div className="mt-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    id="flyer"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFlyerSelect}
                  />
                  
                  {!flyerPreview ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Flyer
                    </Button>
                  ) : (
                    <div className="relative">
                      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-20 w-20 rounded-md overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                            {flyerPreview ? (
                              <img
                                src={flyerPreview}
                                alt="Preview do flyer"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {flyerFile?.name || "Flyer atual"}
                            </p>
                            <p className="text-xs text-gray-700">
                              {flyerFile ? `${(flyerFile.size / 1024).toFixed(0)} KB` : "Flyer existente"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveFlyer}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 w-full border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Trocar Flyer
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-gray-700">
                    Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900" htmlFor="locationName">
                  Nome do Local
                </label>
                <input
                  id="locationName"
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Bar do João"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900" htmlFor="addressText">
                  Endereço Completo
                </label>
                <input
                  id="addressText"
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="city">
                    Cidade
                  </label>
                  <input
                    id="city"
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="state">
                    Estado
                  </label>
                  <input
                    id="state"
                    type="text"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Data e Horário */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Data e Horário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="startDate">
                    Data de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="startTime">
                    Horário de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="numEntradas">
                    Número de Entradas <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="numEntradas"
                    type="number"
                    min="1"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={numEntradas}
                    onChange={(e) =>
                      setNumEntradas(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="1"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-700">
                    Ex: 2 entradas
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="duracaoEntrada">
                    Duração de Cada Entrada <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="duracaoEntrada"
                    type="text"
                    pattern="^\d{1,2}:\d{2}$"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={duracaoEntrada}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^\d{1,2}:\d{0,2}$/.test(value)) {
                        setDuracaoEntrada(value);
                      }
                    }}
                    placeholder="1:15"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-700">
                    Formato: HH:MM (ex: 1:15 = 1h15min)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="intervaloMinutos">
                    Intervalo entre Entradas (minutos)
                  </label>
                  <input
                    id="intervaloMinutos"
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={intervaloMinutos}
                    onChange={(e) =>
                      setIntervaloMinutos(e.target.value ? Number(e.target.value) : "")
                    }
                    placeholder="0"
                  />
                  <p className="mt-1 text-xs text-gray-700">
                    Tempo entre cada entrada
                  </p>
                </div>
              </div>

              {/* Mostra o horário de término calculado */}
              {startDate && startTime && numEntradas && duracaoEntrada && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-medium text-gray-900">Horário de Término Calculado:</p>
                  <p className="mt-1 text-sm text-gray-700">
                    {calcularHorarioTermino()?.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) || "—"}
                  </p>
                  <p className="mt-2 text-xs text-gray-700">
                    Duração total: {calcularMinutosParaBanco().showMinutes} minutos
                    {calcularMinutosParaBanco().breakMinutes > 0 &&
                      ` + ${calcularMinutosParaBanco().breakMinutes} minutos de intervalo`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vagas (Roles) */}
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-gray-900">Vagas Necessárias</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRole}
                className="bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Vaga
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {roles.length === 0 ? (
                <p className="text-sm text-gray-700">
                  Nenhuma vaga adicionada. Clique em "Adicionar Vaga" para começar.
                </p>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-gray-900">Vaga {roles.indexOf(role) + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRole(role.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Instrumento <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {instrumentos.map((inst) => {
                            const isSelected = role.instrument === inst;
                            return (
                              <button
                                key={inst}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const nextInstrument = isSelected ? "" : inst;
                                  updateRole(role.id, "instrument", nextInstrument);
                                }}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  isSelected
                                    ? "bg-orange-500 text-white shadow-sm"
                                    : "bg-white text-gray-900 border border-gray-200 hover:border-orange-400 hover:bg-orange-50"
                                }`}
                              >
                                {inst}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Quantidade <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          value={role.quantity}
                          onChange={(e) =>
                            updateRole(role.id, "quantity", Number(e.target.value) || 1)
                          }
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900">
                        Cachê (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={
                          cacheInputs[role.id] ??
                          (role.cache === ""
                            ? ""
                            : typeof role.cache === "number"
                              ? formatCurrency(role.cache)
                              : "")
                        }
                        onChange={(e) => {
                          const rawValue = normalizeCurrencyInput(e.target.value);
                          setCacheInputs((prev) => ({ ...prev, [role.id]: rawValue }));
                          const parsed = parseCurrencyInput(rawValue);
                          updateRole(role.id, "cache", parsed === "" ? "" : parsed);
                        }}
                        onBlur={(e) => {
                          const rawValue = cacheInputs[role.id] ?? "";
                          const parsed = parseCurrencyInput(rawValue);
                          if (parsed === "") {
                            setCacheForRole(role.id, "");
                            return;
                          }
                          setCacheForRole(role.id, parsed);
                        }}
                        placeholder="0,00"
                      />
                      <p className="mt-1 text-xs text-gray-600">
                        Valor do cachê para este instrumento (ex: 1.500,00)
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-900">Observações</label>
                      <textarea
                        className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={2}
                        value={role.notes}
                        onChange={(e) => updateRole(role.id, "notes", e.target.value)}
                        placeholder="Observações sobre esta vaga..."
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => saveGig("draft")}
              disabled={saving || uploadingFlyer}
              className="bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              {saving || uploadingFlyer ? (uploadingFlyer ? "Enviando flyer..." : "Salvando...") : "Salvar como Rascunho"}
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {saving ? "Publicando..." : "Publicar Gig"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

