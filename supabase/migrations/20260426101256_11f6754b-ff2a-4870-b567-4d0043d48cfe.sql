-- 1. Trigger function: ajuster stock automatiquement sur vente_items
CREATE OR REPLACE FUNCTION public.adjust_stock_on_vente_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_avant integer;
  v_stock_apres integer;
  v_delta integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT stock INTO v_stock_avant FROM products WHERE id = NEW.product_id FOR UPDATE;
    IF v_stock_avant IS NULL THEN RETURN NEW; END IF;
    v_stock_apres := v_stock_avant - NEW.quantite;
    UPDATE products SET stock = v_stock_apres WHERE id = NEW.product_id;
    INSERT INTO stock_movements (product_id, reference, nom, type, quantite, stock_avant, stock_apres, motif, vente_id)
    VALUES (NEW.product_id, NEW.reference, NEW.nom, 'sortie', NEW.quantite, v_stock_avant, v_stock_apres,
            'Vente ' || COALESCE(substring(NEW.vente_id::text, 1, 8), ''), NEW.vente_id);
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    SELECT stock INTO v_stock_avant FROM products WHERE id = OLD.product_id FOR UPDATE;
    IF v_stock_avant IS NULL THEN RETURN OLD; END IF;
    v_stock_apres := v_stock_avant + OLD.quantite;
    UPDATE products SET stock = v_stock_apres WHERE id = OLD.product_id;
    INSERT INTO stock_movements (product_id, reference, nom, type, quantite, stock_avant, stock_apres, motif, vente_id)
    VALUES (OLD.product_id, OLD.reference, OLD.nom, 'retour', OLD.quantite, v_stock_avant, v_stock_apres,
            'Suppression vente ' || COALESCE(substring(OLD.vente_id::text, 1, 8), ''), OLD.vente_id);
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    v_delta := NEW.quantite - OLD.quantite;
    IF v_delta = 0 AND NEW.product_id = OLD.product_id THEN RETURN NEW; END IF;
    -- Restore old product
    SELECT stock INTO v_stock_avant FROM products WHERE id = OLD.product_id FOR UPDATE;
    UPDATE products SET stock = stock + OLD.quantite WHERE id = OLD.product_id;
    -- Deduct new
    SELECT stock INTO v_stock_avant FROM products WHERE id = NEW.product_id FOR UPDATE;
    v_stock_apres := v_stock_avant - NEW.quantite;
    UPDATE products SET stock = v_stock_apres WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_adjust_stock_on_vente_item ON public.vente_items;
CREATE TRIGGER trg_adjust_stock_on_vente_item
AFTER INSERT OR UPDATE OR DELETE ON public.vente_items
FOR EACH ROW EXECUTE FUNCTION public.adjust_stock_on_vente_item();

-- 2. Trigger function: ajuster stock auto sur facture_fournisseur_items (entrée stock)
CREATE OR REPLACE FUNCTION public.adjust_stock_on_facture_fourn_item()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stock_avant integer;
  v_stock_apres integer;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.product_id IS NOT NULL THEN
    SELECT stock INTO v_stock_avant FROM products WHERE id = NEW.product_id FOR UPDATE;
    IF v_stock_avant IS NULL THEN RETURN NEW; END IF;
    v_stock_apres := v_stock_avant + NEW.quantite;
    UPDATE products SET stock = v_stock_apres, prix_achat = NEW.prix_unitaire WHERE id = NEW.product_id;
    INSERT INTO stock_movements (product_id, reference, nom, type, quantite, stock_avant, stock_apres, motif)
    VALUES (NEW.product_id, NEW.reference, NEW.nom, 'entree', NEW.quantite, v_stock_avant, v_stock_apres,
            'Facture fournisseur');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' AND OLD.product_id IS NOT NULL THEN
    SELECT stock INTO v_stock_avant FROM products WHERE id = OLD.product_id FOR UPDATE;
    IF v_stock_avant IS NULL THEN RETURN OLD; END IF;
    v_stock_apres := GREATEST(v_stock_avant - OLD.quantite, 0);
    UPDATE products SET stock = v_stock_apres WHERE id = OLD.product_id;
    INSERT INTO stock_movements (product_id, reference, nom, type, quantite, stock_avant, stock_apres, motif)
    VALUES (OLD.product_id, OLD.reference, OLD.nom, 'retour', OLD.quantite, v_stock_avant, v_stock_apres,
            'Annulation facture fournisseur');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Note: on n'active PAS ce trigger maintenant pour ne pas doubler avec le code app existant
-- L'utilisateur peut le décider plus tard.
