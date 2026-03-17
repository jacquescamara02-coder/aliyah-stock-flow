import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCFA } from "@/lib/store";

interface InvoiceItem {
  reference: string;
  nom: string;
  quantite: number;
  prix_unitaire: number;
}

interface InvoiceData {
  numero: string;
  date: string;
  clientOrFournisseur: string;
  labelType: "Client" | "Fournisseur";
  items: InvoiceItem[];
  total: number;
}

// Cache the logo as base64
let logoBase64Cache: string | null = null;

async function getLogoBase64(): Promise<string> {
  if (logoBase64Cache) return logoBase64Cache;
  const response = await fetch("/images/logo-aliyah.jpeg");
  const blob = await response.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      logoBase64Cache = reader.result as string;
      resolve(logoBase64Cache);
    };
    reader.readAsDataURL(blob);
  });
}

export async function generateInvoicePDF(data: InvoiceData): Promise<jsPDF> {
  const doc = new jsPDF();
  const logoBase64 = await getLogoBase64();

  const primaryColor: [number, number, number] = [217, 119, 36]; // hsl(30, 85%, 55%) approx
  const darkColor: [number, number, number] = [20, 24, 33];
  const grayColor: [number, number, number] = [120, 120, 130];

  // === HEADER ===
  // Logo
  doc.addImage(logoBase64, "JPEG", 14, 10, 22, 22);

  // Company name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...darkColor);
  doc.text("ALIYAH SHOP", 40, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text("VENTE DE PIÈCES DÉTACHÉES DE MOTO", 40, 26);

  // Invoice number & date (right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...primaryColor);
  doc.text(`FACTURE`, 196, 15, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...darkColor);
  doc.text(data.numero, 196, 22, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...grayColor);
  doc.text(data.date, 196, 28, { align: "right" });

  // Separator line
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(14, 36, 196, 36);

  // === CLIENT / FOURNISSEUR ===
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text(data.labelType.toUpperCase(), 14, 44);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...darkColor);
  doc.text(data.clientOrFournisseur, 14, 50);

  // === TABLE ===
  const tableData = data.items.map((item) => [
    `${item.reference}\n${item.nom}`,
    String(item.quantite),
    formatCFA(item.prix_unitaire),
    formatCFA(item.prix_unitaire * item.quantite),
  ]);

  autoTable(doc, {
    startY: 58,
    head: [["DÉSIGNATION", "QTÉ", "PRIX UNITAIRE", "TOTAL"]],
    body: tableData,
    theme: "plain",
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: grayColor,
      fontSize: 8,
      fontStyle: "bold",
      cellPadding: 4,
    },
    bodyStyles: {
      textColor: darkColor,
      fontSize: 9,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { halign: "center", cellWidth: 25 },
      2: { halign: "right", cellWidth: 40 },
      3: { halign: "right", cellWidth: 40, fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didParseCell: (data) => {
      if (data.section === "head") {
        data.cell.styles.lineWidth = { bottom: 0.5, top: 0, left: 0, right: 0 };
        data.cell.styles.lineColor = primaryColor;
      }
    },
  });

  // === TOTAL ===
  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.8);
  doc.line(130, finalY + 6, 196, finalY + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);
  doc.text("TOTAL", 132, finalY + 14);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.text(formatCFA(data.total), 194, finalY + 14, { align: "right" });

  // === FOOTER ===
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 20, 196, pageHeight - 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(
    "ALIYAH SHOP — VENTE DE PIÈCES DÉTACHÉES DE MOTO — Merci pour votre confiance",
    105,
    pageHeight - 14,
    { align: "center" }
  );

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output("blob");
}
