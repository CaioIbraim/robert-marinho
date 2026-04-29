import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';

interface CroppedAreaPixels {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const ConfigProfile = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    nome: user?.user_metadata?.full_name || '',
    full_name: user?.user_metadata?.full_name || '',
    status: 'ativo',
    aprovado_operador: false,
  });

  const [avatarUrl, setAvatarUrl] = useState(
    user?.user_metadata?.avatar_url || ''
  );

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);

  /* =========================
     HANDLERS
  ========================= */
  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const onCropComplete = useCallback(
    (_: unknown, croppedPixels: CroppedAreaPixels) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  /* =========================
     CROP IMAGE
  ========================= */
  const getCroppedImg = async (): Promise<Blob> => {
    if (!imageSrc || !croppedAreaPixels) {
      throw new Error('Imagem não selecionada');
    }

    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Erro ao criar canvas');

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Erro ao gerar imagem'));
        else resolve(blob);
      }, 'image/jpeg');
    });
  };

  /* =========================
     UPLOAD AVATAR
  ========================= */
  const handleUpload = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const croppedBlob = await getCroppedImg();

      const compressedFile = await imageCompression(
        new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' }),
        {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 512,
        }
      );

      const filePath = `${user.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(publicUrl);

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl },
      });

      // 🔥 FIX ROLE AQUI
      await supabase.from('perfis').upsert({
        id: user.id,
        email: user.email,
        avatar_url: publicUrl,
        role: 'operador',
      });

      setImageSrc(null);

    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     SAVE PROFILE
  ========================= */
  const handleSave = async () => {
    if (!user) return;

    try {
      setLoading(true);

      await supabase.auth.updateUser({
        data: { full_name: form.full_name },
      });

      await supabase.from('perfis').upsert({
        id: user.id,
        email: user.email,
        full_name: form.full_name,
        nome: form.nome,
        status: form.status,
        aprovado_operador: form.aprovado_operador,
        role: 'operador', // 🔥 obrigatório por causa do constraint
      });

      alert('Perfil atualizado com sucesso!');

    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     UI
  ========================= */
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline"
        >
          ← Voltar
        </button>

        <h1 className="text-xl font-bold text-white">
          Configurações de Perfil
        </h1>
      </div>

      <div className="bg-surface border border-border rounded-2xl p-6 space-y-6">

        {/* AVATAR */}
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-border">
            {avatarUrl ? (
              <img src={avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="flex items-center justify-center h-full text-white">
                {user?.email?.[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <label className="cursor-pointer text-primary text-sm hover:underline">
            Alterar foto
            <input type="file" hidden onChange={onSelectFile} />
          </label>
        </div>

        {/* FORM GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input
            className="input"
            placeholder="Nome"
            value={form.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
          />

          <input
            className="input"
            placeholder="Nome completo"
            value={form.full_name}
            onChange={(e) => handleChange('full_name', e.target.value)}
          />

          <input
            className="input opacity-60"
            value={user?.email || ''}
            disabled
          />

          <input
            className="input opacity-60"
            value="operador"
            disabled
          />

          <input
            className="input"
            placeholder="Status"
            value={form.status}
            onChange={(e) => handleChange('status', e.target.value)}
          />

          <label className="flex items-center gap-2 text-white">
            <input
              type="checkbox"
              checked={form.aprovado_operador}
              onChange={(e) =>
                handleChange('aprovado_operador', e.target.checked)
              }
            />
            Operador aprovado
          </label>
        </div>

        {/* ACTION */}
        <button
          onClick={handleSave}
          className="w-full bg-primary py-3 rounded-xl text-white font-semibold"
        >
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>

      {/* MODAL CROP */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-surface p-6 rounded-xl w-[400px] space-y-4">

            <div className="relative w-full h-64 bg-black">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />

            <div className="flex justify-end gap-2">
              <button onClick={() => setImageSrc(null)}>
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                className="bg-primary px-4 py-2 rounded text-white"
              >
                {loading ? 'Enviando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STYLE */}
      <style>{`
        .input {
          background: #18181b;
          border: 1px solid #27272a;
          padding: 12px;
          border-radius: 12px;
          color: white;
          outline: none;
          transition: all 0.2s;
        }
        .input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 2px rgba(239,68,68,0.2);
        }
      `}</style>

    </div>
  );
};