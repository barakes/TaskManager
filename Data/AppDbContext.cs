using Microsoft.EntityFrameworkCore;
using TaskManager.Models;

namespace TaskManager.Data;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
  {
  }

  public DbSet<TaskItem> TaskItems => Set<TaskItem>();
  public DbSet<Category> Categories => Set<Category>();

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    modelBuilder.Entity<TaskItem>()
        .Property(t => t.Status)
        .HasConversion<string>();

    modelBuilder.Entity<TaskItem>()
        .Property(t => t.Priority)
        .HasConversion<string>();

    modelBuilder.Entity<Category>().HasData(
        new Category { Id = 1, Name = "לימודים" },
        new Category { Id = 2, Name = "עבודה" },
        new Category { Id = 3, Name = "אישי" },
        new Category { Id = 4, Name = "בית" }
    );
  }
}