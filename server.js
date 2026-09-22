const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const DATA_DIR = path.join(__dirname, 'data');
const MEDICINES_FILE = path.join(DATA_DIR, 'medicines.json');
const SALES_FILE = path.join(DATA_DIR, 'sales.json');

// Ensure data dir and seed files exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function seedData() {
  if (!fs.existsSync(MEDICINES_FILE)) {
    const sampleMeds = [
      {
        id: "med-101",
        fullName: "Paracetamol Extra 500mg",
        notes: "Fast acting pain relief and fever reducer. Take after meals.",
        expiryDate: new Date(Date.now() + 15 * 86400000).toISOString(), // < 30 days -> RED
        quantity: 45,
        price: 4.50,
        brand: "HealthPharma",
        createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
      },
      {
        id: "med-102",
        fullName: "Amoxicillin Trihydrate 250mg",
        notes: "Broad spectrum antibiotic capsules. Complete full course as prescribed.",
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString(),
        quantity: 8, // < 10 -> YELLOW
        price: 14.99,
        brand: "MedLife Biocare",
        createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
      },
      {
        id: "med-103",
        fullName: "Cetirizine Hydrochloride 10mg",
        notes: "Non-drowsy antihistamine for seasonal allergies and hay fever.",
        expiryDate: new Date(Date.now() + 12 * 86400000).toISOString(), // < 30 days & < 10 stock -> RED + YELLOW
        quantity: 5,
        price: 6.25,
        brand: "SunCure Labs",
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString()
      },
      {
        id: "med-104",
        fullName: "Metformin HCl 500mg Prolonged Release",
        notes: "Oral anti-diabetic medication for managing Type 2 Diabetes.",
        expiryDate: new Date(Date.now() + 240 * 86400000).toISOString(),
        quantity: 120,
        price: 18.75,
        brand: "GlycaCare",
        createdAt: new Date(Date.now() - 30 * 86400000).toISOString()
      },
      {
        id: "med-105",
        fullName: "Ibuprofen 400mg Softgel Capsules",
        notes: "Anti-inflammatory painkiller for joint and muscular ache.",
        expiryDate: new Date(Date.now() + 22 * 86400000).toISOString(), // < 30 days -> RED
        quantity: 60,
        price: 8.99,
        brand: "HealthPharma",
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
      },
      {
        id: "med-106",
        fullName: "Omeprazole Gastro-Resistant 20mg",
        notes: "Proton pump inhibitor for heartburn and acid reflux relief.",
        expiryDate: new Date(Date.now() + 365 * 86400000).toISOString(),
        quantity: 4, // < 10 -> YELLOW
        price: 11.50,
        brand: "AstraMed",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
    fs.writeFileSync(MEDICINES_FILE, JSON.stringify(sampleMeds, null, 2));
  }

  if (!fs.existsSync(SALES_FILE)) {
    const sampleSales = [
      {
        id: "sale-501",
        medicineId: "med-101",
        medicineName: "Paracetamol Extra 500mg",
        brand: "HealthPharma",
        quantitySold: 5,
        unitPrice: 4.50,
        totalPrice: 22.50,
        saleDate: new Date(Date.now() - 3 * 3600000).toISOString()
      },
      {
        id: "sale-502",
        medicineId: "med-104",
        medicineName: "Metformin HCl 500mg Prolonged Release",
        brand: "GlycaCare",
        quantitySold: 2,
        unitPrice: 18.75,
        totalPrice: 37.50,
        saleDate: new Date(Date.now() - 3600000).toISOString()
      }
    ];
    fs.writeFileSync(SALES_FILE, JSON.stringify(sampleSales, null, 2));
  }
}

seedData();

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API Endpoints
  if (pathname === '/api/medicines' && method === 'GET') {
    let meds = readJson(MEDICINES_FILE);
    const search = parsedUrl.query.search;
    if (search) {
      const query = search.toLowerCase();
      meds = meds.filter(m => 
        (m.fullName && m.fullName.toLowerCase().includes(query)) ||
        (m.brand && m.brand.toLowerCase().includes(query))
      );
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(meds));
    return;
  }

  if (pathname.startsWith('/api/medicines/') && method === 'GET') {
    const id = pathname.replace('/api/medicines/', '');
    const meds = readJson(MEDICINES_FILE);
    const med = meds.find(m => m.id === id);
    if (med) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(med));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Medicine not found" }));
    }
    return;
  }

  if (pathname === '/api/medicines' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const med = JSON.parse(body);
        if (!med.fullName) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: "Full Name is required" }));
        }
        med.id = 'med-' + Date.now();
        med.price = parseFloat(parseFloat(med.price || 0).toFixed(2));
        med.quantity = parseInt(med.quantity || 0, 10);
        med.createdAt = new Date().toISOString();

        const meds = readJson(MEDICINES_FILE);
        meds.push(med);
        writeJson(MEDICINES_FILE, meds);

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(med));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Invalid JSON body" }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/medicines/') && method === 'PUT') {
    const id = pathname.replace('/api/medicines/', '');
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const updated = JSON.parse(body);
        const meds = readJson(MEDICINES_FILE);
        const idx = meds.findIndex(m => m.id === id);
        if (idx === -1) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: "Medicine not found" }));
        }
        updated.id = id;
        updated.price = parseFloat(parseFloat(updated.price || 0).toFixed(2));
        updated.quantity = parseInt(updated.quantity || 0, 10);
        meds[idx] = updated;
        writeJson(MEDICINES_FILE, meds);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(updated));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Invalid JSON body" }));
      }
    });
    return;
  }

  if (pathname.startsWith('/api/medicines/') && method === 'DELETE') {
    const id = pathname.replace('/api/medicines/', '');
    let meds = readJson(MEDICINES_FILE);
    const initialLen = meds.length;
    meds = meds.filter(m => m.id !== id);
    if (meds.length < initialLen) {
      writeJson(MEDICINES_FILE, meds);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Medicine deleted successfully" }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: "Medicine not found" }));
    }
    return;
  }

  if (pathname === '/api/sales' && method === 'GET') {
    const sales = readJson(SALES_FILE);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(sales));
    return;
  }

  if (pathname === '/api/sales' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { medicineId, quantity } = JSON.parse(body);
        const qtyToSell = parseInt(quantity, 10);
        const meds = readJson(MEDICINES_FILE);
        const med = meds.find(m => m.id === medicineId);

        if (!med) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: "Medicine not found" }));
        }
        if (qtyToSell <= 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: "Quantity must be greater than zero" }));
        }
        if (med.quantity < qtyToSell) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ message: `Insufficient stock. Available: ${med.quantity}` }));
        }

        // Deduct stock
        med.quantity -= qtyToSell;
        writeJson(MEDICINES_FILE, meds);

        // Record Sale
        const saleRecord = {
          id: 'sale-' + Date.now(),
          medicineId: med.id,
          medicineName: med.fullName,
          brand: med.brand,
          quantitySold: qtyToSell,
          unitPrice: med.price,
          totalPrice: parseFloat((med.price * qtyToSell).toFixed(2)),
          saleDate: new Date().toISOString()
        };

        const sales = readJson(SALES_FILE);
        sales.unshift(saleRecord);
        writeJson(SALES_FILE, sales);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          message: "Sale processed successfully",
          sale: saleRecord,
          updatedMedicine: med
        }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: "Error processing sale" }));
      }
    });
    return;
  }

  // Static File Serving
  let filePath = path.join(__dirname, 'wwwroot', pathname === '/' ? 'index.html' : pathname);

  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      filePath = path.join(__dirname, 'wwwroot', 'index.html');
    }
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Server Error');
      } else {
        const mime = mimeTypes[path.extname(filePath)] || 'text/plain';
        res.writeHead(200, { 'Content-Type': mime });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`\nClient ABC Pharmacy Server is running at http://localhost:${PORT}`);
});
