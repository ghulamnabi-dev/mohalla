using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Society_Management_System.Models;
using Society_Management_System.Services;

namespace Society_Management_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MonthlyExpenseController : ControllerBase
    {
        private readonly IMonthlyExpenseService _monthlyExpenseService;

        public MonthlyExpenseController(IMonthlyExpenseService monthlyExpenseService)
        {
            _monthlyExpenseService = monthlyExpenseService;
        }

        [HttpGet]
        public async Task<ActionResult<List<MonthlyExpense>>> GetAllExpenses()
        {
            var expenses = await _monthlyExpenseService.GetAllExpenses();
            return Ok(expenses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MonthlyExpense>> GetExpenseById(int id)
        {
            var expense = await _monthlyExpenseService.GetExpenseById(id);

            if (expense == null)
            {
                return NotFound();
            }

            return Ok(expense);
        }

        [HttpGet("month/{month}/year/{year}")]
        public async Task<ActionResult<List<MonthlyExpense>>> GetExpenseByMonthAndYear(int month, int year)
        {
            var expenses = await _monthlyExpenseService.GetExpenseByMonthAndYear(month, year);

            if (expenses == null || !expenses.Any())
            {
                return NotFound();
            }

            return Ok(expenses);
        }

        [HttpPost]
        public async Task<ActionResult<MonthlyExpense>> AddExpense(MonthlyExpense expense)
        {
            var createdExpense = await _monthlyExpenseService.AddExpense(expense);
            return CreatedAtAction(nameof(GetExpenseById), new { id = createdExpense.Id }, createdExpense);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<MonthlyExpense>> UpdateExpense(int id, MonthlyExpense expense)
        {
            if (id != expense.Id)
            {
                return BadRequest("Expense ID mismatch");
            }

            var updatedExpense = await _monthlyExpenseService.UpdateExpense(expense);

            if (updatedExpense == null)
            {
                return NotFound();
            }

            return Ok(updatedExpense);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExpense(int id)
        {
            var deleted = await _monthlyExpenseService.DeleteExpense(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
