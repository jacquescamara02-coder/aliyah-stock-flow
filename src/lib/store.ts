import { create } from 'zustand';

// Types
export interface Product {
  id: string;
  reference: string;
  name: string;
  category: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  stockMin: number;
  dateAjout: string;
}

export interface Client {
  id: string;
  nom: string;
  telephone: string;
  adresse: string;
  totalAchats: number;
}

export interface VenteItem {
  productId: string;
  reference: string;
  nom: string;
  quantite: number;
  prixUnitaire: number;
  prixAchat: number;
}

export interface Vente {
  id: string;
  clientId: string;
  clientNom: string;
  items: VenteItem[];
  total: number;
  marge: number;
  date: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  reference: string;
  nom: string;
  quantite: number;
  prixAchat: number;
  date: string;
}

// Sample data
const sampleProducts: Product[] = [
  { id: '1', reference: 'REF-0001', name: 'Piston Kit - Yamaha 125', category: 'Moteur', prixAchat: 8500, prixVente: 12000, stock: 24, stockMin: 5, dateAjout: '2026-03-01' },
  { id: '2', reference: 'REF-0002', name: 'Chaîne de transmission 428H', category: 'Transmission', prixAchat: 3500, prixVente: 5500, stock: 42, stockMin: 10, dateAjout: '2026-03-02' },
  { id: '3', reference: 'REF-0003', name: 'Plaquettes de frein avant', category: 'Freinage', prixAchat: 2000, prixVente: 3500, stock: 3, stockMin: 8, dateAjout: '2026-03-03' },
  { id: '4', reference: 'REF-0004', name: 'Filtre à huile universel', category: 'Filtration', prixAchat: 800, prixVente: 1500, stock: 56, stockMin: 15, dateAjout: '2026-03-05' },
  { id: '5', reference: 'REF-0005', name: 'Kit embrayage Honda CG 125', category: 'Embrayage', prixAchat: 12000, prixVente: 18000, stock: 8, stockMin: 3, dateAjout: '2026-03-07' },
  { id: '6', reference: 'REF-0006', name: 'Amortisseur arrière 320mm', category: 'Suspension', prixAchat: 15000, prixVente: 22000, stock: 6, stockMin: 2, dateAjout: '2026-03-08' },
  { id: '7', reference: 'REF-0007', name: 'Bougie NGK CR7HSA', category: 'Allumage', prixAchat: 600, prixVente: 1200, stock: 120, stockMin: 30, dateAjout: '2026-03-10' },
  { id: '8', reference: 'REF-0008', name: 'Câble accélérateur Bajaj', category: 'Commandes', prixAchat: 1200, prixVente: 2200, stock: 15, stockMin: 5, dateAjout: '2026-03-12' },
];

const sampleClients: Client[] = [
  { id: '1', nom: 'Moussa Diallo', telephone: '+225 07 89 12 34', adresse: 'Adjamé, Abidjan', totalAchats: 185000 },
  { id: '2', nom: 'Ibrahim Koné', telephone: '+225 05 67 89 01', adresse: 'Yopougon, Abidjan', totalAchats: 342000 },
  { id: '3', nom: 'Aya Traoré', telephone: '+225 01 23 45 67', adresse: 'Cocody, Abidjan', totalAchats: 95000 },
  { id: '4', nom: 'Seydou Bamba', telephone: '+225 07 45 67 89', adresse: 'Marcory, Abidjan', totalAchats: 520000 },
];

const sampleVentes: Vente[] = [
  { id: 'V001', clientId: '1', clientNom: 'Moussa Diallo', items: [{ productId: '1', reference: 'REF-0001', nom: 'Piston Kit - Yamaha 125', quantite: 2, prixUnitaire: 12000, prixAchat: 8500 }], total: 24000, marge: 7000, date: '2026-03-15' },
  { id: 'V002', clientId: '2', clientNom: 'Ibrahim Koné', items: [{ productId: '2', reference: 'REF-0002', nom: 'Chaîne de transmission 428H', quantite: 3, prixUnitaire: 5500, prixAchat: 3500 }, { productId: '7', reference: 'REF-0007', nom: 'Bougie NGK CR7HSA', quantite: 4, prixUnitaire: 1200, prixAchat: 600 }], total: 21300, marge: 8400, date: '2026-03-16' },
  { id: 'V003', clientId: '4', clientNom: 'Seydou Bamba', items: [{ productId: '5', reference: 'REF-0005', nom: 'Kit embrayage Honda CG 125', quantite: 1, prixUnitaire: 18000, prixAchat: 12000 }], total: 18000, marge: 6000, date: '2026-03-17' },
];

const sampleStockEntries: StockEntry[] = [
  { id: 'E001', productId: '1', reference: 'REF-0001', nom: 'Piston Kit - Yamaha 125', quantite: 30, prixAchat: 8500, date: '2026-03-01' },
  { id: 'E002', productId: '2', reference: 'REF-0002', nom: 'Chaîne de transmission 428H', quantite: 50, prixAchat: 3500, date: '2026-03-02' },
  { id: 'E003', productId: '7', reference: 'REF-0007', nom: 'Bougie NGK CR7HSA', quantite: 150, prixAchat: 600, date: '2026-03-10' },
];

interface AppState {
  products: Product[];
  clients: Client[];
  ventes: Vente[];
  stockEntries: StockEntry[];
  cart: VenteItem[];
  selectedClientId: string | null;

  // Actions
  addProduct: (product: Omit<Product, 'id' | 'dateAjout'>) => void;
  updateStock: (productId: string, quantity: number, prixAchat: number) => void;
  addClient: (client: Omit<Client, 'id' | 'totalAchats'>) => void;
  addToCart: (product: Product, quantite: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantite: number) => void;
  clearCart: () => void;
  setSelectedClient: (clientId: string | null) => void;
  confirmVente: () => Vente | null;
}

let nextProductId = 9;
let nextClientId = 5;
let nextVenteId = 4;
let nextEntryId = 4;

export const useStore = create<AppState>((set, get) => ({
  products: sampleProducts,
  clients: sampleClients,
  ventes: sampleVentes,
  stockEntries: sampleStockEntries,
  cart: [],
  selectedClientId: null,

  addProduct: (product) => {
    const id = String(nextProductId++);
    const newProduct: Product = {
      ...product,
      id,
      dateAjout: new Date().toISOString().split('T')[0],
    };
    set((state) => ({ products: [...state.products, newProduct] }));
  },

  updateStock: (productId, quantity, prixAchat) => {
    const entryId = `E${String(nextEntryId++).padStart(3, '0')}`;
    const product = get().products.find((p) => p.id === productId);
    if (!product) return;

    const entry: StockEntry = {
      id: entryId,
      productId,
      reference: product.reference,
      nom: product.name,
      quantite: quantity,
      prixAchat,
      date: new Date().toISOString().split('T')[0],
    };

    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId
          ? { ...p, stock: p.stock + quantity, prixAchat }
          : p
      ),
      stockEntries: [...state.stockEntries, entry],
    }));
  },

  addClient: (client) => {
    const id = String(nextClientId++);
    set((state) => ({
      clients: [...state.clients, { ...client, id, totalAchats: 0 }],
    }));
  },

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
            prixUnitaire: product.prixVente,
            prixAchat: product.prixAchat,
          },
        ],
      };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((i) => i.productId !== productId),
    }));
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

  confirmVente: () => {
    const state = get();
    if (state.cart.length === 0 || !state.selectedClientId) return null;

    const client = state.clients.find((c) => c.id === state.selectedClientId);
    if (!client) return null;

    const venteId = `V${String(nextVenteId++).padStart(3, '0')}`;
    const total = state.cart.reduce((sum, i) => sum + i.prixUnitaire * i.quantite, 0);
    const marge = state.cart.reduce((sum, i) => sum + (i.prixUnitaire - i.prixAchat) * i.quantite, 0);

    const vente: Vente = {
      id: venteId,
      clientId: state.selectedClientId,
      clientNom: client.nom,
      items: [...state.cart],
      total,
      marge,
      date: new Date().toISOString().split('T')[0],
    };

    set((state) => ({
      ventes: [...state.ventes, vente],
      products: state.products.map((p) => {
        const cartItem = state.cart.find((i) => i.productId === p.id);
        return cartItem ? { ...p, stock: p.stock - cartItem.quantite } : p;
      }),
      clients: state.clients.map((c) =>
        c.id === state.selectedClientId
          ? { ...c, totalAchats: c.totalAchats + total }
          : c
      ),
      cart: [],
      selectedClientId: null,
    }));

    return vente;
  },
}));

// Helpers
export const formatCFA = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

export const getMarginPercent = (prixAchat: number, prixVente: number): number => {
  if (prixVente === 0) return 0;
  return Math.round(((prixVente - prixAchat) / prixVente) * 100);
};
