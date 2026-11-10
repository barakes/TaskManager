using TaskManager.Models;

namespace TaskManager.DTOs;

public class TaskResponseDto
{
  public int Id { get; set; }
  public string Title { get; set; } = string.Empty;
  public string? Description { get; set; }
  public TaskItemStatus Status { get; set; }
  public Priority Priority { get; set; }
  public DateTime? DueDate { get; set; }
  public int? CategoryId { get; set; }
  public string? CategoryName { get; set; }
  public DateTime CreatedAt { get; set; }
  public DateTime UpdatedAt { get; set; }
}