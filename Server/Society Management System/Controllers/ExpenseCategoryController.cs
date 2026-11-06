using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Society_Management_System.Models;
using Society_Management_System.Services;

namespace Society_Management_System.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class ExpenseCategoryController : ControllerBase
    {
        private readonly IExpenseCategoryService _categoryService;

        public ExpenseCategoryController(IExpenseCategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // GET: api/ExpenseCategory
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ExpenseCategory>>> GetAllCategories()
        {
            var categories = await _categoryService.GetAllCategories();
            return Ok(categories);
        }

        // GET: api/ExpenseCategory/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ExpenseCategory>> GetCategoryById(int id)
        {
            var category = await _categoryService.GetCategoryById(id);
            if (category == null)
                return NotFound();

            return Ok(category);
        }

        // POST: api/ExpenseCategory
        [HttpPost]
        public async Task<ActionResult<ExpenseCategory>> AddCategory([FromBody] ExpenseCategory category)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var createdCategory = await _categoryService.AddCategory(category);
            return CreatedAtAction(nameof(GetCategoryById), new { id = createdCategory.Id }, createdCategory);
        }

        // PUT: api/ExpenseCategory/5
        [HttpPut("{id}")]
        public async Task<ActionResult<ExpenseCategory>> UpdateCategory(int id, [FromBody] ExpenseCategory category)
        {
            if (id != category.Id)
                return BadRequest("ID mismatch");

            var updated = await _categoryService.UpdateCategory(category);
            if (updated == null)
                return NotFound();

            return Ok(updated);
        }

        // DELETE: api/ExpenseCategory/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var deleted = await _categoryService.DeleteCategory(id);
            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}
