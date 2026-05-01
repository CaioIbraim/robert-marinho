import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import { usePerfil } from '../../hooks/usePerfil';
import { Button } from '../../components/ui/Button';
import { User, Mail, Camera, Save, ArrowLeft, ShieldCheck } from 'lucide-react';
import { showToast } from '../../utils/swal';

interface CroppedAreaPixels {
  width: number;
  height: number;
  x: number;
  y: number;
}

export const ConfigProfile = () => {
  const user = useAuthStore((state) => state.user);
  const { data: perfil, isLoading: loadingPerfil } = usePerfil();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: '',
  });

  const [avatarUrl, setAvatarUrl] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);

  useEffect(() => {
    if (perfil) {
      setForm({
        nome: perfil.nome || perfil.full_name || '',
      });
      setAvatarUrl(perfil.avatar_url || '');
    }
  }, [perfil]);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setImageSrc(URL.createObjectURL(file));
    }
  };

  const onCropComplete = useCallback((_: unknown, croppedPixels: CroppedAreaPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const getCroppedImg = async (): Promise<Blob> => {
    if (!imageSrc || !croppedAreaPixels) throw new Error('Imagem não selecionada');
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
      croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
      0, 0, croppedAreaPixels.width, croppedAreaPixels.height
    );
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Erro ao gerar imagem'));
        else resolve(blob);
      }, 'image/jpeg');
    });
  };

  const handleUpload = async () => {
    if (!user || !perfil) return;
    try {
      setLoading(true);
      const croppedBlob = await getCroppedImg();
      const compressedFile = await imageCompression(
        new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' }),
        { maxSizeMB: 0.3, maxWidthOrHeight: 512 }
      );
      const filePath = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, compressedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;
      
      setAvatarUrl(publicUrl);
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      await supabase.from('perfis').update({ avatar_url: publicUrl }).eq('id', user.id);

      setImageSrc(null);
      showToast('Foto atualizada!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !perfil) return;
    try {
      setLoading(true);
      await supabase.auth.updateUser({ data: { full_name: form.nome } });
      const { error } = await supabase.from('perfis').update({
        nome: form.nome,
        full_name: form.nome,
      }).eq('id', user.id);

      if (error) throw error;
      showToast('Perfil atualizado!', 'success');
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loadingPerfil) return null;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-text-muted hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest text-primary">Voltar</span>
        </button>
        <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Meu Perfil</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* AVATAR COLUMN */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-surface border border-border rounded-[2.5rem] p-8 text-center shadow-xl">
             <div className="relative inline-block group">
                <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden bg-background border-4 border-surface shadow-2xl relative">
                  {avatarUrl ? (
                    <img src={avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl font-black text-primary bg-primary/10">
                      {user?.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white cursor-pointer hover:scale-110 active:scale-95 transition-all shadow-lg shadow-primary/20">
                    <Camera className="w-5 h-5" />
                    <input type="file" hidden onChange={onSelectFile} accept="image/*" />
                </label>
             </div>
             <div className="mt-4">
                <h2 className="text-white font-bold text-lg leading-tight">{perfil?.nome || 'Usuário'}</h2>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary px-2 py-1 bg-primary/10 rounded-full border border-primary/20 mt-2 inline-block">
                  {perfil?.role}
                </span>
             </div>
          </div>
        </div>

        {/* DETAILS COLUMN */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-surface border border-border rounded-[2.5rem] p-8 shadow-xl space-y-6">
            <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Seu Nome</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                    <input
                      className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-white input-focus"
                      placeholder="Nome completo"
                      value={form.nome}
                      onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">E-mail (Não editável)</label>
                  <div className="relative opacity-60">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      className="w-full bg-background border border-border rounded-2xl pl-12 pr-4 py-4 text-white cursor-not-allowed"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Status da Conta</label>
                  <div className="flex items-center gap-2 bg-background border border-border rounded-2xl px-4 py-4">
                    <ShieldCheck className={perfil?.aprovado_operador ? 'text-emerald-500' : 'text-amber-500'} size={20} />
                    <span className="text-white text-sm font-bold uppercase tracking-widest">
                       {perfil?.aprovado_operador ? 'Aprovado & Ativo' : 'Aguardando Aprovação'}
                    </span>
                  </div>
                </div>
            </div>

            <Button
              onClick={handleSave}
              className="w-full h-14 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2"
              isLoading={loading}
            >
              <Save className="w-5 h-5" /> Salvar Alterações
            </Button>
          </div>
        </div>
      </div>

      {imageSrc && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-border p-6 rounded-[2.5rem] w-full max-w-sm space-y-6 animate-in zoom-in">
            <h3 className="text-lg font-black text-white uppercase tracking-tighter text-center">Ajustar Foto</h3>
            <div className="relative w-full aspect-square bg-zinc-950 rounded-2xl overflow-hidden">
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
            <div className="space-y-4">
               <input
                 type="range"
                 min={1} max={3} step={0.1}
                 value={zoom}
                 onChange={(e) => setZoom(Number(e.target.value))}
                 className="w-full accent-primary"
               />
               <div className="flex gap-3">
                 <Button variant="ghost" onClick={() => setImageSrc(null)} className="flex-1">Cancelar</Button>
                 <Button onClick={handleUpload} className="flex-1" isLoading={loading}>Confirmar</Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};