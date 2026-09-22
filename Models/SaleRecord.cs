using System;

namespace MyConsoleApp.Models
{
    public class SaleRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string MedicineId { get; set; } = string.Empty;
        public string MedicineName { get; set; } = string.Empty;
        public string Brand { get; set; } = string.Empty;
        public int QuantitySold { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public DateTime SaleDate { get; set; } = DateTime.UtcNow;
    }

    public class CreateSaleRequest
    {
        public string MedicineId { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
