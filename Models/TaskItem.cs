namespace TaskManager.Models;

public class TaskItem
{
  public int Id { get; set; }
  public string Title { get; set; } = string.Empty;
  public string? Description { get; set; }
  public TaskItemStatus Status { get; set; } = TaskItemStatus.ToDo;
  public Priority Priority { get; set; } = Priority.Medium;
  public DateTime? DueDate { get; set; }

  public int? CategoryId { get; set; }
  public Category? Category { get; set; }

  public DateTime CreatedAt { get; set; }
  public DateTime UpdatedAt { get; set; }
}