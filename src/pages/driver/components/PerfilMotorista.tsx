import { useState, useCallback } from "react";
import { User, Mail, Shield, Settings, Camera, Save, X, CreditCard, Calendar, Truck, Key } from "lucide-react";
import { format, parseISO } from "date-fns";
import { supabase } from "../../../lib/supabaseClient";
import { showToast } from "../../../utils/swal";
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import { RedefinirSenhaModal } from './RedefinirSenhaModal';

interface PerfilMotoristaProps {
  motorista: any;
  perfil: any;
  onUpdate: () => void;
}

export const PerfilMotorista = ({ motorista, perfil, onUpdate }: PerfilMotoristaProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    nome: motorista?.nome || perfil?.full_name || '',
    telefone: motorista?.telefone || perfil?.phone || '',
    cnh: motorista?.cnh || '',
    categoria_cnh: motorista?.categoria_cnh || '',
    validade_cnh: motorista?.validade_cnh || '',
    chave_pix: motorista?.chave_pix || motorista?.pix_key || '',
    status_operacional: motorista?.status_operacional || 'disponível'
  });

  const onCropComplete = useCallback((_: any, croppedPixels: any) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setImageSrc(URL.createObjectURL(file));
    }
  };

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

  const handleUpload = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

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

      // Update Profile and Auth
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
      
      const { error: upsertErr } = await supabase.from('perfis').upsert({ 
        id: user.id, 
        avatar_url: publicUrl 
      });

      if (upsertErr) throw upsertErr;

      showToast("Foto atualizada com sucesso!");
      setImageSrc(null);
      onUpdate();
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");
      
      // 1. Atualiza Perfil
      const { error: perfilErr } = await supabase.from('perfis').upsert({
        id: user.id,
        full_name: formData.nome,
        nome: formData.nome
      });
      if (perfilErr) throw perfilErr;

      // 2. Atualiza Motorista
      const { error: motErr } = await supabase.from('motoristas').upsert({
        id: motorista.id,
        perfil_id: user.id,
        nome: formData.nome,
        telefone: formData.telefone,
        cnh: formData.cnh,
        categoria_cnh: formData.categoria_cnh,
        validade_cnh: formData.validade_cnh || null,
        chave_pix: formData.chave_pix,
        status_operacional: formData.status_operacional
      });
      if (motErr) throw motErr;

      showToast("Perfil atualizado com sucesso!");
      setIsEditing(false);
      onUpdate();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* HEADER CARD */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[40px] p-8 md:p-12 backdrop-blur-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
          <Truck className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center md:items-center">
          <div className="relative">
            <div className="w-32 h-32 md:w-44 md:h-44 bg-zinc-800 rounded-[3rem] border-4 border-white/10 shadow-2xl flex items-center justify-center text-5xl font-black text-zinc-600 overflow-hidden ring-8 ring-primary/5">
              {perfil?.avatar_url ? (
                <img src={perfil.avatar_url} className="w-full h-full object-cover" alt="Foto perfil" />
              ) : (
                perfil?.full_name?.charAt(0) || 'D'
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 bg-primary p-4 rounded-3xl shadow-xl border-4 border-zinc-900 cursor-pointer hover:scale-110 transition-transform active:scale-95">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" hidden onChange={onSelectFile} />
            </label>
          </div>

          <div className="text-center md:text-left space-y-6 flex-1">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <span className="text-primary text-[10px] font-black uppercase tracking-[0.4em] italic">Platinum Driver</span>
                <div className="h-[1px] w-12 bg-white/10"></div>
                <span className="text-green-500 text-[10px] font-black uppercase tracking-[0.4em] italic">Verificado</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter leading-none mb-4">
                {perfil?.full_name?.split(' ')[0]} <span className="text-primary">{perfil?.full_name?.split(' ').slice(1).join(' ')}</span>
              </h2>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-3 bg-zinc-950/50 px-5 py-3 rounded-2xl border border-white/5 backdrop-blur-md">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">{perfil?.email}</span>
              </div>
              <div className="flex items-center gap-3 bg-primary/10 px-5 py-3 rounded-2xl border border-primary/20 backdrop-blur-md">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-black text-primary uppercase tracking-widest">Acesso Liberado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CROP MODAL */}
      {imageSrc && (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-900 w-full max-w-lg rounded-[40px] border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Ajustar Foto</h3>
              <button onClick={() => setImageSrc(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-6 h-6 text-zinc-500" /></button>
            </div>
            <div className="p-8 space-y-8">
              <div className="relative w-full aspect-square bg-zinc-950 rounded-3xl overflow-hidden ring-4 ring-white/5">
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
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                  <span>Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-primary bg-zinc-800 h-2 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <button
                onClick={handleUpload}
                disabled={loading}
                className="w-full py-5 bg-white text-zinc-950 rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-primary hover:text-white transition-all shadow-2xl flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? <LoaderAnimation /> : <><Camera className="w-4 h-4" /> Finalizar Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILS GRID */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* INFO COLUMN */}
        <div className="md:col-span-2 space-y-8">
          <div className="bg-zinc-900/40 p-10 md:p-12 rounded-[40px] border border-white/5 backdrop-blur-xl">
            <header className="flex items-center justify-between mb-12">
              <h3 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-4">
                <User className="w-5 h-5 text-primary" /> Dados Profissionais
              </h3>
              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2.5 bg-white/5 hover:bg-primary/20 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 rounded-xl transition-all"
                >
                  Editar Perfil
                </button>
              )}
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
              <InfoField label="Nome Completo" value={formData.nome} isEditing={isEditing} 
                onChange={(v: string) => setFormData({...formData, nome: v})} icon={<User />} />
              
              <InfoField label="Telefone / WhatsApp" value={formData.telefone} isEditing={isEditing} 
                onChange={(v: string) => setFormData({...formData, telefone: v})} icon={<Mail />} />
              
              <InfoField label="Número CNH" value={formData.cnh} isEditing={isEditing} 
                onChange={(v: string) => setFormData({...formData, cnh: v})} icon={<CreditCard />} />
              
              <div className="grid grid-cols-2 gap-4">
                 <InfoField label="Cat. CNH" value={formData.categoria_cnh} isEditing={isEditing} 
                  onChange={(v: string) => setFormData({...formData, categoria_cnh: v})} icon={<Truck />} />
                 <InfoField label="Validade" value={formData.validade_cnh} isEditing={isEditing} type="date"
                  onChange={(v: string) => setFormData({...formData, validade_cnh: v})} icon={<Calendar />} />
              </div>

              <InfoField label="Chave PIX (Recebimentos)" value={formData.chave_pix} isEditing={isEditing} 
                onChange={(v: string) => setFormData({...formData, chave_pix: v})} icon={<CreditCard />} placeholder="E-mail, CPF ou Chave Aleatória" />
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5" /> Status Operacional
                </p>
                {isEditing ? (
                  <select 
                    value={formData.status_operacional}
                    onChange={e => setFormData({...formData, status_operacional: e.target.value})}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="disponível">Disponível</option>
                    <option value="em_viagem">Em Viagem</option>
                    <option value="férias">Férias</option>
                    <option value="afastado">Afastado</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 bg-zinc-950/30 px-5 py-4 rounded-2xl border border-white/5">
                    <div className={`w-2 h-2 rounded-full ${formData.status_operacional === 'disponível' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-zinc-600'}`}></div>
                    <p className="text-white font-bold text-sm capitalize">{formData.status_operacional}</p>
                  </div>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-4 mt-16 pt-10 border-t border-white/5">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-5 bg-zinc-950 text-zinc-500 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] border border-white/10 hover:bg-zinc-900 transition-all"
                >
                  Descartar
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex-2 py-5 bg-primary text-white rounded-3xl font-black uppercase tracking-[0.3em] text-[10px] hover:shadow-[0_20px_40px_rgba(255,107,0,0.2)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 min-w-[200px]"
                >
                  {loading ? <LoaderAnimation /> : <><Save className="w-4 h-4" /> Salvar Alterações</>}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR COLUMN */}
        <div className="space-y-8">
           <div className="bg-zinc-900/40 p-10 rounded-[40px] border border-white/5 backdrop-blur-xl">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                 <Shield className="w-4 h-4" /> Segurança
              </h3>
              <p className="text-zinc-600 text-xs leading-relaxed mb-8 font-medium">As informações da sua conta são protegidas com criptografia de ponta a ponta e auditoria constante robert marinho.</p>
              <div className="space-y-4">
                 <SidebarInfo label="CPF" value={motorista?.cpf ? `***.***.***-${motorista.cpf.slice(-2)}` : 'Não informado'} />
                 <SidebarInfo label="Data Início" value={motorista?.created_at ? format(parseISO(motorista.created_at), "dd MMM yyyy") : '-'} />
                 <SidebarInfo label="Licença" value="Ativa" success />
              </div>
           </div>

           <div className="bg-primary/5 p-10 rounded-[40px] border border-primary/10 backdrop-blur-xl group hover:border-primary/30 transition-all">
              <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter mb-2">Central de Ajuda</h4>
              <p className="text-zinc-600 text-xs font-medium leading-relaxed mb-8">Precisa de ajuda com sua documentação ou transferências?</p>
              <button 
                 onClick={() => setIsPasswordModalOpen(true)}
                 className="w-full py-4 mt-2 bg-zinc-950/50 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20 rounded-2xl hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"
              >
                 <Key className="w-3.5 h-3.5" /> Redefinir Minha Senha
              </button>
           </div>
        </div>
      </div>
      
      <RedefinirSenhaModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  );
};

const InfoField = ({ label, value, isEditing, onChange, icon, type = "text", placeholder }: any) => (
  <div className="space-y-3">
    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
      {icon && <span className="opacity-50"></span>} {label}
    </p>
    {isEditing ? (
      <input 
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white focus:border-primary outline-none transition-all placeholder:text-zinc-800"
      />
    ) : (
      <p className="text-white font-bold text-base px-1">{value || <span className="text-zinc-800 italic">Não informado</span>}</p>
    )}
  </div>
);

const SidebarInfo = ({ label, value, success }: any) => (
  <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
    <span className={`text-[10px] font-bold ${success ? 'text-green-500' : 'text-zinc-300'}`}>{value}</span>
  </div>
);

const LoaderAnimation = () => (
  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
);
