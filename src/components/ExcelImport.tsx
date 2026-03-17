import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, Download, FileSpreadsheet, Check, X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCFA } from "@/lib/store";
import { toast } from "sonner";

interface ImportRow {
  reference: string;
  name: string;
  category: string;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  stock_min: number;
  error?: string;
}

interface ExcelImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (rows: Omit<ImportRow, "error">[]) => Promise<void>;
}

const TEMPLATE_COLUMNS = [
  "Référence",
  "Nom du Produit",
  "Catégorie",
  "Prix d'Achat (FCFA)",
  "Prix de Vente (FCFA)",
  "Stock Initial",
  "Stock Minimum",
];

function downloadTemplate() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    TEMPLATE_COLUMNS,
    ["REF-001", "Piston Kit Yamaha 125", "Moteur", 15000, 25000, 10, 5],
    ["REF-002", "Plaquette de frein AX100", "Freinage", 3000, 6000, 20, 10],
    ["REF-003", "Chaîne 428H", "Transmission", 8000, 14000, 15, 5],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sampleData);

  // Column widths
  ws["!cols"] = [
    { wch: 14 },
    { wch: 30 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 14 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Produits");
  XLSX.writeFile(wb, "Modele_Import_Stock_AliyahShop.xlsx");
}

function parseFile(file: File): Promise<ImportRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(ws);

        const rows: ImportRow[] = json.map((row: any, idx: number) => {
          const ref = String(row["Référence"] || row["Reference"] || row["reference"] || row["ref"] || "").trim();
          const name = String(row["Nom du Produit"] || row["Nom"] || row["nom"] || row["name"] || "").trim();
          const category = String(row["Catégorie"] || row["Categorie"] || row["category"] || row["categorie"] || "").trim();
          const prix_achat = Number(row["Prix d'Achat (FCFA)"] || row["Prix Achat"] || row["prix_achat"] || row["prix achat"] || 0);
          const prix_vente = Number(row["Prix de Vente (FCFA)"] || row["Prix Vente"] || row["prix_vente"] || row["prix vente"] || 0);
          const stock = Number(row["Stock Initial"] || row["Stock"] || row["stock"] || 0);
          const stock_min = Number(row["Stock Minimum"] || row["Stock Min"] || row["stock_min"] || 5);

          let error: string | undefined;
          if (!ref) error = "Référence manquante";
          else if (!name) error = "Nom manquant";
          else if (isNaN(prix_achat) || prix_achat < 0) error = "Prix d'achat invalide";
          else if (isNaN(prix_vente) || prix_vente < 0) error = "Prix de vente invalide";

          return { reference: ref, name, category, prix_achat, prix_vente, stock: Math.max(0, stock), stock_min: Math.max(0, stock_min), error };
        });

        resolve(rows);
      } catch {
        reject(new Error("Fichier invalide. Utilisez le modèle Excel fourni."));
      }
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier."));
    reader.readAsArrayBuffer(file);
  });
}

export default function ExcelImport({ open, onOpenChange, onImport }: ExcelImportProps) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validRows = rows.filter((r) => !r.error);
  const errorRows = rows.filter((r) => r.error);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const parsed = await parseFile(file);
      setRows(parsed);
      if (parsed.length === 0) toast.error("Aucune ligne trouvée dans le fichier.");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      await onImport(validRows.map(({ error, ...r }) => r));
      toast.success(`${validRows.length} produit(s) importé(s) avec succès !`);
      setRows([]);
      onOpenChange(false);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'import.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = (v: boolean) => {
    if (!v) {
      setRows([]);
      if (fileRef.current) fileRef.current.value = "";
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-card border-border max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" /> Import Excel — Stock
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Step 1: Download template */}
          <div className="flex items-center gap-3 p-3 rounded border border-border bg-muted/30">
            <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0">1</span>
            <div className="flex-1">
              <p className="text-sm font-medium">Télécharger le modèle Excel</p>
              <p className="text-xs text-muted-foreground">Remplissez-le avec vos articles puis importez-le</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1 border-border text-foreground" onClick={downloadTemplate}>
              <Download className="w-3.5 h-3.5" /> Modèle
            </Button>
          </div>

          {/* Step 2: Upload file */}
          <div className="flex items-center gap-3 p-3 rounded border border-border bg-muted/30">
            <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center shrink-0">2</span>
            <div className="flex-1">
              <p className="text-sm font-medium">Importer votre fichier</p>
              <p className="text-xs text-muted-foreground">Formats acceptés : .xlsx, .xls, .csv</p>
            </div>
            <label className="cursor-pointer">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
              <Button size="sm" variant="outline" className="gap-1 border-primary text-primary pointer-events-none" asChild>
                <span><Upload className="w-3.5 h-3.5" /> {loading ? "Lecture..." : "Choisir"}</span>
              </Button>
            </label>
          </div>

          {/* Preview */}
          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-green-500 font-medium">
                  <Check className="w-4 h-4" /> {validRows.length} valide(s)
                </span>
                {errorRows.length > 0 && (
                  <span className="flex items-center gap-1 text-destructive font-medium">
                    <AlertTriangle className="w-4 h-4" /> {errorRows.length} erreur(s)
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-border rounded">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-2 text-xs uppercase text-muted-foreground">Réf</th>
                      <th className="text-left p-2 text-xs uppercase text-muted-foreground">Nom</th>
                      <th className="text-left p-2 text-xs uppercase text-muted-foreground">Cat.</th>
                      <th className="text-right p-2 text-xs uppercase text-muted-foreground">P. Achat</th>
                      <th className="text-right p-2 text-xs uppercase text-muted-foreground">P. Vente</th>
                      <th className="text-right p-2 text-xs uppercase text-muted-foreground">Stock</th>
                      <th className="text-center p-2 text-xs uppercase text-muted-foreground">État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx} className={`border-b border-border ${row.error ? "bg-destructive/5" : ""}`}>
                        <td className="p-2 font-mono text-xs">{row.reference || "—"}</td>
                        <td className="p-2">{row.name || "—"}</td>
                        <td className="p-2 text-muted-foreground">{row.category || "—"}</td>
                        <td className="p-2 font-mono text-right">{formatCFA(row.prix_achat)}</td>
                        <td className="p-2 font-mono text-right">{formatCFA(row.prix_vente)}</td>
                        <td className="p-2 font-mono text-right">{row.stock}</td>
                        <td className="p-2 text-center">
                          {row.error ? (
                            <span className="text-xs text-destructive flex items-center justify-center gap-1">
                              <X className="w-3 h-3" /> {row.error}
                            </span>
                          ) : (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Button
                onClick={handleImport}
                disabled={validRows.length === 0 || importing}
                className="w-full bg-primary text-primary-foreground font-bold gap-2"
              >
                <Upload className="w-4 h-4" />
                {importing ? "Import en cours..." : `Importer ${validRows.length} produit(s)`}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
