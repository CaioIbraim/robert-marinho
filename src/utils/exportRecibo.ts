import jsPDF from 'jspdf';

import QRCode from 'qrcode';

// ==========================
// RECIBO COMPLETO COM PIX
// ==========================
export const generatePaymentReceipt = async (ordem: any, empresa: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // ==========================
  // 🖼️ LOGO
  // ==========================
  const logoUrl = '/logo.png';

  try {
    const img = await fetch(logoUrl)
      .then(res => res.blob())
      .then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }));

    doc.addImage(img, 'PNG', 20, 10, 30, 15);
  } catch {
    console.warn('Erro ao carregar logo');
  }

  // ==========================
  // 🧾 TÍTULO
  // ==========================
  doc.setFontSize(20);
  doc.setTextColor(41, 128, 185);
  
  doc.text('RECIBO DE PAGAMENTO', pageWidth / 2, 25, { align: 'center' });

  // ==========================
  // 📄 CABEÇALHO
  // ==========================
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);

  doc.text(`Nº da Ordem: ${ordem.id?.slice(0, 8)?.toUpperCase() || 'N/A'}`, 20, 45);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 130, 45);

  doc.line(20, 50, 190, 50);

  // ==========================
  // 🏢 EMPRESA
  // ==========================
  doc.setFontSize(13);
  doc.text('Dados do Cliente', 20, 65);

  doc.setFontSize(11);
  doc.text(`Empresa: ${empresa?.razao_social || 'N/A'}`, 20, 75);
  doc.text(`CNPJ: ${empresa?.cnpj || 'N/A'}`, 20, 83);

  // ==========================
  // 🚚 SERVIÇO
  // ==========================
  doc.setFontSize(13);
  doc.text('Detalhes do Serviço', 20, 100);

  doc.setFontSize(11);
  doc.text(`Origem: ${ordem.origem || '—'}`, 20, 110);
  doc.text(`Destino: ${ordem.destino || '—'}`, 20, 118);
  doc.text(`Motorista: ${ordem.motorista?.nome || 'N/A'}`, 20, 126);
  doc.text(`Veículo: ${ordem.veiculo?.placa || 'N/A'}`, 20, 134);

  // ==========================
  // ⏱️ CRONOGRAMA
  // ==========================
  doc.setFontSize(13);
  doc.text('Cronograma', 20, 150);

  const formatDateTime = (date: string) =>
    date ? new Date(date).toLocaleString('pt-BR') : '—';

  doc.setFontSize(11);
  doc.text(`Data do Serviço: ${formatDateTime(ordem.data_execucao)}`, 20, 160);
  doc.text(`Check-in: ${formatDateTime(ordem.horario_inicio)}`, 20, 168);
  doc.text(`Check-out: ${formatDateTime(ordem.horario_fim)}`, 20, 176);

  // ==========================
  // 💰 VALOR E DETALHAMENTO
  // ==========================
  doc.line(20, 185, 190, 185);

  const total = Number(ordem.valor_faturamento || 0);
  const scheduled = new Date(ordem.data_execucao);
  const checkin = new Date(ordem.horario_inicio);
  let waitMinutes = 0;
  
  if (checkin > scheduled) {
    waitMinutes = Math.floor((checkin.getTime() - scheduled.getTime()) / 60000);
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (waitMinutes > 0) {
    const baseValue = total / (1 + (waitMinutes * 0.1));
    const extraValue = total - baseValue;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Valor Base do Serviço: ${formatCurrency(baseValue)}`, 20, 195);
    doc.setTextColor(231, 76, 60); // Vermelho para o extra
    doc.text(`Adicional de Espera (${waitMinutes} min): ${formatCurrency(extraValue)}`, 20, 202);
    
    doc.setFontSize(15);
    doc.setTextColor(0, 128, 0);
    doc.text(`Valor Total: ${formatCurrency(total)}`, 20, 215);
  } else {
    doc.setFontSize(15);
    doc.setTextColor(0, 128, 0);
    doc.text(`Valor Total: ${formatCurrency(total)}`, 20, 200);
  }

  // ==========================
  // 💸 QR CODE PIX (NOVO)
  // ==========================
  const chavePix = 'SUA_CHAVE_PIX_AQUI'; // ⚠️ TROCAR ISSO

  // Payload simples (funciona na maioria dos bancos)
  const payloadPix = `00020126580014BR.GOV.BCB.PIX01${chavePix.length}${chavePix}520400005303986540${total.toFixed(2)}5802BR5913${(empresa?.razao_social || 'EMPRESA').substring(0, 13)}6009SAO PAULO62070503***6304`;

  try {
    const qrCodeBase64 = await QRCode.toDataURL(payloadPix);

    doc.addImage(qrCodeBase64, 'PNG', 140, 190, 35, 35);

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Pague via PIX', 157, 228, { align: 'center' });

  } catch (err) {
    console.error('Erro ao gerar QR Code PIX', err);
  }

  // ==========================
  // 📝 TEXTO LEGAL
  // ==========================
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);

  doc.text(
    'Declaramos para os devidos fins que recebemos a importância acima detalhada referente',
    20,
    220
  );
  doc.text(
    'aos serviços de transporte executados conforme esta ordem de serviço.',
    20,
    226
  );

  // ==========================
  // ✍️ ASSINATURA
  // ==========================
  doc.line(60, 260, 150, 260);
  doc.setFontSize(11);
  doc.text('Assinatura do Responsável', 105, 268, { align: 'center' });

  // ==========================
  // 💾 SALVAR
  // ==========================
  doc.save(`recibo_${ordem.id?.slice(0, 8) || 'os'}.pdf`);
};