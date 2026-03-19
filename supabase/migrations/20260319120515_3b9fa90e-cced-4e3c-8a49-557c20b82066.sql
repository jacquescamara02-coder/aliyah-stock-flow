
-- Table for miscellaneous expenses
CREATE TABLE public.depenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  montant NUMERIC NOT NULL DEFAULT 0,
  categorie TEXT NOT NULL DEFAULT 'Autre',
  date_depense TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view depenses" ON public.depenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert depenses" ON public.depenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update depenses" ON public.depenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete depenses" ON public.depenses FOR DELETE TO authenticated USING (true);

-- Add payment status to ventes for tracking unpaid deliveries
ALTER TABLE public.ventes ADD COLUMN statut_paiement TEXT NOT NULL DEFAULT 'payé';
