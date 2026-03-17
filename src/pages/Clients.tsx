import { useState } from "react";
import { useClients, useAddClient, useDeleteClient } from "@/hooks/useClients";
import { useVentes } from "@/hooks/useVentes";
import { formatCFA } from "@/lib/store";
import { motion } from "framer-motion";
import { Plus, Users, Phone, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Clients() {
  const { data: clients = [] } = useClients();
  const { data: ventes = [] } = useVentes();
  const addClientMut = useAddClient();
  const deleteClientMut = useDeleteClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const [nom, setNom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [adresse, setAdresse] = useState("");

  const handleAdd = async () => {
    if (!nom) { toast.error("Le nom est obligatoire."); return; }
    try {
      await addClientMut.mutateAsync({ nom, telephone, adresse });
      toast.success(`Client "${nom}" ajouté.`);
      setShowAdd(false);
      setNom(""); setTelephone(""); setAdresse("");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const clientVentes = selectedClient ? ventes.filter((v) => v.client_id === selectedClient) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm mt-1">{clients.length} clients enregistrés</p>
        </div>
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-bold gap-2"><Plus className="w-4 h-4" /> Nouveau Client</Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle>Nouveau Client</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div><label className="label-industrial">Nom complet *</label><input className="input-underline w-full mt-1" value={nom} onChange={(e) => setNom(e.target.value)} /></div>
              <div><label className="label-industrial">Téléphone</label><input className="input-underline w-full mt-1" value={telephone} onChange={(e) => setTelephone(e.target.value)} /></div>
              <div><label className="label-industrial">Adresse</label><input className="input-underline w-full mt-1" value={adresse} onChange={(e) => setAdresse(e.target.value)} /></div>
              <Button onClick={handleAdd} disabled={addClientMut.isPending} className="w-full bg-primary text-primary-foreground font-bold">
                {addClientMut.isPending ? "Ajout..." : "Ajouter"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded">
          {clients.map((c) => (
            <motion.div key={c.id} whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              className={`p-4 border-b border-border cursor-pointer transition-colors ${selectedClient === c.id ? "bg-accent/50" : ""}`}
              onClick={() => setSelectedClient(c.id)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded bg-muted flex items-center justify-center"><Users className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="font-medium">{c.nom}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {c.telephone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.telephone}</span>}
                      {c.adresse && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.adresse}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="label-industrial">Total Achats</p>
                    <p className="font-mono text-sm font-bold">{formatCFA(c.total_achats)}</p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button onClick={(e) => e.stopPropagation()} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer {c.nom} ?</AlertDialogTitle>
                        <AlertDialogDescription>Cette action est irréversible. Le client sera définitivement supprimé.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="border-border">Annuler</AlertDialogCancel>
                        <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={async () => {
                          try {
                            await deleteClientMut.mutateAsync(c.id);
                            if (selectedClient === c.id) setSelectedClient(null);
                            toast.success(`"${c.nom}" supprimé.`);
                          } catch (e: any) { toast.error(e.message); }
                        }}>Supprimer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="bg-card border border-border rounded p-6">
          {selectedClient ? (
            <div className="space-y-4">
              <h2 className="label-industrial">Historique des Achats</h2>
              {clientVentes.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun achat enregistré.</p>
              ) : (
                clientVentes.map((v) => (
                  <div key={v.id} className="border border-border rounded p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-mono text-xs text-muted-foreground">{new Date(v.created_at).toLocaleDateString('fr-FR')}</span>
                      <span className="font-mono text-sm font-bold">{formatCFA(v.total)}</span>
                    </div>
                    {v.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm text-muted-foreground">
                        <span>{item.nom} × {item.quantite}</span>
                        <span className="font-mono">{formatCFA(item.prix_unitaire * item.quantite)}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-12">Sélectionnez un client pour voir son historique</p>
          )}
        </div>
      </div>
    </div>
  );
}
