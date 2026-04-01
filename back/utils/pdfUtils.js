import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to draw a line
function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa")
       .lineWidth(1)
       .moveTo(50, y)
       .lineTo(550, y)
       .stroke();
}

function formatCurrency(rs) {
    return 'Rs. ' + rs;
}

export const generateInvoicePDF = (invoice) => {
    return new Promise((resolve, reject) => {
        try {
            // Create target directory if it doesn't exist
            const invoicesDir = path.join(__dirname, '..', 'public', 'invoices');
            
            try {
                if (!fs.existsSync(invoicesDir)) {
                    fs.mkdirSync(invoicesDir, { recursive: true });
                }
            } catch (err) {
                if (err.code === 'EROFS') {
                    console.warn("⚠️ Read-only filesystem detected (Vercel). Skipping server-side PDF generation.");
                    return resolve(null); 
                }
                throw err;
            }

            const fileName = `invoice_${invoice._id}.pdf`;
            const filePath = path.join(invoicesDir, fileName);

            const doc = new PDFDocument({ size: "A4", margin: 50 });
            let stream;
            
            try {
                stream = fs.createWriteStream(filePath);
            } catch (err) {
                if (err.code === 'EROFS') {
                    console.warn("⚠️ Read-only filesystem detected (Vercel). Skipping server-side PDF generation.");
                    return resolve(null);
                }
                throw err;
            }
            
            // Pipe document to the stream
            doc.pipe(stream);

            // ======================
            // Build the PDF Content
            // ======================

            // 1. Dark Header Background
            doc.fillColor("#242424")
               .rect(0, 0, doc.page.width, 100)
               .fill();

            // Header Text in White
            doc.fillColor("#FFFFFF")
               .fontSize(26)
               .font("Helvetica-Bold")
               .text("DH BEAUTY PARLOUR", 50, 40)
               .fontSize(10)
               .font("Helvetica")
               .text("Elegant Beauty & Hair Care", 50, 72);

            // Reset Fill Color to gray for text
            doc.fillColor("#444444");

            // 2. INVOICE TITLE & INFO (Right Aligned)
            doc.fontSize(20)
               .font("Helvetica-Bold")
               .text("INVOICE", 50, 130, { align: "right" });

            doc.fontSize(10).font("Helvetica")
               .text(`Invoice Number: ${invoice._id.toString().substring(0, 8).toUpperCase()}`, 50, 160, { align: "right" })
               .text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString()}`, 50, 175, { align: "right" });

            // 3. Customer Info (Left Aligned BILL TO)
            const customerInformationTop = 130;
            doc.fontSize(12)
               .font("Helvetica-Bold")
               .text("BILL TO:", 50, customerInformationTop);
            
            doc.fontSize(10)
               .font("Helvetica")
               .text(`Customer Name: ${invoice.customerName}`, 50, customerInformationTop + 20)
               .text(`Mobile Number: ${invoice.mobileNumber}`, 50, customerInformationTop + 35);
            
            generateHr(doc, 220);

            // 4. Table Header
            const invoiceTableTop = 260;
            doc.font("Helvetica-Bold");
            
            // Draw Table Header Background rectangle
            doc.fillColor("#E8E8E8").rect(50, invoiceTableTop - 10, 500, 30).fill();
            doc.fillColor("#333333");
            
            doc.text("Service Name", 60, invoiceTableTop)
               .text("QTY", 280, invoiceTableTop, { width: 50, align: "center" })
               .text("Unit Price", 360, invoiceTableTop, { width: 80, align: "right" })
               .text("Line Total", 450, invoiceTableTop, { width: 90, align: "right" });

            doc.font("Helvetica");

            // 5. Table Rows 
            let i = 0;
            let invoiceTableTopPosition = invoiceTableTop + 30;

            invoice.services.forEach(item => {
                const position = invoiceTableTopPosition + (i * 30);
                
                // Zebra Striping for alternating rows
                if (i % 2 === 0) {
                    doc.fillColor("#F9F9F9").rect(50, position - 10, 500, 30).fill();
                    doc.fillColor("#333333"); // Reset to dark text
                }

                doc.text((item.name || "Service").toUpperCase(), 60, position)
                   .text(item.quantity.toString(), 280, position, { width: 50, align: "center" })
                   .text(formatCurrency(item.price), 360, position, { width: 80, align: "right" })
                   .text(formatCurrency(item.quantity * item.price), 450, position, { width: 90, align: "right" });
                
                i++;
            });

            // 6. Summary (Total)
            const subtotalPosition = invoiceTableTopPosition + (i * 30);
            generateHr(doc, subtotalPosition);

            doc.font("Helvetica-Bold");
            doc.text("Grand Total", 360, subtotalPosition + 15, { width: 80, align: "right" })
               .text(formatCurrency(invoice.totalAmount), 450, subtotalPosition + 15, { width: 90, align: "right" });

            // 7. Nice Footer at bottom
            const footerTop = doc.page.height - 100;
            generateHr(doc, footerTop);
            doc.font("Helvetica-Oblique")
               .fontSize(10)
               .text(
                   "Thank you for choosing DH Beauty Parlour! We appreciate your business.",
                   50,
                   footerTop + 20,
                   { align: "center", width: 500 }
               );

            // Finalize PDF
            doc.end();

            stream.on('finish', () => {
                // Return relative URL for frontend access
                resolve(`/public/invoices/${fileName}`);
            });

            stream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};
