using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.Data;
using TaskManager.DTOs;
using TaskManager.Models;

namespace TaskManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
  private readonly AppDbContext _context;

  public TasksController(AppDbContext context)
  {
    _context = context;
  }

  // GET /api/tasks?status=Done&search=text
  [HttpGet]
  public async Task<ActionResult<IEnumerable<TaskResponseDto>>> GetAll(
      [FromQuery] TaskItemStatus? status,
      [FromQuery] string? search)
  {
    var query = _context.TaskItems
        .Include(t => t.Category)
        .AsQueryable();

    if (status.HasValue)
    {
      query = query.Where(t => t.Status == status.Value);
    }

    if (!string.IsNullOrWhiteSpace(search))
    {
      query = query.Where(t =>
          t.Title.Contains(search) ||
          (t.Description != null && t.Description.Contains(search)));
    }

    var tasks = await query.OrderBy(t => t.Id).ToListAsync();
    return Ok(tasks.Select(ToResponse));
  }

  // GET /api/tasks/5
  [HttpGet("{id:int}")]
  public async Task<ActionResult<TaskResponseDto>> GetById(int id)
  {
    var task = await _context.TaskItems
        .Include(t => t.Category)
        .FirstOrDefaultAsync(t => t.Id == id);

    if (task == null)
    {
      return NotFound(new { message = $"משימה {id} לא נמצאה" });
    }

    return Ok(ToResponse(task));
  }

  // POST /api/tasks
  [HttpPost]
  public async Task<ActionResult<TaskResponseDto>> Create(CreateTaskDto dto)
  {
    if (dto.CategoryId.HasValue && !await CategoryExists(dto.CategoryId.Value))
    {
      return BadRequest(new { message = $"קטגוריה {dto.CategoryId} לא קיימת" });
    }

    var now = DateTime.Now;
    var task = new TaskItem
    {
      Title = dto.Title.Trim(),
      Description = dto.Description,
      Status = dto.Status,
      Priority = dto.Priority,
      DueDate = dto.DueDate,
      CategoryId = dto.CategoryId,
      CreatedAt = now,
      UpdatedAt = now
    };

    _context.TaskItems.Add(task);
    await _context.SaveChangesAsync();
    await _context.Entry(task).Reference(t => t.Category).LoadAsync();

    return CreatedAtAction(nameof(GetById), new { id = task.Id }, ToResponse(task));
  }

  // PUT /api/tasks/5
  [HttpPut("{id:int}")]
  public async Task<ActionResult<TaskResponseDto>> Update(int id, UpdateTaskDto dto)
  {
    var task = await _context.TaskItems.FindAsync(id);
    if (task == null)
    {
      return NotFound(new { message = $"משימה {id} לא נמצאה" });
    }

    if (dto.CategoryId.HasValue && !await CategoryExists(dto.CategoryId.Value))
    {
      return BadRequest(new { message = $"קטגוריה {dto.CategoryId} לא קיימת" });
    }

    task.Title = dto.Title.Trim();
    task.Description = dto.Description;
    task.Status = dto.Status;
    task.Priority = dto.Priority;
    task.DueDate = dto.DueDate;
    task.CategoryId = dto.CategoryId;
    task.UpdatedAt = DateTime.Now;

    await _context.SaveChangesAsync();
    await _context.Entry(task).Reference(t => t.Category).LoadAsync();

    return Ok(ToResponse(task));
  }

  // PATCH /api/tasks/5/status
  [HttpPatch("{id:int}/status")]
  public async Task<ActionResult<TaskResponseDto>> UpdateStatus(int id, UpdateStatusDto dto)
  {
    var task = await _context.TaskItems.FindAsync(id);
    if (task == null)
    {
      return NotFound(new { message = $"משימה {id} לא נמצאה" });
    }

    task.Status = dto.Status!.Value;
    task.UpdatedAt = DateTime.Now;

    await _context.SaveChangesAsync();
    await _context.Entry(task).Reference(t => t.Category).LoadAsync();

    return Ok(ToResponse(task));
  }

  // DELETE /api/tasks/5
  [HttpDelete("{id:int}")]
  public async Task<IActionResult> Delete(int id)
  {
    var task = await _context.TaskItems.FindAsync(id);
    if (task == null)
    {
      return NotFound(new { message = $"משימה {id} לא נמצאה" });
    }

    _context.TaskItems.Remove(task);
    await _context.SaveChangesAsync();

    return NoContent();
  }

  private Task<bool> CategoryExists(int id) =>
      _context.Categories.AnyAsync(c => c.Id == id);

  private static TaskResponseDto ToResponse(TaskItem task) => new()
  {
    Id = task.Id,
    Title = task.Title,
    Description = task.Description,
    Status = task.Status,
    Priority = task.Priority,
    DueDate = task.DueDate,
    CategoryId = task.CategoryId,
    CategoryName = task.Category?.Name,
    CreatedAt = task.CreatedAt,
    UpdatedAt = task.UpdatedAt
  };
}