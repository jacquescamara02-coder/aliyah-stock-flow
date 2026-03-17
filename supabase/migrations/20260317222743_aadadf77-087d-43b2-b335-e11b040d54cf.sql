
CREATE POLICY "Authenticated users can delete ventes" ON public.ventes FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete vente_items" ON public.vente_items FOR DELETE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete stock_entries" ON public.stock_entries FOR DELETE TO authenticated USING (true);
CREATE POLICY "Auth users can delete facture_fournisseur_items" ON public.facture_fournisseur_items FOR DELETE TO authenticated USING (true);
