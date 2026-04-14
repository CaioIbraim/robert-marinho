import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';

export const Profile = () => {
  const user = useAuthStore((state) => state.user);

  const [nome, setNome] = useState(user?.user_metadata?.nome || '');
  const [loading, setLoading] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || '');

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // 📸 Seleção da imagem
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setImageSrc(URL.createObjectURL(file));
    }
  };

  // ✂️ captura área cortada
  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  // 🔧 cria imagem cortada
  const getCroppedImg = async () => {
    const image = new Image();
    image.src = imageSrc!;

    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

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

    return new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg');
    });
  };

  // 🚀 Upload final
  const handleUpload = async () => {
    try {
      setLoading(true);

      const croppedBlob = await getCroppedImg();

      // ⚡ compressão
      const compressedFile = await imageCompression(
        new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' }),
        {
          maxSizeMB: 0.3,
          maxWidthOrHeight: 512,
        }
      );

      const filePath = `${user.id}/${Date.now()}.jpg`;

      const { error } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);

      await supabase.auth.updateUser({
        data: {
          avatar_url: data.publicUrl
        }
      });

      await supabase
        .from('perfis')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user!.id);

      setImageSrc(null);

    } catch (err: any) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 💾 salvar nome
  const handleSave = async () => {
  if (!user) return;

  setLoading(true);

  try {
    // atualiza auth
    await supabase.auth.updateUser({
      data: { nome }
    });

    // atualiza tabela perfis
    await supabase
      .from('perfis')
      .update({ nome })
      .eq('id', user.id);

  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="max-w-3xl mx-auto space-y-8">

      <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>

      <div className="bg-surface border border-border rounded-xl p-6 space-y-6">

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
            <input type="file" accept="image/*" hidden onChange={onSelectFile} />
          </label>
        </div>

        {/* CROP MODAL */}
        {imageSrc && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
            <div className="bg-surface p-6 rounded-lg w-[400px] space-y-4">

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
                <button onClick={() => setImageSrc(null)}>Cancelar</button>
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

        {/* FORM */}
        <div>
          <label className="text-sm text-text-muted">Nome</label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full mt-1 bg-background border border-border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <label className="text-sm text-text-muted">Email</label>
          <input
            value={user?.email || ''}
            disabled
            className="w-full mt-1 bg-border/30 border border-border rounded-md px-3 py-2"
          />
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-primary py-2 rounded text-white"
        >
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>

      </div>
    </div>
  );
};