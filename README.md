# Client ABC Pharmacy - Single Page Application & Web API

A full-stack Single Page Application (SPA) built for **Client ABC Pharmacy** to manage medicine inventory and sales records.
Check Live App here : https://rishi3957.github.io/myconsoleapp/

---

## 🌟 Key Features

1. **Medicine Inventory Management**:
   - Full Name, Brand, Expiry Date, Quantity, Price (2 decimal places), and Notes.
   - **Grid View**: Displays all medicine attributes in an interactive grid, **excluding Notes** from the main grid view as per requirement (Notes are viewable via a dedicated Notes modal).

2. **Color Indications**:
   - 🟥 **Red Background**: Highlighted for medicines with expiry date **less than 30 days**.
   - 🟨 **Yellow Background**: Highlighted for medicines with stock quantity **less than 10**.
   - 🟧 **Combined Highlight**: Distinct visual indicators for medicines satisfying both criteria.

3. **Search & Real-Time Filtering**:
   - Instant search capability querying on medicine full name and brand.
   - Filter pills for quick toggling (All, Expiring Soon, Low Stock).

4. **Sale Records Mechanism**:
   - "Sell Medicine" action directly from the inventory grid.
   - Real-time stock validation and live total calculation ($/₹).
   - Automatically decrements medicine stock and saves transaction to `sales.json` on the server.
   - Complete **Sales Log Drawer / History** viewing all past transactions.

5. **Server-Side JSON Storage**:
   - Data stored in server-side JSON files: `data/medicines.json` and `data/sales.json`.

---

## 🛠️ Technical Stack

- **Backend**: .NET Core (ASP.NET Core Minimal API / Web API)
- **Frontend**: Single Page Application (HTML5, Vanilla JavaScript, Custom CSS with Glassmorphic Aesthetics & Google Fonts)
- **Storage**: Server-side JSON files with thread-safe file persistence

---

## 🚀 Steps to Launch

### Option 1: Running with .NET Core CLI (Assessment Standard)

```bash
# Step 1: Navigate to the project directory
cd MyConsoleApp

# Step 2: Build and run using dotnet CLI
dotnet run --project MyConsoleApp
```
The application will launch and be accessible at `http://localhost:5000` or `http://localhost:5001`.

### Option 2: Running with Node.js Runner (Cross-Platform Fallback)

If `.NET Core` SDK is not installed on the host machine, you can launch the exact same Web API and SPA server using Node.js:

```bash
# Navigate to project folder
cd MyConsoleApp

# Start the server
node server.js
```
Open `http://localhost:8080` in your web browser.

---

## 📁 Project Structure

```
MyConsoleApp/
├── MyConsoleApp.csproj      # .NET Core Web SDK project configuration
├── Program.cs               # ASP.NET Core Web API entry point & routes
├── Models/
│   ├── Medicine.cs          # Medicine data model
│   └── SaleRecord.cs        # Sale transaction model
├── Services/
│   └── JsonStorageService.cs # Thread-safe JSON file storage service
├── server.js                # Node.js fallback server
├── data/
│   ├── medicines.json       # Server-side JSON storage for medicines
│   └── sales.json           # Server-side JSON storage for sales
└── wwwroot/                 # SPA Frontend static files
    ├── index.html           # Main SPA UI
    ├── css/styles.css       # Custom styling & color highlights
    └── js/app.js            # SPA logic & API handlers
```
