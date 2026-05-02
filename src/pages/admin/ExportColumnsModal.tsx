import { useState } from 'react';
import { X, FileSpreadsheet, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Col {
  key: string;
  label: string;
  getValue: (item: any) => any;
}

interface ExportColumnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  defaultColumns: Col[];
}

export function ExportColumnsModal({ isOpen, onClose, data, defaultColumns }: ExportColumnsModalProps) {
  const [selectedCols, setSelectedCols] = useState<string[]>(defaultColumns.map(c => c.key));

  if (!isOpen) return null;

  const toggleCol = (key: string) => {
    setSelectedCols((prev: string[]) => prev.includes(key) ? prev.filter((k: string) => k !== key) : [...prev, key]);
  };

  const handleExport = () => {
    const exportData = data.map((item: any) => {
      const row: Record<string, any> = {};
      defaultColumns.forEach((c: Col) => {
        if (selectedCols.includes(c.key)) {
          row[c.label] = c.getValue(item);
        }
      });
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fechamento');
    XLSX.writeFile(workbook, `fechamento_${new Date().getTime()}.xlsx`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-primary/10">
          <h2 className="text-white font-bold flex items-center gap-2"><FileSpreadsheet size={18} className="text-primary" /> Exportar Planilha</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-zinc-400">Selecione as colunas que deseja incluir no arquivo Excel:</p>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {defaultColumns.map((c: Col) => (
              <label key={c.key} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition">
                <div onClick={() => toggleCol(c.key)} className={`w-5 h-5 rounded flex items-center justify-center border ${selectedCols.includes(c.key) ? 'bg-primary border-primary text-white' : 'border-zinc-600'}`}>
                  {selectedCols.includes(c.key) && <Check size={14} />}
                </div>
                <span className="text-sm text-white" onClick={() => toggleCol(c.key)}>{c.label}</span>
              </label>
            ))}
          </div>
          <button onClick={handleExport} disabled={selectedCols.length === 0} className="w-full bg-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-red-600 transition disabled:opacity-50">
            Gerar Planilha
          </button>
        </div>
      </div>
    </div>
  );
}
