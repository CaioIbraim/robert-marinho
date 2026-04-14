import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToExcel = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (data: any[], columns: { header: string; dataKey: string }[], filename: string, title: string) => {
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

export const generatePaymentReceipt = (ordem: any, empresa: any) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185);
  doc.text('RECIBO DE PAGAMENTO', 105, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text(`Nº da Ordem: ${ordem.id.slice(0, 8).toUpperCase()}`, 20, 50);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 140, 50);
  
  doc.setLineWidth(0.5);
  doc.line(20, 55, 190, 55);
  
  doc.setFontSize(14);
  doc.text('Dados do Pagador (Cliente):', 20, 70);
  doc.setFontSize(12);
  doc.text(`Empresa: ${empresa?.razao_social || 'N/A'}`, 20, 80);
  doc.text(`CNPJ: ${empresa?.cnpj || 'N/A'}`, 20, 88);
  
  doc.setFontSize(14);
  doc.text('Detalhes do Serviço:', 20, 110);
  doc.setFontSize(12);
  doc.text(`Origem: ${ordem.origem}`, 20, 120);
  doc.text(`Destino: ${ordem.destino}`, 20, 128);
  doc.text(`Motorista: ${ordem.motorista?.nome || 'N/A'}`, 20, 136);
  doc.text(`Veículo: ${ordem.veiculo?.placa || 'N/A'}`, 20, 144);
  
  doc.line(20, 155, 190, 155);
  
  doc.setFontSize(16);
  const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(ordem.valor_total);
  doc.text(`Valor Total: ${formattedValue}`, 20, 170);
  
  doc.setFontSize(11);
  doc.text('Declaramos para os devidos fins que recebemos a importância acima detalhada', 20, 190);
  doc.text('referente aos serviços de transporte executados conforme as especificações.', 20, 196);
  
  doc.line(60, 240, 150, 240);
  doc.setFontSize(12);
  doc.text('Assinatura do Responsável', 105, 248, { align: 'center' });
  
  doc.save(`recibo_${ordem.id.slice(0, 8)}.pdf`);
};
