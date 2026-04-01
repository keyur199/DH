import jsPDF from "jspdf";
import { logoBase64 } from "./logoData";

/* =========================
   GENERATE INVOICE DATA
========================= */

export const generateInvoice = (customer, mobile, items) => {
   let lastInvoice = localStorage.getItem("invoiceNumber") || 0;
   let newInvoice = Number(lastInvoice) + 1;
   localStorage.setItem("invoiceNumber", newInvoice);
   const invoiceId = String(newInvoice).padStart(2, "0");

   // Map items to services for backend compatibility
   const backendServices = items.map(item => ({
      name: item.name,
      quantity: Number(item.qty),
      price: Number(item.price)
   }));

   const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);

   return {
      id: invoiceId,
      customerName: customer,
      mobile: mobile, // Keep for legacy/PDF
      mobileNumber: mobile, // For backend
      date: new Date().toLocaleDateString('en-GB'),
      items: items, // Keep for legacy/PDF
      services: backendServices, // For backend
      total: subtotal,
      createdAt: new Date().toISOString()
   };
};

/* =========================
   MASTER TIER PDF GENERATION (EK J ROW MA FIX)
========================= */

const showStatusToast = (title, body) => {
   let toast = document.getElementById("studio-toast");
   if (!toast) {
      toast = document.createElement("div");
      toast.id = "studio-toast";
      toast.innerHTML = `<div class="toast-header"></div><div class="toast-body"></div>`;
      document.body.appendChild(toast);
   }
   toast.querySelector(".toast-header").innerText = "✨ " + title;
   toast.querySelector(".toast-body").innerText = body;
   toast.style.display = "block";
   setTimeout(() => { toast.style.display = "none"; }, 4000);
}

const getCircularLogo = async () => {
   if (!logoBase64) return null;
   return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
         const canvas = document.createElement("canvas");
         canvas.width = 512; canvas.height = 512;
         const ctx = canvas.getContext("2d");
         ctx.beginPath(); ctx.arc(256, 256, 256, 0, Math.PI * 2); ctx.closePath(); ctx.clip();
         ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, 512, 512);
         const minSize = Math.min(img.width, img.height);
         const sx = (img.width - minSize) / 2; const sy = (img.height - minSize) / 2;
         ctx.drawImage(img, sx, sy, minSize, minSize, 0, 0, 512, 512);
         resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(null);
      img.src = logoBase64;
   });
};

export const downloadPDF = async (invoice, shouldSave = true) => {
   const doc = new jsPDF();
   const total = invoice.totalAmount || invoice.total || 0;
   const circLogo = await getCircularLogo();

   doc.setFillColor(255, 255, 255); doc.rect(0, 0, 210, 297, "F");

   if (circLogo) {
      doc.setGState(new doc.GState({ opacity: 0.04 }));
      doc.addImage(circLogo, 'PNG', 55, 100, 100, 100);
      doc.setGState(new doc.GState({ opacity: 1 }));
   }

   doc.setFillColor(15, 15, 15); doc.rect(0, 0, 210, 42, "F");
   doc.setFillColor(255, 255, 255); doc.rect(0, 42, 210, 10, "F");
   doc.setFillColor(15, 15, 15); doc.rect(0, 52, 210, 18, "F");

   if (circLogo) {
      doc.setFillColor(255, 255, 255); doc.circle(28, 21, 13.5, "F");
      doc.addImage(circLogo, 'PNG', 14.5, 7.5, 27, 27);
   }

   doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255); doc.setFontSize(19);
   doc.text("DH MAKEUP STUDIO & ACADEMY", 50, 23);

   doc.setFont("helvetica", "bold"); doc.setFontSize(7.5); doc.setTextColor(15, 15, 15);
   doc.text("Make Up  |  Hair Style  |  Hair Removal  |  Skin Treatment  |  All Beauty Care", 105, 48, { align: "center" });

   doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255);
   doc.text("H-101, First Floor, Shivant Iconic, Outer Ringroad, Valak, Surat. | +91 95373 87311", 105, 59, { align: "center" });
   doc.text("Instagram: dh_makeup_studio_", 105, 65, { align: "center" });

   doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(40, 40, 40);
   doc.text((invoice.customerName || "Customer").toUpperCase(), 20, 85);
   doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
   doc.text("+91 " + (invoice.mobileNumber || invoice.mobile || ""), 20, 93);

   const displayDate = invoice.date || (invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'));
   const displayId = (invoice.invoiceId || (invoice.id ? String(invoice.id) : (invoice._id ? invoice._id.toString().slice(-2).toUpperCase() : "01"))).replace("INV-", "").padStart(2, "0");

   doc.setFontSize(9); doc.text("Date : " + displayDate, 185, 85, { align: "right" });
   doc.text("Invoice No : " + displayId, 185, 93, { align: "right" });

   let y = 110;
   doc.setFillColor(25, 25, 25); doc.rect(20, y, 170, 10, "F");
   doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(255, 255, 255);
   doc.text("Description", 25, y + 6.5); doc.text("Qty.", 115, y + 6.5, { align: "center" });
   doc.text("Price", 145, y + 6.5, { align: "center" }); doc.text("Total", 175, y + 6.5, { align: "center" });

   y += 10;
   doc.setFont("helvetica", "normal");
   const itemsToRender = invoice.services || invoice.items || [];
   itemsToRender.forEach((item, idx) => {
      const q = item.quantity || item.qty || 1;
      const p = item.price || 0;
      const rowTotal = q * p;
      if (idx % 2 !== 0) { doc.setFillColor(248, 248, 248); doc.rect(20, y, 170, 10, "F"); }
      doc.setTextColor(40, 40, 40); doc.text(item.name || "Service", 25, y + 6.5);
      doc.text(String(q), 115, y + 6.5, { align: "center" });
      doc.text("Rs. " + Number(p).toFixed(2), 145, y + 6.5, { align: "center" });
      doc.setFont("helvetica", "bold"); doc.text("Rs. " + Number(rowTotal).toFixed(2), 175, y + 6.5, { align: "center" });
      doc.setFont("helvetica", "normal"); y += 10;
   });

   doc.setDrawColor(25, 25, 25); doc.setLineWidth(0.5); doc.rect(20, 110, 170, y - 110, "S");

   y += 15;
   doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(60, 60, 60);
   doc.text("Sub-total :", 150, y, { align: "right" });
   doc.setTextColor(20, 20, 20); doc.text("Rs. " + (invoice.totalAmount || invoice.total || 0).toFixed(2), 185, y, { align: "right" });

   doc.setFillColor(15, 15, 15); doc.rect(130, y + 10, 60, 12, "F");
   doc.setFontSize(12); doc.setTextColor(255, 255, 255);
   doc.text("Total :", 150, y + 18, { align: "right" });
   doc.text("Rs. " + (invoice.totalAmount || invoice.total || 0).toFixed(2), 185, y + 18, { align: "right" });

   const bottomY = 275;
   doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
   doc.line(135, bottomY - 7, 185, bottomY - 7);

   doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
   doc.text("DH MAKEUP STUDIO & ACADEMY", 160, bottomY, { align: "center" });
   doc.setFont("helvetica", "italic"); doc.setFontSize(7.5); doc.setTextColor(120, 120, 120);
   doc.text("Authorized Signatory", 160, bottomY + 6, { align: "center" });

   doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(80, 80, 80);
   doc.text("Thank you for visiting DH Makeup Studio & Academy. We hope to see you again!", 105, bottomY + 15, { align: "center" });

   if (shouldSave) {
      doc.save("Invoice-" + displayId + ".pdf");
   }
   return doc;
};

/* =========================
   SHARE LOGIC
========================= */const isMobileDevice = () => /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const sendWhatsApp = async (invoice) => {
   const displayId = (invoice.invoiceId || (invoice.id ? String(invoice.id) : (invoice._id ? invoice._id.toString().slice(-2).toUpperCase() : "01"))).replace("INV-", "").padStart(2, "0");
   const isMobile = isMobileDevice();
   
   console.log("🚀 WhatsApp Share Triggered. Device:", isMobile ? "Mobile" : "Desktop");
   showStatusToast("WhatsApp Sharing...", "Preparing your professional invoice link.");

   const doc = await downloadPDF(invoice, false);
   const pdfBlob = doc.output('blob');
   const fileName = `DH_INV_${displayId}.pdf`;
   const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });

   // AUTO-DOWNLOAD: Trigger a local download immediately as requested
   console.log("📥 Auto-downloading PDF for manual sharing...");
   doc.save(fileName);

   // 1. TRY NATIVE SHARE ONLY ON MOBILE
   if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
         await navigator.share({
            files: [pdfFile],
            title: `Invoice ${displayId}`,
            text: `🧾 *DH MAKEUP STUDIO*\n\nInvoice for *${invoice.customerName || "Customer"}*\nTotal: ₹${invoice.totalAmount || invoice.total || 0}`
         });
         return; 
      } catch (err) {
         if (err.name === 'AbortError') return;
         console.error("Native share failed", err);
      }
   }

   // 2. DESKTOP OR MOBILE FALLBACK: Upload to Server
   const apiBase = process.env.REACT_APP_API_BASE || "http://localhost:8000/api";
   const phoneRaw = String(invoice.mobileNumber || invoice.mobile || "").replace(/\D/g, "");
   const phone = phoneRaw.length === 10 ? "91" + phoneRaw : phoneRaw;
   const messageTemplate = `🧾 *DH MAKEUP STUDIO & ACADEMY*\n\nYour *Invoice INV-${displayId}* for *${invoice.customerName || "Customer"}* is ready!\n\nTotal: ₹${invoice.totalAmount || invoice.total || 0}\n\n`;

   try {
      showStatusToast("Sharing...", "Generating direct WhatsApp message.");
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const response = await fetch(`${apiBase}/upload-invoice`, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ pdfBase64, invoiceId: displayId })
      });
      
      const data = await response.json();
      if (response.ok && data.url) {
         const finalMessage = messageTemplate + `📥 *VIEW & DOWNLOAD:* \n${data.url}`;
         window.open(`https://wa.me/${phone}?text=${encodeURIComponent(finalMessage)}`, '_blank');
         return; // SUCCESS with link
      } else {
         console.warn("⚠️ Server upload not available, falling back to text-only.");
      }
   } catch (err) {
      console.warn("⚠️ Connection failed, sending text-only fallback.", err);
   }

   // 3. LAST RESORT: Just open WhatsApp with message (Reliable & Works everywhere)
   const fallbackUrl = `https://wa.me/${phone}?text=${encodeURIComponent(messageTemplate + "Please check your email/manual download for the PDF copy.")}`;
   window.open(fallbackUrl, '_blank');
};