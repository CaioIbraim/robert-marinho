import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

// ==========================
// EXCEL
// ==========================
export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// ==========================
// PDF LISTAGEM
// ==========================
export const exportToPDF = (
  data: any[],
  columns: { header: string; dataKey: string }[],
  filename: string,
  title: string
) => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(title, 14, 22);

  autoTable(doc, {
    startY: 30,
    head: [columns.map(c => c.header)],
    body: data.map(item => columns.map(c => item[c.dataKey])),
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }
  });

  doc.save(`${filename}.pdf`);
};
// ==========================
// RECIBO COMPLETO COM PIX
// ==========================
export const generatePaymentReceipt = async (ordem: any, empresa: any, paradas: any[] = []) => {
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

  // Carregar Assinatura
  let signatureImg = null;
  try {
    const sigBlob = await fetch('/assinatura.png').then(res => res.blob());
    signatureImg = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(sigBlob);
    });
  } catch (e) {
    console.warn('Erro ao carregar assinatura');
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

  let currentY = 118;
  if (paradas && paradas.length > 0) {
    paradas.forEach((p, idx) => {
      doc.text(`Parada ${idx + 1}: ${p.endereco_ponto}`, 20, currentY);
      currentY += 8;
    });
  }

  doc.text(`Destino: ${ordem.destino || '—'}`, 20, currentY);
  currentY += 8;
  doc.text(`Motorista: ${ordem.motorista?.nome || 'N/A'}`, 20, currentY);
  currentY += 8;
  doc.text(`Veículo: ${ordem.veiculo?.placa || 'N/A'}`, 20, currentY);

  // Ajusta o Y do próximo título
  const cronogramaY = currentY + 16;

  // ==========================
  // ⏱️ CRONOGRAMA
  // ==========================
  doc.setFontSize(13);
  doc.text('Cronograma', 20, cronogramaY);

  const formatDateTime = (date: string) =>
    date ? new Date(date).toLocaleString('pt-BR') : '—';

  doc.setFontSize(11);
  doc.text(`Data do Serviço: ${formatDateTime(ordem.data_execucao)}`, 20, cronogramaY + 10);
  doc.text(`Check-in: ${formatDateTime(ordem.horario_inicio)}`, 20, cronogramaY + 18);
  doc.text(`Check-out: ${formatDateTime(ordem.horario_fim)}`, 20, cronogramaY + 26);

  const financeiroY = cronogramaY + 35;

  // ==========================
  // 💰 VALOR E DETALHAMENTO
  // ==========================
  doc.line(20, financeiroY, 190, financeiroY);

  const totalInDB = Number(ordem.valor_faturamento || 0);
  const scheduled = new Date(ordem.data_execucao);
  const checkin = ordem.horario_inicio ? new Date(ordem.horario_inicio) : null;
  let waitMinutes = 0;
  let waitCharge = 0;

  if (checkin && checkin > scheduled) {
    waitMinutes = Math.floor((checkin.getTime() - scheduled.getTime()) / 60000);
    // 30 min de tolerância, depois R$ 100,00 por hora (R$ 1,67 por minuto)
    if (waitMinutes > 30) {
      waitCharge = (waitMinutes - 30) * (100 / 60);
    }
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (waitCharge > 0) {
    const baseValue = totalInDB - waitCharge;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Valor Base do Serviço: ${formatCurrency(baseValue)}`, 20, financeiroY + 10);
    doc.setTextColor(231, 76, 60); // Vermelho para o extra
    doc.text(`Adicional de Espera (${waitMinutes} min - 30m Tol.): ${formatCurrency(waitCharge)}`, 20, financeiroY + 17);

    doc.setFontSize(15);
    doc.setTextColor(0, 128, 0);
    doc.text(`Valor Total: ${formatCurrency(totalInDB)}`, 20, financeiroY + 30);
  } else {
    doc.setFontSize(15);
    doc.setTextColor(0, 128, 0);
    doc.text(`Valor Total: ${formatCurrency(totalInDB)}`, 20, financeiroY + 15);
  }

  // ==========================
  // 💸 QR CODE PIX (NOVO)
  // ==========================
  const chavePix = 'SUA_CHAVE_PIX_AQUI'; // ⚠️ TROCAR ISSO

  // Payload simples (funciona na maioria dos bancos)
  const payloadPix = `00020126580014BR.GOV.BCB.PIX01${chavePix.length}${chavePix}520400005303986540${totalInDB.toFixed(2)}5802BR5913${(empresa?.razao_social || 'EMPRESA').substring(0, 13)}6009SAO PAULO62070503***6304`;

  try {
    const qrCodeBase64 = await QRCode.toDataURL(payloadPix);

    doc.addImage(qrCodeBase64, 'PNG', 140, financeiroY + 5, 35, 35);

    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Pague via PIX', 157, financeiroY + 43, { align: 'center' });

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
    financeiroY + 45
  );
  doc.text(
    'aos serviços de transporte executados conforme esta ordem de serviço.',
    20,
    financeiroY + 51
  );

  // ==========================
  // ✍️ ASSINATURA
  // ==========================
  // ==========================
  // ✍️ ASSINATURA
  // ==========================
  doc.line(60, 255, 150, 255);
  doc.setFontSize(11);
  doc.text('Assinatura do Responsável', 105, 263, { align: 'center' });

  // Imagem ilustrativa no rodapé — Ocupando largura total
  if (signatureImg) {
    doc.addImage(signatureImg, 'PNG', 15, 266, 180, 37);
  }

  // ==========================
  // 💾 SALVAR
  // ==========================
  doc.save(`recibo_${ordem.id?.slice(0, 8) || 'os'}.pdf`);
};