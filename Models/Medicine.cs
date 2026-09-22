using System;

namespace MyConsoleApp.Models
{
    public class Medicine
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string FullName { get; set; } = string.Empty;
        public string Notes { get; set; } = string.Empty;
        public DateTime ExpiryDate { get; set; }
        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public string Brand { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Computed properties for API responses
        public int DaysUntilExpiry => (ExpiryDate.Date - DateTime.UtcNow.Date).Days;
        public bool IsExpiringSoon => DaysUntilExpiry < 30;
        public bool IsLowStock => Quantity < 10;
    }
}
