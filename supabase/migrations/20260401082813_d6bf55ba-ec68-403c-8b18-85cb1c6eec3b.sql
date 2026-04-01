
CREATE POLICY "Auth users can update facture_fournisseur_items"
  ON public.facture_fournisseur_items FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
