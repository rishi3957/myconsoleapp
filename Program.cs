using System;
using System.IO;
using MyConsoleApp.Models;
using MyConsoleApp.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddSingleton<JsonStorageService>(sp =>
    new JsonStorageService(builder.Environment.ContentRootPath));

var app = builder.Build();

app.UseCors("AllowAll");
app.UseDefaultFiles();
app.UseStaticFiles();

// API Endpoints

// 1. GET /api/medicines - List all medicines (with optional search filter)
app.MapGet("/api/medicines", (JsonStorageService storage, string? search) =>
{
    var medicines = storage.GetMedicines();
    if (!string.IsNullOrWhiteSpace(search))
    {
        medicines = medicines.FindAll(m => 
            m.FullName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
            m.Brand.Contains(search, StringComparison.OrdinalIgnoreCase));
    }
    return Results.Ok(medicines);
});

// 2. GET /api/medicines/{id} - Get single medicine
app.MapGet("/api/medicines/{id}", (JsonStorageService storage, string id) =>
{
    var medicine = storage.GetMedicineById(id);
    return medicine is not null ? Results.Ok(medicine) : Results.NotFound(new { message = "Medicine not found" });
});

// 3. POST /api/medicines - Add new medicine
app.MapPost("/api/medicines", (JsonStorageService storage, Medicine medicine) =>
{
    if (string.IsNullOrWhiteSpace(medicine.FullName))
    {
        return Results.BadRequest(new { message = "Full Name is required" });
    }
    if (medicine.Price < 0)
    {
        return Results.BadRequest(new { message = "Price cannot be negative" });
    }
    if (medicine.Quantity < 0)
    {
        return Results.BadRequest(new { message = "Quantity cannot be negative" });
    }

    // Ensure price has 2 decimal places rounding
    medicine.Price = Math.Round(medicine.Price, 2);

    var created = storage.AddMedicine(medicine);
    return Results.Created($"/api/medicines/{created.Id}", created);
});

// 4. PUT /api/medicines/{id} - Update medicine details
app.MapPut("/api/medicines/{id}", (JsonStorageService storage, string id, Medicine updated) =>
{
    if (string.IsNullOrWhiteSpace(updated.FullName))
    {
        return Results.BadRequest(new { message = "Full Name is required" });
    }

    updated.Price = Math.Round(updated.Price, 2);
    var success = storage.UpdateMedicine(id, updated);
    return success ? Results.Ok(updated) : Results.NotFound(new { message = "Medicine not found" });
});

// 5. DELETE /api/medicines/{id} - Delete medicine
app.MapDelete("/api/medicines/{id}", (JsonStorageService storage, string id) =>
{
    var success = storage.DeleteMedicine(id);
    return success ? Results.Ok(new { message = "Medicine deleted successfully" }) : Results.NotFound(new { message = "Medicine not found" });
});

// 6. GET /api/sales - View sale records
app.MapGet("/api/sales", (JsonStorageService storage) =>
{
    var sales = storage.GetSales();
    return Results.Ok(sales);
});

// 7. POST /api/sales - Record a medicine sale
app.MapPost("/api/sales", (JsonStorageService storage, CreateSaleRequest request) =>
{
    try
    {
        var saleRecord = storage.RecordSale(request.MedicineId, request.Quantity);
        return Results.Ok(new { 
            message = "Sale processed successfully", 
            sale = saleRecord,
            updatedMedicine = storage.GetMedicineById(request.MedicineId)
        });
    }
    catch (ArgumentException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (InvalidOperationException ex)
    {
        return Results.BadRequest(new { message = ex.Message });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Fallback to SPA index.html for non-API routes
app.MapFallbackToFile("index.html");

app.Run();
