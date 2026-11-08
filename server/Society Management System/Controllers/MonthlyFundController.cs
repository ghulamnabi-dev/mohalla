using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Society_Management_System.DTO;
using Society_Management_System.Models;
using Society_Management_System.Services;

namespace Society_Management_System.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MonthlyFundController : ControllerBase
    {
        private readonly IMonthlyFundService _monthlyFundService;

        public MonthlyFundController(IMonthlyFundService monthlyFundService)
        {
            _monthlyFundService = monthlyFundService;
        }

        [HttpGet]
        public async Task<ActionResult<List<MonthlyFund>>> GetAllFunds()
        {
            var funds = await _monthlyFundService.GetAllFunds();
            return Ok(funds);
        }

        
        /// <summary>Paged, filterable contributions joined with resident names. sort: period|resident|amount|paid|short.</summary>
        [HttpGet("search")]
        public async Task<ActionResult<PagedResult<FundRowDto>>> Search([FromQuery] FundQuery query, [FromServices] IReportingService reporting)
        {
            return Ok(await reporting.SearchFunds(query));
        }

        [HttpGet("month/{month}")]
        public async Task<ActionResult<MonthlyFund>> GetFundByMonth(int month)
        {
            var fund = await _monthlyFundService.GetFundsByMonth(month);

            if (fund == null)
            {
                return NotFound();
            }

            return Ok(fund);
        }

        [HttpGet("resident/{residentId}")]
        public async Task<ActionResult<List<MonthlyFund>>> GetFundsByResidentId(int residentId)
        {
            var funds = await _monthlyFundService.GetFundsByResidentId(residentId);

            if (funds == null || !funds.Any())
            {
                return NotFound();
            }

            return Ok(funds);
        }

        [HttpPost]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<MonthlyFund>> CreateFund(MonthlyFund fund)
        {
            var createdFund = await _monthlyFundService.CreateFund(fund);
            return Ok(createdFund);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<ActionResult<MonthlyFund>> UpdateFund(int id,[FromBody] MonthlyFund fund)
        {
            if (id != fund.Id)
            {
                return BadRequest("Fund ID mismatch");
            }

            var updatedFund = await _monthlyFundService.UpdateFund(fund);

            if (updatedFund == null)
            {
                return NotFound();
            }

            return Ok(updatedFund);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = Roles.Admin)]
        public async Task<IActionResult> DeleteFund(int id)
        {
            var deleted = await _monthlyFundService.DeleteFund(id);

            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
    }
}
