using Microsoft.AspNetCore.Mvc;
using Society_Management_System.Models;
using Society_Management_System.Services;
using Microsoft.Identity;
using Microsoft.AspNetCore.Authorization;

namespace Society_Management_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MonthlySummaryController : ControllerBase
    {
        private readonly IMonthlySummaryService _monthlySummaryService;

        public MonthlySummaryController(IMonthlySummaryService monthlySummaryService)
        {
            _monthlySummaryService = monthlySummaryService;
        }

        [HttpGet]
        [Authorize]
        public async Task<ActionResult<List<MonthlySummary>>> GetMonthlySummaries()
        {
            var summaries = await _monthlySummaryService.GetMonthlySummaries();
            return Ok(summaries);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<MonthlySummary>> GetMonthlySummaryById(int id)
        {
            var summary = await _monthlySummaryService.GetMonthlySummaryById(id);

            if (summary == null)
            {
                return NotFound();
            }

            return Ok(summary);
        }

        [HttpGet("month/{month}/year/{year}")]
        public async Task<ActionResult<MonthlySummary>> GetMonthlySummaryByMonthYear(int month, int year)
        {
            var summary = await _monthlySummaryService.GetMonthlySummaryByMonthYear(month, year);

            if (summary == null)
            {
                return NotFound();
            }

            return Ok(summary);
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<MonthlySummary>> AddMonthlySummary(MonthlySummary summary)
        {
            var addedSummary = await _monthlySummaryService.AddMonthlySummary(summary);
            return CreatedAtAction(nameof(GetMonthlySummaryById), new { id = addedSummary.Id }, addedSummary);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<MonthlySummary>> UpdateMonthlySummary(int id, MonthlySummary summary)
        {
            if (id != summary.Id)
            {
                return BadRequest("Summary ID mismatch");
            }

            var updatedSummary = await _monthlySummaryService.UpdateMonthlySummary(summary);

            if (updatedSummary == null)
            {
                return NotFound();
            }

            return Ok(updatedSummary);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> DeleteMonthlySummary(int id)
        {
            var deleted = await _monthlySummaryService.DeleteMonthlySummary(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
