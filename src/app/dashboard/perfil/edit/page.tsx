"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X, Image as ImageIcon } from "lucide-react";

export default function EditPerfilPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Dados do perfil básico
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [searchRadius, setSearchRadius] = useState(50); // Raio em km, padrão 50km
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Dados do perfil de músico
  const [bio, setBio] = useState("");
  const [instruments, setInstruments] = useState<string[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [setup, setSetup] = useState<string[]>([]);
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);
  
  // Novos campos expandidos
  const [socialMedia, setSocialMedia] = useState({
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    twitter: "",
    linkedin: "",
    spotify: "",
    soundcloud: "",
  });
  const [sheetMusicReading, setSheetMusicReading] = useState<"none" | "basic" | "intermediate" | "advanced">("none");
  const [repertoire, setRepertoire] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [musicalEducation, setMusicalEducation] = useState("");
  const [basePrice, setBasePrice] = useState<number | "">("");


  // Estados para inputs de arrays
  const [newInstrument, setNewInstrument] = useState("");
  const [newGenre, setNewGenre] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newSetup, setNewSetup] = useState("");
  const [newPortfolioLink, setNewPortfolioLink] = useState("");

  // Lista de instrumentos comuns
  const commonInstruments = [
    "Violão",
    "Guitarra",
    "Baixo",
    "Bateria",
    "Teclado",
    "Piano",
    "Vocal",
    "Saxofone",
    "Trompete",
    "Trombone",
    "Flauta",
    "Violino",
    "Violoncelo",
    "Viola",
    "Contrabaixo",
    "Percussão",
    "Cavaquinho",
    "Bandolim",
    "Acordeon",
    "Sanfona",
  ];

  const commonGenres = [
    "MPB",
    "Rock",
    "Pop",
    "Jazz",
    "Samba",
    "Bossa Nova",
    "Forró",
    "Sertanejo",
    "Funk",
    "Hip Hop",
    "Eletrônica",
    "Clássica",
    "Blues",
    "Reggae",
    "Country",
    "Pagode",
    "Axé",
    "Samba Rock",
    "Baião",
    "Xote",
  ];

  const commonSkills = [
    "Leitura de partitura",
    "Improvisação",
    "Composição",
    "Arranjo",
    "Produção musical",
    "Gravação",
    "Mixagem",
    "Masterização",
    "Backing vocals",
    "Harmonia vocal",
    "Técnica vocal",
    "Técnica instrumental",
    "Performance ao vivo",
    "Estúdio",
    "Direção musical",
    "Regência",
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Buscar perfil básico
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error loading profile:", profileError);
      }

      if (profile) {
        setDisplayName(profile.display_name || "");
        setPhone(profile.phone_e164 || "");
        setCity(profile.city || "");
        setState(profile.state || "");
        setPhotoUrl(profile.photo_url || "");
        setPhotoPreview(profile.photo_url || null);
        // Carregar raio de busca (se existir no perfil ou metadata)
        if ((profile as any).search_radius) {
          setSearchRadius((profile as any).search_radius);
        }
      }

      // Buscar perfil de músico (todos os usuários têm perfil de músico)
      {
        const { data: mp } = await supabase
          .from("musician_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (mp) {
          setBio(mp.bio || "");
          setInstruments(mp.instruments || []);
          setGenres(mp.genres || []);
          setSkills(mp.skills || []);
          setSetup(mp.setup || []);
          setPortfolioLinks(mp.portfolio_links || []);
          
          // Carregar dados extras do JSONB (se existir)
          const metadata = mp.strengths_counts as any || {};
          if (metadata.socialMedia) {
            setSocialMedia(metadata.socialMedia);
          }
          if (metadata.sheetMusicReading) {
            setSheetMusicReading(metadata.sheetMusicReading);
          }
          if (metadata.repertoire) {
            setRepertoire(metadata.repertoire);
          }
          if (metadata.yearsExperience) {
            setYearsExperience(metadata.yearsExperience);
          }
          if (metadata.musicalEducation) {
            setMusicalEducation(metadata.musicalEducation);
          }
          if (metadata.basePrice) {
            setBasePrice(metadata.basePrice);
          }
          if (metadata.searchRadius) {
            setSearchRadius(metadata.searchRadius);
          }
        }
      }
    } catch (err: any) {
      console.error("Error loading profile:", err);
      setError("Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  };

  const addToArray = (
    array: string[],
    setter: (arr: string[]) => void,
    value: string,
    clearInput: () => void
  ) => {
    if (value.trim() && !array.includes(value.trim())) {
      setter([...array, value.trim()]);
      clearInput();
    }
  };

  const removeFromArray = (
    array: string[],
    setter: (arr: string[]) => void,
    index: number
  ) => {
    setter(array.filter((_, i) => i !== index));
  };

  // Função para lidar com seleção de arquivo de foto
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setPhotoFile(file);
    setError(null);

    // Cria preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Função para remover foto selecionada
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(photoUrl || null); // Volta para a foto atual se existir
    if (photoInputRef.current) {
      photoInputRef.current.value = "";
    }
  };

  // Função para fazer upload da foto para Supabase Storage
  const uploadPhoto = async (userId: string): Promise<string | null> => {
    if (!photoFile) return null;

    setUploadingPhoto(true);
    try {
      // Gera nome único para o arquivo
      const fileExt = photoFile.name.split(".").pop();
      const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      // Faz upload para o bucket 'profile-photos' (ou 'public' se não existir)
      const { data, error } = await supabase.storage
        .from("profile-photos")
        .upload(filePath, photoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        // Se o bucket não existir, tenta usar 'public'
        if (error.message.includes("Bucket not found")) {
          const { data: publicData, error: publicError } = await supabase.storage
            .from("public")
            .upload(`${userId}/${fileName}`, photoFile, {
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

          setUploadingPhoto(false);
          return urlData.publicUrl;
        }

        throw error;
      }

      // Obtém URL pública
      const { data: urlData } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(filePath);

      setUploadingPhoto(false);
      return urlData.publicUrl;
    } catch (err: any) {
      console.error("Error uploading photo:", err);
      setError(`Erro ao fazer upload da foto: ${err.message}`);
      setUploadingPhoto(false);
      return null;
    }
  };

  const saveProfile = async () => {
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Usuário não autenticado.");
        setSaving(false);
        return;
      }

      // Faz upload da foto se houver arquivo selecionado
      let finalPhotoUrl = photoUrl;
      if (photoFile) {
        const uploadedUrl = await uploadPhoto(user.id);
        if (uploadedUrl) {
          finalPhotoUrl = uploadedUrl;
          setPhotoUrl(uploadedUrl);
        } else {
          setSaving(false);
          return; // Erro já foi setado na função uploadPhoto
        }
      }

      // Atualizar ou criar perfil básico
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: displayName.trim() || null,
          phone_e164: phone.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
          photo_url: finalPhotoUrl.trim() || null,
          user_type: "musician", // Todos os usuários são músicos
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Error saving profile:", profileError);
        setError(`Erro ao salvar perfil: ${profileError.message}`);
        setSaving(false);
        return;
      }

      // Atualizar ou criar perfil de músico (todos os usuários têm perfil de músico)
      {
        // Preparar metadata com dados extras
        const metadata = {
          socialMedia,
          sheetMusicReading,
          repertoire: repertoire.trim() || null,
          yearsExperience: yearsExperience && typeof yearsExperience === "number" ? yearsExperience : null,
          musicalEducation: musicalEducation.trim() || null,
          basePrice: basePrice && typeof basePrice === "number" ? basePrice : null,
          searchRadius: searchRadius,
        };

        const { error: musicianError } = await supabase
          .from("musician_profiles")
          .upsert({
            user_id: user.id,
            bio: bio.trim() || null,
            instruments: instruments.length > 0 ? instruments : [],
            genres: genres.length > 0 ? genres : [],
            skills: skills.length > 0 ? skills : [],
            setup: setup.length > 0 ? setup : [],
            portfolio_links: portfolioLinks.length > 0 ? portfolioLinks : [],
            strengths_counts: metadata as any, // Salva dados extras no JSONB
            updated_at: new Date().toISOString(),
          });

        if (musicianError) {
          console.error("Error saving musician profile:", musicianError);
          setError(`Erro ao salvar perfil de músico: ${musicianError.message}`);
          setSaving(false);
          return;
        }
      }

      setSuccess(true);
      setTimeout(() => {
        // Redireciona para o dashboard para ver o progresso atualizado
        router.push("/dashboard");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      console.error("Exception saving profile:", err);
      setError(err?.message ?? "Erro inesperado ao salvar perfil.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Editar Perfil</h1>
            <p className="text-sm text-muted-foreground">
              Atualize suas informações pessoais e profissionais
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-500 bg-green-50 px-4 py-3 text-sm text-green-800">
            Perfil salvo com sucesso! Redirecionando...
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveProfile();
          }}
          className="space-y-6"
        >
          {/* Informações Básicas */}
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-gray-900">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-900" htmlFor="displayName">
                  Nome de Exibição
                </label>
                <input
                  id="displayName"
                  type="text"
                  className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="phone">
                    Telefone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+5511999999999"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="photo">
                    Foto do Perfil
                  </label>
                  <div className="mt-1 space-y-2">
                    <input
                      ref={photoInputRef}
                      id="photo"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />
                    
                    {!photoPreview ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => photoInputRef.current?.click()}
                        className="w-full bg-white border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Selecionar Foto
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50">
                          <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-gray-200 bg-white flex items-center justify-center flex-shrink-0">
                            {photoPreview ? (
                              <img
                                src={photoPreview}
                                alt="Preview da foto"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {photoFile?.name || "Foto do perfil"}
                            </p>
                            {photoFile && (
                              <p className="text-xs text-gray-600">
                                {(photoFile.size / 1024).toFixed(1)} KB
                              </p>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleRemovePhoto}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full border-gray-300 text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Trocar Foto
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-gray-600">
                      Formatos aceitos: JPG, PNG, GIF (máximo 5MB)
                    </p>
                  </div>
                </div>
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
                    maxLength={2}
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    placeholder="SP"
                  />
                </div>
              </div>

              {/* Raio de Busca */}
              <div className="pt-2">
                <label className="text-sm font-medium text-gray-900 mb-3 block">
                  Raio de Busca de Trabalhos
                </label>
                <div className="space-y-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">0 km</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-orange-600">
                        {searchRadius} km
                      </span>
                    </div>
                    <span className="text-xs font-medium text-gray-700">200 km</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={200}
                    step={5}
                    value={searchRadius}
                    onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                    className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-orange-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:border-none"
                    style={{
                      background: `linear-gradient(to right, rgb(249 115 22) 0%, rgb(249 115 22) ${(searchRadius / 200) * 100}%, rgb(229 231 235) ${(searchRadius / 200) * 100}%, rgb(229 231 235) 100%)`
                    }}
                  />
                  <p className="text-xs text-gray-700 mt-2">
                    Você receberá convites para trabalhos dentro de <strong className="text-orange-600">{searchRadius} km</strong> da sua localização
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Perfil de Músico */}
          {
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Informações Profissionais (Músico)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="bio">
                    Biografia
                  </label>
                  <textarea
                    id="bio"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Conte um pouco sobre você..."
                  />
                </div>

                {/* Instrumentos */}
                <div>
                  <label className="text-sm font-medium text-gray-900">Instrumentos</label>
                  <div className="mt-1 flex gap-2">
                    <select
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={newInstrument}
                      onChange={(e) => setNewInstrument(e.target.value)}
                    >
                      <option value="">Selecione um instrumento</option>
                      {commonInstruments.map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addToArray(instruments, setInstruments, newInstrument, () =>
                          setNewInstrument("")
                        )
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {instruments.map((inst, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-800"
                      >
                        {inst}
                        <button
                          type="button"
                          onClick={() => removeFromArray(instruments, setInstruments, idx)}
                          className="text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gêneros */}
                <div>
                  <label className="text-sm font-medium text-gray-900">Gêneros Musicais</label>
                  <div className="mt-1 flex gap-2">
                    <select
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={newGenre}
                      onChange={(e) => setNewGenre(e.target.value)}
                    >
                      <option value="">Selecione um gênero</option>
                      {commonGenres.map((genre) => (
                        <option key={genre} value={genre}>
                          {genre}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addToArray(genres, setGenres, newGenre, () => setNewGenre(""))
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {genres.map((genre, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {genre}
                        <button
                          type="button"
                          onClick={() => removeFromArray(genres, setGenres, idx)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Equipamentos */}
                <div>
                  <label className="text-sm font-medium text-gray-900">Equipamentos</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="text"
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={newSetup}
                      onChange={(e) => setNewSetup(e.target.value)}
                      placeholder="Ex: Amplificador, Microfone..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToArray(setup, setSetup, newSetup, () => setNewSetup(""));
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray(setup, setSetup, newSetup, () => setNewSetup(""))}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {setup.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => removeFromArray(setup, setSetup, idx)}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links do Portfólio */}
                <div>
                  <label className="text-sm font-medium text-gray-900">Links do Portfólio</label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="url"
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={newPortfolioLink}
                      onChange={(e) => setNewPortfolioLink(e.target.value)}
                      placeholder="https://..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addToArray(
                            portfolioLinks,
                            setPortfolioLinks,
                            newPortfolioLink,
                            () => setNewPortfolioLink("")
                          );
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        addToArray(
                          portfolioLinks,
                          setPortfolioLinks,
                          newPortfolioLink,
                          () => setNewPortfolioLink("")
                        )
                      }
                    >
                      Adicionar
                    </Button>
                  </div>
                  <div className="mt-2 space-y-1">
                    {portfolioLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-orange-600 hover:underline"
                        >
                          {link}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeFromArray(portfolioLinks, setPortfolioLinks, idx)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Redes Sociais */}
                <div>
                  <label className="text-sm font-medium text-gray-900 mb-3 block">Redes Sociais</label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Instagram</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.instagram}
                        onChange={(e) => setSocialMedia({ ...socialMedia, instagram: e.target.value })}
                        placeholder="@seu_usuario"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Facebook</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.facebook}
                        onChange={(e) => setSocialMedia({ ...socialMedia, facebook: e.target.value })}
                        placeholder="URL ou nome do perfil"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">YouTube</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.youtube}
                        onChange={(e) => setSocialMedia({ ...socialMedia, youtube: e.target.value })}
                        placeholder="URL do canal"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">TikTok</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.tiktok}
                        onChange={(e) => setSocialMedia({ ...socialMedia, tiktok: e.target.value })}
                        placeholder="@seu_usuario"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Twitter/X</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.twitter}
                        onChange={(e) => setSocialMedia({ ...socialMedia, twitter: e.target.value })}
                        placeholder="@seu_usuario"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">LinkedIn</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.linkedin}
                        onChange={(e) => setSocialMedia({ ...socialMedia, linkedin: e.target.value })}
                        placeholder="URL do perfil"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">Spotify</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.spotify}
                        onChange={(e) => setSocialMedia({ ...socialMedia, spotify: e.target.value })}
                        placeholder="URL do artista"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 mb-1 block">SoundCloud</label>
                      <input
                        type="text"
                        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={socialMedia.soundcloud}
                        onChange={(e) => setSocialMedia({ ...socialMedia, soundcloud: e.target.value })}
                        placeholder="URL do perfil"
                      />
                    </div>
                  </div>
                </div>

                {/* Leitura de Partitura */}
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="sheetMusicReading">
                    Leitura de Partitura
                  </label>
                  <select
                    id="sheetMusicReading"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={sheetMusicReading}
                    onChange={(e) => setSheetMusicReading(e.target.value as any)}
                  >
                    <option value="none">Não leio partitura</option>
                    <option value="basic">Básico</option>
                    <option value="intermediate">Intermediário</option>
                    <option value="advanced">Avançado</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-600">
                    Seu nível de leitura de partitura musical
                  </p>
                </div>

                {/* Repertório */}
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="repertoire">
                    Repertório
                  </label>
                  <textarea
                    id="repertoire"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={5}
                    value={repertoire}
                    onChange={(e) => setRepertoire(e.target.value)}
                    placeholder="Liste suas músicas principais, artistas que você toca, ou gêneros específicos do seu repertório..."
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Descreva seu repertório, músicas principais, ou artistas que você costuma tocar
                  </p>
                </div>

                {/* Habilidades */}
                <div>
                  <label className="text-sm font-medium text-gray-900">Habilidades</label>
                  <div className="mt-1 flex gap-2">
                    <select
                      className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                    >
                      <option value="">Selecione uma habilidade</option>
                      {commonSkills
                        .filter((skill) => !skills.includes(skill))
                        .map((skill) => (
                          <option key={skill} value={skill}>
                            {skill}
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addToArray(skills, setSkills, newSkill, () => setNewSkill(""))}
                      disabled={!newSkill}
                    >
                      Adicionar
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-gray-600">
                    Selecione suas habilidades do menu dropdown
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeFromArray(skills, setSkills, idx)}
                          className="text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Experiência e Formação */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-900" htmlFor="yearsExperience">
                      Anos de Experiência
                    </label>
                    <input
                      id="yearsExperience"
                      type="number"
                      min="0"
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value ? Number(e.target.value) : "")}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-900" htmlFor="basePrice">
                      Preço Base (R$)
                    </label>
                    <input
                      id="basePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value ? Number(e.target.value) : "")}
                      placeholder="0.00"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Seu valor base por show (opcional)
                    </p>
                  </div>
                </div>

                {/* Formação Musical */}
                <div>
                  <label className="text-sm font-medium text-gray-900" htmlFor="musicalEducation">
                    Formação Musical
                  </label>
                  <textarea
                    id="musicalEducation"
                    className="mt-1 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    value={musicalEducation}
                    onChange={(e) => setMusicalEducation(e.target.value)}
                    placeholder="Ex: Conservatório de Música, Curso de Violão, Aulas particulares, Autodidata..."
                  />
                  <p className="mt-1 text-xs text-gray-600">
                    Descreva sua formação musical, cursos, conservatórios, ou experiência de aprendizado
                  </p>
                </div>
              </CardContent>
            </Card>
          }

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
            <Button type="submit" disabled={saving || uploadingPhoto} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Save className="mr-2 h-4 w-4" />
              {saving || uploadingPhoto ? (uploadingPhoto ? "Enviando foto..." : "Salvando...") : "Salvar Perfil"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

