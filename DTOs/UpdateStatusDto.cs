using System.ComponentModel.DataAnnotations;
using TaskManager.Models;

namespace TaskManager.DTOs;

public class UpdateStatusDto
{
  [Required(ErrorMessage = "יש לציין סטטוס")]
  public TaskItemStatus? Status { get; set; }
}