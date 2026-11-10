using System.ComponentModel.DataAnnotations;
using TaskManager.Models;

namespace TaskManager.DTOs;

public class CreateTaskDto
{
  [Required(ErrorMessage = "יש להזין כותרת למשימה")]
  [MaxLength(100, ErrorMessage = "הכותרת יכולה להכיל עד 100 תווים")]
  public string Title { get; set; } = string.Empty;

  public string? Description { get; set; }
  public TaskItemStatus Status { get; set; } = TaskItemStatus.ToDo;
  public Priority Priority { get; set; } = Priority.Medium;
  public DateTime? DueDate { get; set; }
  public int? CategoryId { get; set; }
}