
CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reference text NOT NULL DEFAULT '',
  nom text NOT NULL,
  type text NOT NULL DEFAULT 'entree',
  quantite integer NOT NULL,
  stock_avant integer NOT NULL DEFAULT 0,
  stock_apres integer NOT NULL DEFAULT 0,
  motif text NOT NULL DEFAULT '',
  vente_id uuid REFERENCES public.ventes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock_movements" ON public.stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_movements" ON public.stock_movements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can delete stock_movements" ON public.stock_movements FOR DELETE TO authenticated USING (true);
