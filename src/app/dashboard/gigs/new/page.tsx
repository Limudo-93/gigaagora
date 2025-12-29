"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";

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

export default function NewGigPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Dados da gig
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [locationName, setLocationName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP"); // Pré-preenchido com SP
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("20:00"); // Horário padrão: 20h
  const [numEntradas, setNumEntradas] = useState<number | "">(2); // Padrão: 2 entradas (Pagode)
  const [duracaoEntrada, setDuracaoEntrada] = useState("1:15"); // Padrão: 1h15min (Pagode)
  const [intervaloMinutos, setIntervaloMinutos] = useState<number | "">(30); // Padrão: 30 minutos (Pagode)
  const [cache, setCache] = useState<number | "">("");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
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

  // Gêneros musicais disponíveis
  const generos = [
    "Pagode",
    "Sertanejo",
    "MPB",
    "Rock",
    "Pop",
    "Funk",
    "Forró",
    "Axé",
    "Samba",
    "Bossa Nova",
    "Jazz",
    "Blues",
    "Eletrônica",
    "Reggae",
    "Hip Hop",
    "Outro",
  ];

  // Habilidades requeridas
  const habilidades = [
    "Leitura de partitura",
    "Repertório clássico",
    "Repertório atual",
    "Improvisação",
    "Backing vocal",
    "Solo",
    "Arranjo",
    "Regência",
    "Técnica avançada",
    "Experiência em estúdio",
    "Experiência ao vivo",
  ];

  // Setup/Equipamentos
  const setups = [
    "Instrumento próprio",
    "Amplificador próprio",
    "Microfone próprio",
    "Pedal de efeitos",
    "Cabo próprio",
    "Afinador",
    "Metrônomo",
    "Tablet/Tablet para partitura",
    "Backline fornecido",
  ];

  // Função para calcular valor mínimo de cachê baseado no instrumento
  const getMinCacheForInstrument = (instrument: string, quantity: number, hasVocal: boolean): number => {
    const inst = instrument.toLowerCase();
    
    // Verificar se tem vocal
    if (hasVocal) {
      // Percussão + Voz Principal: mínimo $220
      if (inst.includes("percussão") || inst.includes("pandeiro") || inst.includes("surdo") || 
          inst.includes("tamborim") || inst.includes("agogô") || inst.includes("cuíca") || 
          inst.includes("reco-reco") || inst.includes("repique") || inst.includes("tantã")) {
        return 220;
      }
      // Cordas + Voz Principal: mínimo $270
      if (inst.includes("violão") || inst.includes("cavaquinho") || inst.includes("viola") || 
          inst.includes("bandolim") || inst.includes("banjo") || inst.includes("guitarra")) {
        return 270;
      }
    }
    
    // Percussão: 1 instrumento $170, 2+ $200
    if (inst.includes("percussão") || inst.includes("pandeiro") || inst.includes("surdo") || 
        inst.includes("tamborim") || inst.includes("agogô") || inst.includes("cuíca") || 
        inst.includes("reco-reco") || inst.includes("repique") || inst.includes("tantã")) {
      return quantity >= 2 ? 200 : 170;
    }
    
    // Cordas (violão, cavaco): mínimo $220
    if (inst.includes("violão") || inst.includes("cavaquinho") || inst.includes("viola") || 
        inst.includes("bandolim") || inst.includes("banjo") || inst.includes("guitarra")) {
      return 220;
    }
    
    // Bateria, baixo, teclado: mínimo $230
    if (inst.includes("bateria") || inst.includes("baixo") || inst.includes("contrabaixo") || 
        inst.includes("teclado") || inst.includes("piano")) {
      return 230;
    }
    
    // Sopros: mínimo $270
    if (inst.includes("saxofone") || inst.includes("trompete") || inst.includes("trombone") || 
        inst.includes("flauta") || inst.includes("acordeon") || inst.includes("sanfona")) {
      return 270;
    }
    
    // Outros: sem mínimo definido (retorna 0)
    return 0;
  };

  // Verificar se a vaga tem vocal
  const hasVocalInRole = (role: GigRole): boolean => {
    const inst = role.instrument.toLowerCase();
    return inst === "vocal" || inst.includes("voz") || 
           role.desired_skills.includes("Backing vocal");
  };

  const addRole = () => {
    const newRoleId = crypto.randomUUID();
    setRoles([
      ...roles,
      {
        id: newRoleId,
        instrument: "",
        quantity: 1,
        desired_genres: ["Pagode"], // Pré-preenchido com Pagode
        desired_skills: [], // Vazio por padrão, mas pode ser preenchido
        desired_setup: ["Instrumento próprio", "Afinador", "Cabo próprio"], // Pré-preenchido para Pagode
        notes: "",
        cache: "",
      },
    ]);
  };

  const removeRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, field: keyof GigRole, value: any) => {
    setRoles(
      roles.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

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
    setFlyerPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Função para fazer upload do flyer para Supabase Storage
  const uploadFlyer = async (gigId: string, userId: string): Promise<string | null> => {
    if (!flyerFile) return null;

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
      return null;
    }
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

      // Cria a gig
      const { data: gigData, error: gigError } = await supabase
        .from("gigs")
        .insert({
          contractor_id: user.id,
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
          created_by_musician: false,
        })
        .select()
        .single();

      if (gigError) {
        console.error("Error creating gig:", gigError);
        
        // Mensagem mais útil para erros de RLS
        if (gigError.message.includes("row-level security") || gigError.code === "42501") {
          setError(
            `Erro de segurança: As políticas RLS (Row Level Security) não estão configuradas corretamente. ` +
            `Execute o arquivo rls_policies.sql no SQL Editor do Supabase para corrigir isso. ` +
            `Detalhes: ${gigError.message}`
          );
        } else {
          setError(`Erro ao criar gig: ${gigError.message}`);
        }
        
        setSaving(false);
        return;
      }

      if (!gigData) {
        setError("Erro ao criar gig: nenhum dado retornado.");
        setSaving(false);
        return;
      }

      // Faz upload do flyer se houver
      let flyerUrl: string | null = null;
      if (flyerFile) {
        flyerUrl = await uploadFlyer(gigData.id, user.id);
        if (flyerUrl) {
          // Atualiza a gig com a URL do flyer
          const { error: updateError } = await supabase
            .from("gigs")
            .update({ flyer_url: flyerUrl })
            .eq("id", gigData.id);

          if (updateError) {
            console.error("Error updating flyer URL:", updateError);
            // Não falha a criação se o update do flyer der erro
          }
        }
      }

      // Cria as roles
      // Nota: Se as colunas são NOT NULL, enviamos arrays vazios ao invés de null
      const rolesToInsert = roles.map((role) => ({
        gig_id: gigData.id,
        instrument: role.instrument.trim(),
        quantity: role.quantity,
        desired_genres: role.desired_genres.length > 0 ? role.desired_genres : [],
        desired_skills: role.desired_skills.length > 0 ? role.desired_skills : [],
        desired_setup: role.desired_setup.length > 0 ? role.desired_setup : [],
        notes: role.notes.trim() || null,
        cache: role.cache && typeof role.cache === "number" ? role.cache : null,
      }));

      const { error: rolesError } = await supabase
        .from("gig_roles")
        .insert(rolesToInsert);

      if (rolesError) {
        console.error("Error creating roles:", rolesError);
        // Tenta deletar a gig criada
        await supabase.from("gigs").delete().eq("id", gigData.id);
        
        // Mensagem mais útil para erros de RLS
        if (rolesError.message.includes("row-level security") || rolesError.code === "42501") {
          setError(
            `Erro de segurança ao criar vagas: As políticas RLS (Row Level Security) não estão configuradas corretamente. ` +
            `Execute o arquivo rls_policies.sql no SQL Editor do Supabase para corrigir isso. ` +
            `Detalhes: ${rolesError.message}`
          );
        } else {
          setError(`Erro ao criar vagas: ${rolesError.message}`);
        }
        
        setSaving(false);
        return;
      }

      // Sucesso
      console.log("Gig created successfully:", gigData.id);
      
      // Redireciona para o dashboard ou para a página de detalhes da gig
      if (saveStatus === "draft") {
        router.push("/dashboard?tab=draft");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.error("Exception creating gig:", err);
      setError(err?.message ?? "Erro inesperado ao criar gig.");
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveGig("published");
  };

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
            <h1 className="text-2xl font-semibold text-gray-900">Criar Nova Gig</h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados da gig e adicione as vagas necessárias
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
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
                              {flyerFile?.name || "Flyer selecionado"}
                            </p>
                            <p className="text-xs text-gray-700">
                              {(flyerFile?.size || 0) / 1024} KB
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
                  <p className="mt-1 text-xs text-muted-foreground">
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
                      // Valida formato HH:MM
                      if (value === "" || /^\d{1,2}:\d{0,2}$/.test(value)) {
                        setDuracaoEntrada(value);
                      }
                    }}
                    placeholder="1:15"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    Tempo entre cada entrada
                  </p>
                </div>
              </div>

              {/* Mostra o horário de término calculado */}
              {startDate && startTime && numEntradas && duracaoEntrada && (
                <div className="rounded-lg border border-gray-200 bg-white p-3">
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
                  <p className="mt-2 text-xs text-gray-600">
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
                <p className="text-sm text-muted-foreground">
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
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-900">
                          Instrumento <span className="text-red-500">*</span>
                        </label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          value={role.instrument}
                          onChange={(e) => {
                            const newInstrument = e.target.value;
                            updateRole(role.id, "instrument", newInstrument);
                            
                            // Calcular e aplicar valor mínimo quando instrumento é selecionado
                            if (newInstrument) {
                              const hasVocal = newInstrument.toLowerCase().includes("vocal");
                              const minCache = getMinCacheForInstrument(newInstrument, role.quantity, hasVocal);
                              if (minCache > 0) {
                                // Aplicar valor mínimo se não houver valor ou se o valor atual for menor
                                if (!role.cache || (typeof role.cache === "number" && role.cache < minCache)) {
                                  updateRole(role.id, "cache", minCache);
                                }
                              }
                            }
                          }}
                          required
                        >
                          <option value="">Selecione um instrumento</option>
                          {instrumentos.map((inst) => (
                            <option key={inst} value={inst}>
                              {inst}
                            </option>
                          ))}
                        </select>
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
                          onChange={(e) => {
                            const newQuantity = Number(e.target.value) || 1;
                            updateRole(role.id, "quantity", newQuantity);
                            
                            // Recalcular valor mínimo se for percussão
                            if (role.instrument) {
                              const inst = role.instrument.toLowerCase();
                              if (inst.includes("percussão") || inst.includes("pandeiro") || 
                                  inst.includes("surdo") || inst.includes("tamborim") || 
                                  inst.includes("agogô") || inst.includes("cuíca") || 
                                  inst.includes("reco-reco") || inst.includes("repique") || 
                                  inst.includes("tantã")) {
                                const hasVocal = hasVocalInRole(role);
                                const minCache = getMinCacheForInstrument(role.instrument, newQuantity, hasVocal);
                                if (minCache > 0 && (!role.cache || (typeof role.cache === "number" && role.cache < minCache))) {
                                  updateRole(role.id, "cache", minCache);
                                }
                              }
                            }
                          }}
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
                        className={`mt-1 w-full rounded-md border px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          role.instrument && (() => {
                            const hasVocal = hasVocalInRole(role);
                            const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                            if (minCache > 0 && role.cache && typeof role.cache === "number" && role.cache < minCache) {
                              return "border-red-500 bg-red-50";
                            }
                            return "border-gray-200 bg-white";
                          })()
                        }`}
                        value={role.cache === "" ? "" : typeof role.cache === "number" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(role.cache) : ""}
                        onChange={(e) => {
                          // Remove tudo exceto números e vírgula
                          let value = e.target.value.replace(/[^\d,]/g, "");
                          // Substitui vírgula por ponto para parseFloat
                          let numValue = value === "" ? "" : parseFloat(value.replace(",", ".")) || 0;
                          
                          // Validar valor mínimo se houver instrumento selecionado
                          if (role.instrument && numValue !== "" && typeof numValue === "number") {
                            const hasVocal = hasVocalInRole(role);
                            const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                            
                            // Se o valor digitado for menor que o mínimo, usar o mínimo
                            if (minCache > 0 && numValue < minCache) {
                              numValue = minCache;
                            }
                          }
                          
                          updateRole(role.id, "cache", numValue);
                        }}
                        onBlur={(e) => {
                          if (role.instrument) {
                            const hasVocal = hasVocalInRole(role);
                            const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                            
                            // Se o valor for menor que o mínimo, ajustar para o mínimo
                            if (minCache > 0 && role.cache && typeof role.cache === "number" && role.cache < minCache) {
                              updateRole(role.id, "cache", minCache);
                              e.target.value = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minCache);
                            } else if (role.cache !== "" && typeof role.cache === "number") {
                              e.target.value = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(role.cache);
                            }
                          } else if (role.cache !== "" && typeof role.cache === "number") {
                            e.target.value = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(role.cache);
                          }
                        }}
                        placeholder="0,00"
                      />
                      {role.instrument && (() => {
                        const hasVocal = hasVocalInRole(role);
                        const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                        if (minCache > 0) {
                          return (
                            <p className={`mt-1 text-xs ${role.cache && typeof role.cache === "number" && role.cache < minCache ? "text-red-600 font-medium" : "text-gray-600"}`}>
                              Valor mínimo: R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minCache)}
                              {role.cache && typeof role.cache === "number" && role.cache < minCache && " (valor ajustado automaticamente)"}
                            </p>
                          );
                        }
                        return (
                          <p className="mt-1 text-xs text-gray-600">
                            Valor do cachê para este instrumento (ex: 1.500,00)
                          </p>
                        );
                      })()}
                      {!role.instrument && (
                        <p className="mt-1 text-xs text-gray-600">
                          Valor do cachê para este instrumento (ex: 1.500,00)
                        </p>
                      )}
                    </div>

                    {/* Gênero */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-2 block">
                        Gênero Musical
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {generos.map((genero) => {
                          const isSelected = role.desired_genres.includes(genero);
                          return (
                            <button
                              key={genero}
                              type="button"
                              onClick={() => {
                                const newGenres = isSelected
                                  ? role.desired_genres.filter((g) => g !== genero)
                                  : [...role.desired_genres, genero];
                                updateRole(role.id, "desired_genres", newGenres);
                                
                                // Se Pagode foi selecionado, aplicar configurações padrão
                                if (genero === "Pagode" && !isSelected) {
                                  // Aplicar apenas na primeira vaga ou se não houver configurações
                                  if (roles.indexOf(role) === 0 || numEntradas === 1) {
                                    setNumEntradas(2);
                                    setDuracaoEntrada("1:15");
                                    setIntervaloMinutos(30);
                                  }
                                  
                                  // Adicionar setup padrão do Pagode se não estiver presente
                                  const defaultSetup = ["Instrumento próprio", "Afinador", "Cabo próprio"];
                                  const currentSetup = role.desired_setup || [];
                                  const missingSetup = defaultSetup.filter(item => !currentSetup.includes(item));
                                  if (missingSetup.length > 0) {
                                    updateRole(role.id, "desired_setup", [...currentSetup, ...missingSetup]);
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-orange-500 text-white border border-orange-500"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-orange-50 hover:border-orange-300"
                              }`}
                            >
                              {genero}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Selecione um ou mais gêneros musicais
                      </p>
                    </div>

                    {/* Habilidades Requeridas */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-2 block">
                        Habilidades Requeridas
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {habilidades.map((habilidade) => {
                          const isSelected = role.desired_skills.includes(habilidade);
                          return (
                            <button
                              key={habilidade}
                              type="button"
                              onClick={() => {
                                const newSkills = isSelected
                                  ? role.desired_skills.filter((s) => s !== habilidade)
                                  : [...role.desired_skills, habilidade];
                                updateRole(role.id, "desired_skills", newSkills);
                                
                                // Recalcular valor mínimo se "Backing vocal" foi adicionado/removido
                                if (habilidade === "Backing vocal" && role.instrument) {
                                  const hasVocal = !isSelected; // Se foi selecionado, agora tem vocal
                                  const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                                  if (minCache > 0 && (!role.cache || (typeof role.cache === "number" && role.cache < minCache))) {
                                    updateRole(role.id, "cache", minCache);
                                  }
                                }
                              }}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-purple-500 text-white border border-purple-500"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-purple-50 hover:border-purple-300"
                              }`}
                            >
                              {habilidade}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Selecione as habilidades necessárias para esta vaga
                      </p>
                    </div>

                    {/* Setup/Equipamentos */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-2 block">
                        Setup/Equipamentos
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {setups.map((setup) => {
                          const isSelected = role.desired_setup.includes(setup);
                          return (
                            <button
                              key={setup}
                              type="button"
                              onClick={() => {
                                const newSetup = isSelected
                                  ? role.desired_setup.filter((s) => s !== setup)
                                  : [...role.desired_setup, setup];
                                updateRole(role.id, "desired_setup", newSetup);
                              }}
                              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                isSelected
                                  ? "bg-blue-500 text-white border border-blue-500"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                              }`}
                            >
                              {setup}
                            </button>
                          );
                        })}
                      </div>
                      <p className="mt-1 text-xs text-gray-600">
                        Selecione os equipamentos necessários ou fornecidos
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
            >
              {saving ? "Publicando..." : "Publicar Gig"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

