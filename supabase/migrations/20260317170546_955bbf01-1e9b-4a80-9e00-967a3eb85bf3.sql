
-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reference TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  prix_achat NUMERIC NOT NULL DEFAULT 0,
  prix_vente NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  stock_min INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert products"
  ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update products"
  ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete products"
  ON public.products FOR DELETE TO authenticated USING (true);

-- Clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL DEFAULT '',
  adresse TEXT NOT NULL DEFAULT '',
  total_achats NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert clients"
  ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update clients"
  ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete clients"
  ON public.clients FOR DELETE TO authenticated USING (true);

-- Ventes table
CREATE TABLE public.ventes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id),
  client_nom TEXT NOT NULL,
  total NUMERIC NOT NULL DEFAULT 0,
  marge NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ventes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ventes"
  ON public.ventes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ventes"
  ON public.ventes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ventes"
  ON public.ventes FOR UPDATE TO authenticated USING (true);

-- Vente items table
CREATE TABLE public.vente_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vente_id UUID NOT NULL REFERENCES public.ventes(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  reference TEXT NOT NULL,
  nom TEXT NOT NULL,
  quantite INTEGER NOT NULL,
  prix_unitaire NUMERIC NOT NULL,
  prix_achat NUMERIC NOT NULL
);

ALTER TABLE public.vente_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view vente_items"
  ON public.vente_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert vente_items"
  ON public.vente_items FOR INSERT TO authenticated WITH CHECK (true);

-- Stock entries table
CREATE TABLE public.stock_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  reference TEXT NOT NULL,
  nom TEXT NOT NULL,
  quantite INTEGER NOT NULL,
  prix_achat NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stock_entries"
  ON public.stock_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert stock_entries"
  ON public.stock_entries FOR INSERT TO authenticated WITH CHECK (true);

-- Insert sample data
INSERT INTO public.products (reference, name, category, prix_achat, prix_vente, stock, stock_min) VALUES
  ('REF-0001', 'Piston Kit - Yamaha 125', 'Moteur', 8500, 12000, 24, 5),
  ('REF-0002', 'Chaîne de transmission 428H', 'Transmission', 3500, 5500, 42, 10),
  ('REF-0003', 'Plaquettes de frein avant', 'Freinage', 2000, 3500, 3, 8),
  ('REF-0004', 'Filtre à huile universel', 'Filtration', 800, 1500, 56, 15),
  ('REF-0005', 'Kit embrayage Honda CG 125', 'Embrayage', 12000, 18000, 8, 3),
  ('REF-0006', 'Amortisseur arrière 320mm', 'Suspension', 15000, 22000, 6, 2),
  ('REF-0007', 'Bougie NGK CR7HSA', 'Allumage', 600, 1200, 120, 30),
  ('REF-0008', 'Câble accélérateur Bajaj', 'Commandes', 1200, 2200, 15, 5);

INSERT INTO public.clients (nom, telephone, adresse, total_achats) VALUES
  ('Moussa Diallo', '+225 07 89 12 34', 'Adjamé, Abidjan', 185000),
  ('Ibrahim Koné', '+225 05 67 89 01', 'Yopougon, Abidjan', 342000),
  ('Aya Traoré', '+225 01 23 45 67', 'Cocody, Abidjan', 95000),
  ('Seydou Bamba', '+225 07 45 67 89', 'Marcory, Abidjan', 520000);
