import { create } from 'zustand';

// Types matching Supabase schema
export interface Product {
  id: string;
  reference: string;
  name: string;
  category: string;
  prix_achat: number;
  prix_vente: number;
  stock: number;
  stock_min: number;
  created_at: string;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  total_achats: number;
  created_at: string;
}

export interface VenteItem {
  id: string;
  vente_id: string;
  product_id: string;
  reference: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
  prix_achat: number;
}

export interface Vente {
  id: string;
  client_id: string | null;
  client_nom: string;
  total: number;
  marge: number;
  created_at: string;
  items?: VenteItem[];
}

export interface StockEntry {
  id: string;
  product_id: string;
  reference: string;
  nom: string;
  quantite: number;
  prix_achat: number;
  created_at: string;
}

// Cart (local only)
export interface CartItem {
  productId: string;
  reference: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  prixAchat: number;
}

interface CartState {
  cart: CartItem[];
  selectedClientId: string | null;
  addToCart: (product: Product, quantite: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantite: number) => void;
  clearCart: () => void;
  setSelectedClient: (clientId: string | null) => void;
}

export const useCartStore = create<CartState>((set) => ({
  cart: [],
  selectedClientId: null,

  addToCart: (product, quantite) => {
    set((state) => {
      const existing = state.cart.find((i) => i.productId === product.id);
      if (existing) {
        return {
          cart: state.cart.map((i) =>
            i.productId === product.id
              ? { ...i, quantite: i.quantite + quantite }
              : i
          ),
        };
      }
      return {
        cart: [
          ...state.cart,
          {
            productId: product.id,
            reference: product.reference,
            nom: product.name,
            quantite,
            prixUnitaire: product.prix_vente,
            prixAchat: product.prix_achat,
          },
        ],
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({ cart: state.cart.filter((i) => i.productId !== productId) }));
  },

  updateCartQuantity: (productId, quantite) => {
    set((state) => ({
      cart: state.cart.map((i) =>
        i.productId === productId ? { ...i, quantite } : i
      ),
    }));
  },

  clearCart: () => set({ cart: [], selectedClientId: null }),
  setSelectedClient: (clientId) => set({ selectedClientId: clientId }),
}));

// Helpers
export const formatCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export const getMarginPercent = (prixAchat: number, prixVente: number): number => {
  if (prixVente === 0) return 0;
  return Math.round(((prixVente - prixAchat) / prixVente) * 100);
};
