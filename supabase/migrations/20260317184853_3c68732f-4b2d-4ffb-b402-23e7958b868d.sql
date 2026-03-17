
-- Table fournisseurs
CREATE TABLE public.fournisseurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL DEFAULT '',
  adresse TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view fournisseurs" ON public.fournisseurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert fournisseurs" ON public.fournisseurs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update fournisseurs" ON public.fournisseurs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete fournisseurs" ON public.fournisseurs FOR DELETE TO authenticated USING (true);

-- Table factures fournisseurs
CREATE TABLE public.factures_fournisseurs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fournisseur_id UUID REFERENCES public.fournisseurs(id),
  fournisseur_nom TEXT NOT NULL,
  numero_facture TEXT NOT NULL DEFAULT '',
  total NUMERIC NOT NULL DEFAULT 0,
  date_facture TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.factures_fournisseurs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view factures_fournisseurs" ON public.factures_fournisseurs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert factures_fournisseurs" ON public.factures_fournisseurs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth users can update factures_fournisseurs" ON public.factures_fournisseurs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth users can delete factures_fournisseurs" ON public.factures_fournisseurs FOR DELETE TO authenticated USING (true);

-- Items des factures fournisseurs
CREATE TABLE public.facture_fournisseur_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  facture_id UUID NOT NULL REFERENCES public.factures_fournisseurs(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  reference TEXT NOT NULL DEFAULT '',
  nom TEXT NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.facture_fournisseur_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth users can view facture_fournisseur_items" ON public.facture_fournisseur_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth users can insert facture_fournisseur_items" ON public.facture_fournisseur_items FOR INSERT TO authenticated WITH CHECK (true);
