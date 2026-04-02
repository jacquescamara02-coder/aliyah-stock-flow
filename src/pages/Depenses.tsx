import { useState } from "react";
import { useDepenses, useAddDepense, useDeleteDepense } from "@/hooks/useDepenses";
import { formatCFA } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Receipt } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORIES = ["Transport", "Loyer", "Électricité", "Eau", "Téléphone", "Nourriture", "Salaire", "Réparation", "Autre"];

export default function Depenses() {
  const { data: depenses = [] } = useDepenses();
  const addDepense = useAddDepense();
  const deleteDepense = useDeleteDepense();

  const [description, setDescription] = useState("");
  const [montant, setMontant] = useState("");
  const [categorie, setCategorie] = useState("Autre");
  const [dateDepense, setDateDepense] = useState(new Date().toISOString().split("T")[0]);
  const [filterMonth, setFilterMonth] = useState("");

  const filtered = filterMonth
    ? depenses.filter((d) => d.date_depense.startsWith(filterMonth))
    : depenses;
  const totalMois = filtered.reduce((s, d) => s + d.montant, 0);

  const handleAdd = () => {
    if (!description.trim() || !montant) {
      toast.error("Remplissez la description et le montant");
      return;
    }
    addDepense.mutate(
      { description: description.trim(), montant: Number(montant), categorie, date_depense: dateDepense },
      {
        onSuccess: () => {
          toast.success("Dépense ajoutée");
          setDescription("");
          setMontant("");
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dépenses Diverses</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestion de vos dépenses courantes</p>
      </div>

      {/* Add form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded p-5 space-y-4">
        <h2 className="label-industrial">Nouvelle Dépense</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Input type="number" placeholder="Montant (FCFA)" value={montant} onChange={(e) => setMontant(e.target.value)} />
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={categorie}
            onChange={(e) => setCategorie(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <Input type="date" value={dateDepense} onChange={(e) => setDateDepense(e.target.value)} />
          <Button onClick={handleAdd} disabled={addDepense.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Ajouter
          </Button>
        </div>
      </motion.div>

      {/* Filter & Total */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-48" />
          <Button variant={filterMonth === "" ? "default" : "outline"} size="sm" onClick={() => setFilterMonth("")}>
            Tout
          </Button>
          <Button variant={filterMonth === new Date().toISOString().slice(0, 7) ? "default" : "outline"} size="sm" onClick={() => setFilterMonth(new Date().toISOString().slice(0, 7))}>
            Ce mois
          </Button>
        </div>
        <div className="bg-card border border-border rounded px-4 py-2">
          <span className="text-sm text-muted-foreground mr-2">{filterMonth ? "Total du mois:" : "Total général:"}</span>
          <span className="font-mono font-bold text-primary">{formatCFA(totalMois)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_120px_120px_50px] gap-0 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>Description</span>
          <span>Catégorie</span>
          <span>Date</span>
          <span className="text-right">Montant</span>
          <span></span>
        </div>
        {filtered.map((d) => (
          <div key={d.id} className="grid grid-cols-[1fr_1fr_120px_120px_50px] gap-0 px-4 py-3 border-t border-border items-center text-sm">
            <span>{d.description}</span>
            <span className="text-muted-foreground">{d.categorie}</span>
            <span className="font-mono text-xs">{new Date(d.date_depense).toLocaleDateString("fr-FR")}</span>
            <span className="font-mono font-bold text-right text-destructive">-{formatCFA(d.montant)}</span>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer cette dépense ?</AlertDialogTitle>
                  <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={() => deleteDepense.mutate(d.id, { onSuccess: () => toast.success("Dépense supprimée") })}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Aucune dépense pour cette période</p>}
      </div>
    </div>
  );
}
