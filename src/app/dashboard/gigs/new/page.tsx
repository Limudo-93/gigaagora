"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Trash2, Upload, X, Image as ImageIcon, MapPin, Loader2 } from "lucide-react";
import { createGigWithRegion } from "@/app/actions/gigs";
import { computeRegionLabel } from "@/lib/geo";
import { reverseGeocode, geocodeAddress } from "@/app/actions/geocoding";
import { INSTRUMENT_OPTIONS } from "@/lib/instruments";

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
  const [state, setState] = useState("SP");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [geocodingAddress, setGeocodingAddress] = useState(false);
  const [timezone] = useState("America/Sao_Paulo");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("20:00");
  const [numEntradas, setNumEntradas] = useState<number | "">(2);
  const [duracaoEntrada, setDuracaoEntrada] = useState("1:15");
  const [intervaloMinutos, setIntervaloMinutos] = useState<number | "">(30);
  const [cache, setCache] = useState<number | "">("");
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [flyerPreview, setFlyerPreview] = useState<string | null>(null);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview da região calculada
  const [previewRegion, setPreviewRegion] = useState<string | null>(null);

  // Lista de instrumentos
  const instrumentos = INSTRUMENT_OPTIONS;

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

  // Gêneros musicais
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

  // Pegar localização automaticamente ao carregar a página
  useEffect(() => {
    if (!latitude || !longitude) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            setLatitude(lat);
            setLongitude(lng);
            
            // Fazer reverse geocoding para obter cidade, estado e região
            try {
              const geocodeResult = await reverseGeocode(lat, lng);
              
              if (!geocodeResult.error || geocodeResult.error === "API key não configurada") {
                if (geocodeResult.city && !city) {
                  setCity(geocodeResult.city);
                }
                if (geocodeResult.state && !state) {
                  setState(geocodeResult.state);
                }
                if (geocodeResult.region_label) {
                  setPreviewRegion(geocodeResult.region_label);
                }
              }
            } catch (err) {
              console.error("Error getting location details:", err);
            }
          },
          (err) => {
            console.error("Error getting location:", err);
            // Silenciosamente falha, usuário pode preencher manualmente
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      }
    }
  }, []); // Executa apenas uma vez ao montar

  // Atualizar preview da região quando location mudar
  useEffect(() => {
    if (city || state || (latitude && longitude)) {
      const region = computeRegionLabel(state, city, latitude ?? undefined, longitude ?? undefined);
      setPreviewRegion(region);
    } else {
      setPreviewRegion(null);
    }
  }, [city, state, latitude, longitude]);

  // Função para obter coordenadas do endereço digitado
  const handleGeocodeAddress = async () => {
    if (!addressText || addressText.trim().length === 0) {
      return;
    }

    setGeocodingAddress(true);
    setError(null);

    try {
      const result = await geocodeAddress(addressText.trim());
      
      if (result.error) {
        // Não mostrar erro, apenas log
        console.warn("Erro ao buscar coordenadas:", result.error);
        setGeocodingAddress(false);
        return;
      }

      if (result.latitude && result.longitude) {
        setLatitude(result.latitude);
        setLongitude(result.longitude);
        
        // Preencher cidade e estado se não estiverem preenchidos
        if (result.city && !city) {
          setCity(result.city);
        }
        if (result.state && !state) {
          setState(result.state);
        }
      }
    } catch (err: any) {
      console.error("Erro ao fazer geocoding:", err);
      // Não mostrar erro para o usuário
    } finally {
      setGeocodingAddress(false);
    }
  };

  // Função para calcular valor mínimo de cachê baseado no instrumento
  const getMinCacheForInstrument = (instrument: string, quantity: number, hasVocal: boolean): number => {
    const inst = instrument.toLowerCase();
    
    if (hasVocal) {
      if (inst.includes("percussão") || inst.includes("pandeiro") || inst.includes("surdo") || 
          inst.includes("tamborim") || inst.includes("agogô") || inst.includes("cuíca") || 
          inst.includes("reco-reco") || inst.includes("repique") || inst.includes("tantã")) {
        return 220;
      }
      if (inst.includes("violão") || inst.includes("cavaquinho") || inst.includes("viola") || 
          inst.includes("bandolim") || inst.includes("banjo") || inst.includes("guitarra")) {
        return 270;
      }
    }
    
    if (inst.includes("percussão") || inst.includes("pandeiro") || inst.includes("surdo") || 
        inst.includes("tamborim") || inst.includes("agogô") || inst.includes("cuíca") || 
        inst.includes("reco-reco") || inst.includes("repique") || inst.includes("tantã")) {
      return quantity >= 2 ? 200 : 170;
    }
    
    if (inst.includes("violão") || inst.includes("cavaquinho") || inst.includes("viola") || 
        inst.includes("bandolim") || inst.includes("banjo") || inst.includes("guitarra")) {
      return 220;
    }
    
    if (inst.includes("bateria") || inst.includes("baixo") || inst.includes("contrabaixo") || 
        inst.includes("teclado") || inst.includes("piano")) {
      return 230;
    }
    
    if (inst.includes("saxofone") || inst.includes("trompete") || inst.includes("trombone") || 
        inst.includes("flauta") || inst.includes("acordeon") || inst.includes("sanfona")) {
      return 270;
    }
    
    return 0;
  };

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
        desired_genres: ["Pagode"],
        desired_skills: [],
        desired_setup: ["Instrumento próprio", "Afinador", "Cabo próprio"],
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
    setRoles(
      roles.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const setCacheForRole = (id: string, value: number | "") => {
    updateRole(id, "cache", value);
    setCacheInputs((prev) => ({
      ...prev,
      [id]: value === "" ? "" : formatCurrency(value),
    }));
  };

  const handleInstrumentSelect = (role: GigRole, instrument: string) => {
    const nextInstrument = role.instrument === instrument ? "" : instrument;
    updateRole(role.id, "instrument", nextInstrument);

    if (nextInstrument) {
      const hasVocal = nextInstrument.toLowerCase().includes("vocal");
      const minCache = getMinCacheForInstrument(nextInstrument, role.quantity, hasVocal);
      if (
        minCache > 0 &&
        (!role.cache || (typeof role.cache === "number" && role.cache < minCache))
      ) {
        setCacheForRole(role.id, minCache);
      }
    }
  };

  // Função para lidar com seleção de arquivo de flyer
  const handleFlyerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Por favor, selecione um arquivo de imagem válido.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("O arquivo deve ter no máximo 5MB.");
      return;
    }

    setFlyerFile(file);
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setFlyerPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFlyer = () => {
    setFlyerFile(null);
    setFlyerPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFlyer = async (gigId: string, userId: string): Promise<string | null> => {
    if (!flyerFile) return null;

    setUploadingFlyer(true);
    try {
      const fileExt = flyerFile.name.split(".").pop();
      const fileName = `${gigId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from("gig-flyers")
        .upload(filePath, flyerFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
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

          const { data: urlData } = supabase.storage
            .from("public")
            .getPublicUrl(`${userId}/${fileName}`);

          setUploadingFlyer(false);
          return urlData.publicUrl;
        }

        throw error;
      }

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

  const horasMinutosParaMinutos = (horasMinutos: string): number => {
    if (!horasMinutos || !horasMinutos.includes(":")) return 0;
    const parts = horasMinutos.split(":");
    const horas = parseInt(parts[0] || "0", 10);
    const minutos = parseInt(parts[1] || "0", 10);
    return horas * 60 + minutos;
  };

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

      const duracaoRegex = /^\d{1,2}:\d{2}$/;
      if (!duracaoEntrada || !duracaoRegex.test(duracaoEntrada)) {
        setError("A duração de cada entrada deve estar no formato HH:MM (ex: 1:15 para 1h15min).");
        setSaving(false);
        return;
      }

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

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError("Erro ao verificar autenticação. Faça login novamente.");
        setSaving(false);
        return;
      }

      const startDateTime = new Date(`${startDate}T${startTime}`);
      const finalEndTime = calcularHorarioTermino();
      if (!finalEndTime) {
        setError("Erro ao calcular o horário de término.");
        setSaving(false);
        return;
      }

      const { showMinutes: calculatedShowMinutes, breakMinutes: calculatedBreakMinutes } =
        calcularMinutosParaBanco();

      // Usar createGigWithRegion ao invés de inserir diretamente
      const { data: gigData, error: gigError } = await createGigWithRegion({
        contractor_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        location_name: locationName.trim() || null,
        address_text: addressText.trim() || null,
        city: city.trim() || null,
        state: state.trim() || null,
        latitude: latitude,
        longitude: longitude,
        timezone: "America/Sao_Paulo",
        start_time: startDateTime.toISOString(),
        end_time: finalEndTime.toISOString(),
        show_minutes: calculatedShowMinutes || 0,
        break_minutes: calculatedBreakMinutes,
        status: saveStatus,
        created_by_musician: false,
        privacy_level: "approx",
      });

      if (gigError || !gigData) {
        console.error("Error creating gig:", gigError);
        setError(gigError?.message ?? "Erro ao criar gig.");
        setSaving(false);
        return;
      }

      // Faz upload do flyer se houver
      let flyerUrl: string | null = null;
      if (flyerFile) {
        flyerUrl = await uploadFlyer(gigData.id, user.id);
        if (flyerUrl) {
          const { error: updateError } = await supabase
            .from("gigs")
            .update({ flyer_url: flyerUrl })
            .eq("id", gigData.id);

          if (updateError) {
            console.error("Error updating flyer URL:", updateError);
          }
        }
      }

      // Cria as roles
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
        await supabase.from("gigs").delete().eq("id", gigData.id);
        setError(`Erro ao criar vagas: ${rolesError.message}`);
        setSaving(false);
        return;
      }

      console.log("Gig created successfully:", gigData.id);
      
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
    <DashboardLayout fullWidth>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Criar Nova Gig</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Preencha os dados da gig e adicione as vagas necessárias
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-800 dark:text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-xl">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="title">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Ex: Show no Bar do João"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="description">
                  Descrição
                </label>
                <textarea
                  id="description"
                  className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição detalhada da gig..."
                />
              </div>

              {/* Campo de Flyer */}
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="flyer">
                  Flyer do Evento
                </label>
                <div className="space-y-3">
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
                      className="w-full border-2 border-dashed hover:border-primary hover:bg-muted/50 transition-colors"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Selecionar Flyer
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="rounded-lg border-2 border-border bg-muted/30 p-4">
                        <div className="flex items-center gap-4">
                          <div className="h-24 w-24 rounded-lg overflow-hidden border-2 border-border bg-background flex items-center justify-center flex-shrink-0">
                            <img
                              src={flyerPreview}
                              alt="Preview do flyer"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {flyerFile?.name || "Flyer selecionado"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {((flyerFile?.size || 0) / 1024).toFixed(2)} KB
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
                        className="w-full border-2"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Trocar Flyer
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Localização */}
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-xl flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Localização
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="locationName">
                  Nome do Local
                </label>
                <input
                  id="locationName"
                  type="text"
                  className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Ex: Bar do João"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="addressText">
                  Endereço Completo
                </label>
                <input
                  id="addressText"
                  type="text"
                  className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  onBlur={() => {
                    if (addressText.trim().length > 5) {
                      handleGeocodeAddress();
                    }
                  }}
                  placeholder="Ex: Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                />
                {geocodingAddress && (
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Buscando localização...
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1.5">
                  Digite o endereço completo do evento para obter a localização automaticamente
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="city">
                    Cidade
                  </label>
                  <input
                    id="city"
                    type="text"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="São Paulo"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="state">
                    Estado (UF)
                  </label>
                  <input
                    id="state"
                    type="text"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors uppercase"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Preview da Região */}
              {previewRegion && (
                <div className="rounded-lg border-2 border-primary/50 bg-primary/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Região calculada:</p>
                  <p className="text-sm font-semibold text-foreground">{previewRegion}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data e Horário */}
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border">
              <CardTitle className="text-xl">Data e Horário</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="startDate">
                    Data de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="startTime">
                    Horário de Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="numEntradas">
                    Número de Entradas <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="numEntradas"
                    type="number"
                    min="1"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="duracaoEntrada">
                    Duração de Cada Entrada <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="duracaoEntrada"
                    type="text"
                    pattern="^\d{1,2}:\d{2}$"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    Formato: HH:MM (ex: 1:15 = 1h15min)
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="intervaloMinutos">
                    Intervalo entre Entradas (minutos)
                  </label>
                  <input
                    id="intervaloMinutos"
                    type="number"
                    min="0"
                    className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
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
                <div className="rounded-lg border-2 border-border bg-muted/30 p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Horário de Término Calculado:</p>
                  <p className="text-base font-medium text-foreground mb-2">
                    {calcularHorarioTermino()?.toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Duração total: {calcularMinutosParaBanco().showMinutes} minutos
                    {calcularMinutosParaBanco().breakMinutes > 0 &&
                      ` + ${calcularMinutosParaBanco().breakMinutes} minutos de intervalo`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vagas (Roles) */}
          <Card className="border-2 border-border shadow-lg">
            <CardHeader className="bg-muted/30 border-b border-border flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Vagas Necessárias</CardTitle>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={addRole}
                className="font-semibold"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Vaga
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {roles.length === 0 ? (
                <div className="text-center py-8 rounded-lg border-2 border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    Nenhuma vaga adicionada. Clique em "Adicionar Vaga" para começar.
                  </p>
                </div>
              ) : (
                roles.map((role) => (
                  <div
                    key={role.id}
                    className="rounded-lg border-2 border-border bg-muted/30 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-lg text-foreground">Vaga {roles.indexOf(role) + 1}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeRole(role.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">
                          Instrumento <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {instrumentos.map((inst) => {
                            const isSelected = role.instrument === inst;
                            return (
                              <button
                                key={inst}
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleInstrumentSelect(role, inst);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  isSelected
                                    ? "bg-primary text-primary-foreground shadow-md"
                                    : "bg-background text-foreground border-2 border-input hover:border-primary hover:bg-muted/50"
                                }`}
                              >
                                {inst}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-foreground mb-2 block">
                          Quantidade <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                          value={role.quantity}
                          onChange={(e) => {
                            const newQuantity = Number(e.target.value) || 1;
                            updateRole(role.id, "quantity", newQuantity);
                            
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
                                  setCacheForRole(role.id, minCache);
                                }
                              }
                            }
                          }}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">
                        Cachê (R$)
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors ${
                          role.instrument && (() => {
                            const hasVocal = hasVocalInRole(role);
                            const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                            if (minCache > 0 && role.cache && typeof role.cache === "number" && role.cache < minCache) {
                              return "border-red-500 bg-red-50";
                            }
                            return "border-input bg-background";
                          })()
                        }`}
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

                          let finalValue = parsed;
                          if (role.instrument) {
                            const hasVocal = hasVocalInRole(role);
                            const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                            if (minCache > 0 && finalValue < minCache) {
                              finalValue = minCache;
                            }
                          }

                          setCacheForRole(role.id, finalValue);
                        }}
                        placeholder="0,00"
                      />
                      {role.instrument && (() => {
                        const hasVocal = hasVocalInRole(role);
                        const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                        if (minCache > 0) {
                          return (
                            <p className={`mt-1 text-xs ${role.cache && typeof role.cache === "number" && role.cache < minCache ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                              Valor mínimo: R$ {new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(minCache)}
                              {role.cache && typeof role.cache === "number" && role.cache < minCache && " (valor ajustado automaticamente)"}
                            </p>
                          );
                        }
                        return (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Valor do cachê para este instrumento (ex: 1.500,00)
                          </p>
                        );
                      })()}
                      {!role.instrument && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Valor do cachê para este instrumento (ex: 1.500,00)
                        </p>
                      )}
                    </div>

                    {/* Gênero */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-3 block">
                        Gênero Musical
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {generos.map((genero) => {
                          const isSelected = role.desired_genres.includes(genero);
                          return (
                            <button
                              key={genero}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const newGenres = isSelected
                                  ? role.desired_genres.filter((g) => g !== genero)
                                  : [...role.desired_genres, genero];
                                updateRole(role.id, "desired_genres", newGenres);
                                
                                if (genero === "Pagode" && !isSelected) {
                                  if (roles.indexOf(role) === 0 || numEntradas === 1) {
                                    setNumEntradas(2);
                                    setDuracaoEntrada("1:15");
                                    setIntervaloMinutos(30);
                                  }
                                  
                                  const defaultSetup = ["Instrumento próprio", "Afinador", "Cabo próprio"];
                                  const currentSetup = role.desired_setup || [];
                                  const missingSetup = defaultSetup.filter(item => !currentSetup.includes(item));
                                  if (missingSetup.length > 0) {
                                    updateRole(role.id, "desired_setup", [...currentSetup, ...missingSetup]);
                                  }
                                }
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "bg-background text-foreground border-2 border-input hover:border-primary hover:bg-muted/50"
                              }`}
                            >
                              {genero}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Habilidades Requeridas */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-3 block">
                        Habilidades Requeridas
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {habilidades.map((habilidade) => {
                          const isSelected = role.desired_skills.includes(habilidade);
                          return (
                            <button
                              key={habilidade}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const newSkills = isSelected
                                  ? role.desired_skills.filter((s) => s !== habilidade)
                                  : [...role.desired_skills, habilidade];
                                updateRole(role.id, "desired_skills", newSkills);
                                
                                if (habilidade === "Backing vocal" && role.instrument) {
                                  const hasVocal = !isSelected;
                                  const minCache = getMinCacheForInstrument(role.instrument, role.quantity, hasVocal);
                                  if (minCache > 0 && (!role.cache || (typeof role.cache === "number" && role.cache < minCache))) {
                                    setCacheForRole(role.id, minCache);
                                  }
                                }
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-[#ff6b4a] text-white shadow-md"
                                  : "bg-background text-foreground border-2 border-input hover:border-[#ff6b4a] hover:bg-amber-50"
                              }`}
                            >
                              {habilidade}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Setup/Equipamentos */}
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-3 block">
                        Setup/Equipamentos
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {setups.map((setup) => {
                          const isSelected = role.desired_setup.includes(setup);
                          return (
                            <button
                              key={setup}
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const newSetup = isSelected
                                  ? role.desired_setup.filter((s) => s !== setup)
                                  : [...role.desired_setup, setup];
                                updateRole(role.id, "desired_setup", newSetup);
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                isSelected
                                  ? "bg-blue-500 text-white shadow-md"
                                  : "bg-background text-foreground border-2 border-input hover:border-blue-500 hover:bg-blue-50"
                              }`}
                            >
                              {setup}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-foreground mb-2 block">Observações</label>
                      <textarea
                        className="w-full rounded-lg border-2 border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
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
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t-2 border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
              className="w-full sm:w-auto border-2"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => saveGig("draft")}
              disabled={saving || uploadingFlyer}
              className="w-full sm:w-auto"
            >
              {saving || uploadingFlyer ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingFlyer ? "Enviando flyer..." : "Salvando..."}
                </>
              ) : (
                "Salvar como Rascunho"
              )}
            </Button>
            <Button
              type="submit"
              disabled={saving || uploadingFlyer}
              className="w-full sm:w-auto font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar Gig"
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
