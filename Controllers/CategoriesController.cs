using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskManager.Data;
using TaskManager.Models;

namespace TaskManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
  private readonly AppDbContext _context;

  public CategoriesController(AppDbContext context)
  {
    _context = context;
  }

  [HttpGet]
  public async Task<ActionResult<IEnumerable<Category>>> GetAll()
  {
    var categories = await _context.Categories
        .OrderBy(c => c.Id)
        .ToListAsync();

    return Ok(categories);
  }
}