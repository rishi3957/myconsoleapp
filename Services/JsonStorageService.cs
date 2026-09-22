using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using MyConsoleApp.Models;

namespace MyConsoleApp.Services
{
    public class JsonStorageService
    {
        private readonly string _dataDir;
        private readonly string _medicinesFilePath;
        private readonly string _salesFilePath;
        private static readonly object _fileLock = new object();

        private static readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNameCaseInsensitive = true
        };

        public JsonStorageService(string contentRootPath)
        {
            _dataDir = Path.Combine(contentRootPath, "data");
            if (!Directory.Exists(_dataDir))
            {
                Directory.CreateDirectory(_dataDir);
            }

            _medicinesFilePath = Path.Combine(_dataDir, "medicines.json");
            _salesFilePath = Path.Combine(_dataDir, "sales.json");

            SeedInitialDataIfEmpty();
        }

        public List<Medicine> GetMedicines()
        {
            lock (_fileLock)
            {
                if (!File.Exists(_medicinesFilePath)) return new List<Medicine>();
                string json = File.ReadAllText(_medicinesFilePath);
                return JsonSerializer.Deserialize<List<Medicine>>(json, _jsonOptions) ?? new List<Medicine>();
            }
        }

        public Medicine? GetMedicineById(string id)
        {
            return GetMedicines().FirstOrDefault(m => m.Id == id);
        }

        public Medicine AddMedicine(Medicine medicine)
        {
            lock (_fileLock)
            {
                var medicines = GetMedicines();
                if (string.IsNullOrWhiteSpace(medicine.Id))
                {
                    medicine.Id = Guid.NewGuid().ToString();
                }
                medicine.CreatedAt = DateTime.UtcNow;
                medicines.Add(medicine);

                string json = JsonSerializer.Serialize(medicines, _jsonOptions);
                File.WriteAllText(_medicinesFilePath, json);
                return medicine;
            }
        }

        public bool UpdateMedicine(string id, Medicine updated)
        {
            lock (_fileLock)
            {
                var medicines = GetMedicines();
                var index = medicines.FindIndex(m => m.Id == id);
                if (index == -1) return false;

                updated.Id = id;
                medicines[index] = updated;

                string json = JsonSerializer.Serialize(medicines, _jsonOptions);
                File.WriteAllText(_medicinesFilePath, json);
                return true;
            }
        }

        public bool DeleteMedicine(string id)
        {
            lock (_fileLock)
            {
                var medicines = GetMedicines();
                var medicine = medicines.FirstOrDefault(m => m.Id == id);
                if (medicine == null) return false;

                medicines.Remove(medicine);
                string json = JsonSerializer.Serialize(medicines, _jsonOptions);
                File.WriteAllText(_medicinesFilePath, json);
                return true;
            }
        }

        public List<SaleRecord> GetSales()
        {
            lock (_fileLock)
            {
                if (!File.Exists(_salesFilePath)) return new List<SaleRecord>();
                string json = File.ReadAllText(_salesFilePath);
                return JsonSerializer.Deserialize<List<SaleRecord>>(json, _jsonOptions) ?? new List<SaleRecord>();
            }
        }

        public SaleRecord RecordSale(string medicineId, int quantitySold)
        {
            lock (_fileLock)
            {
                var medicines = GetMedicines();
                var medicine = medicines.FirstOrDefault(m => m.Id == medicineId);
                if (medicine == null)
                {
                    throw new ArgumentException("Medicine not found");
                }

                if (quantitySold <= 0)
                {
                    throw new ArgumentException("Quantity sold must be greater than zero");
                }

                if (medicine.Quantity < quantitySold)
                {
                    throw new InvalidOperationException($"Insufficient stock. Available: {medicine.Quantity}, Requested: {quantitySold}");
                }

                // Deduct stock
                medicine.Quantity -= quantitySold;

                // Save medicines update
                string medicinesJson = JsonSerializer.Serialize(medicines, _jsonOptions);
                File.WriteAllText(_medicinesFilePath, medicinesJson);

                // Create Sale Record
                var sale = new SaleRecord
                {
                    Id = Guid.NewGuid().ToString(),
                    MedicineId = medicine.Id,
                    MedicineName = medicine.FullName,
                    Brand = medicine.Brand,
                    QuantitySold = quantitySold,
                    UnitPrice = medicine.Price,
                    TotalPrice = Math.Round(medicine.Price * quantitySold, 2),
                    SaleDate = DateTime.UtcNow
                };

                var sales = GetSales();
                sales.Insert(0, sale); // Recent sales first

                string salesJson = JsonSerializer.Serialize(sales, _jsonOptions);
                File.WriteAllText(_salesFilePath, salesJson);

                return sale;
            }
        }

        private void SeedInitialDataIfEmpty()
        {
            lock (_fileLock)
            {
                if (!File.Exists(_medicinesFilePath) || new FileInfo(_medicinesFilePath).Length == 0)
                {
                    var sampleMedicines = new List<Medicine>
                    {
                        new Medicine
                        {
                            Id = "med-101",
                            FullName = "Paracetamol Extra 500mg",
                            Notes = "Fast acting pain relief and fever reducer. Take after meals.",
                            ExpiryDate = DateTime.UtcNow.AddDays(15), // Expiring in < 30 days -> RED
                            Quantity = 45,
                            Price = 4.50m,
                            Brand = "HealthPharma",
                            CreatedAt = DateTime.UtcNow.AddDays(-10)
                        },
                        new Medicine
                        {
                            Id = "med-102",
                            FullName = "Amoxicillin Trihydrate 250mg",
                            Notes = "Broad spectrum antibiotic capsules. Complete full course as prescribed.",
                            ExpiryDate = DateTime.UtcNow.AddDays(180),
                            Quantity = 8, // Stock < 10 -> YELLOW
                            Price = 14.99m,
                            Brand = "MedLife Biocare",
                            CreatedAt = DateTime.UtcNow.AddDays(-5)
                        },
                        new Medicine
                        {
                            Id = "med-103",
                            FullName = "Cetirizine Hydrochloride 10mg",
                            Notes = "Non-drowsy antihistamine for seasonal allergies and hay fever.",
                            ExpiryDate = DateTime.UtcNow.AddDays(12), // Expiring < 30 days & Low Stock < 10 -> RED + YELLOW
                            Quantity = 5,
                            Price = 6.25m,
                            Brand = "SunCure Labs",
                            CreatedAt = DateTime.UtcNow.AddDays(-20)
                        },
                        new Medicine
                        {
                            Id = "med-104",
                            FullName = "Metformin HCl 500mg Prolonged Release",
                            Notes = "Oral anti-diabetic medication for managing Type 2 Diabetes.",
                            ExpiryDate = DateTime.UtcNow.AddDays(240),
                            Quantity = 120,
                            Price = 18.75m,
                            Brand = "GlycaCare",
                            CreatedAt = DateTime.UtcNow.AddDays(-30)
                        },
                        new Medicine
                        {
                            Id = "med-105",
                            FullName = "Ibuprofen 400mg Softgel Capsules",
                            Notes = "Anti-inflammatory painkiller for joint and muscular ache.",
                            ExpiryDate = DateTime.UtcNow.AddDays(22), // Expiring < 30 days -> RED
                            Quantity = 60,
                            Price = 8.99m,
                            Brand = "HealthPharma",
                            CreatedAt = DateTime.UtcNow.AddDays(-2)
                        },
                        new Medicine
                        {
                            Id = "med-106",
                            FullName = "Omeprazole Gastro-Resistant 20mg",
                            Notes = "Proton pump inhibitor for heartburn and acid reflux relief.",
                            ExpiryDate = DateTime.UtcNow.AddDays(365),
                            Quantity = 4, // Stock < 10 -> YELLOW
                            Price = 11.50m,
                            Brand = "AstraMed",
                            CreatedAt = DateTime.UtcNow.AddDays(-1)
                        }
                    };

                    string json = JsonSerializer.Serialize(sampleMedicines, _jsonOptions);
                    File.WriteAllText(_medicinesFilePath, json);
                }

                if (!File.Exists(_salesFilePath) || new FileInfo(_salesFilePath).Length == 0)
                {
                    var sampleSales = new List<SaleRecord>
                    {
                        new SaleRecord
                        {
                            Id = "sale-501",
                            MedicineId = "med-101",
                            MedicineName = "Paracetamol Extra 500mg",
                            Brand = "HealthPharma",
                            QuantitySold = 5,
                            UnitPrice = 4.50m,
                            TotalPrice = 22.50m,
                            SaleDate = DateTime.UtcNow.AddHours(-3)
                        },
                        new SaleRecord
                        {
                            Id = "sale-502",
                            MedicineId = "med-104",
                            MedicineName = "Metformin HCl 500mg Prolonged Release",
                            Brand = "GlycaCare",
                            QuantitySold = 2,
                            UnitPrice = 18.75m,
                            TotalPrice = 37.50m,
                            SaleDate = DateTime.UtcNow.AddHours(-1)
                        }
                    };

                    string json = JsonSerializer.Serialize(sampleSales, _jsonOptions);
                    File.WriteAllText(_salesFilePath, json);
                }
            }
        }
    }
}
