using Society_Management_System.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Society_Management_System.Repositories
{
    public interface IResidentRepository
    {
        public Task<List<Resident>> GetResidents();
        public Task<Resident> GetResidentById(int id);
        public Task<Resident> AddResident(Resident resident);
        public Task<Resident> UpdateResident(Resident resident);
        public Task<bool> DeleteResident(int id);
        public Task<Resident> CheckResident(string Name, string houseNumber);
    }
    public class ResidentRepository : IResidentRepository
    {
        private readonly SMSContext _context;
        public ResidentRepository(SMSContext context)
        {
            _context = context;
        }
        public async Task<List<Resident>> GetResidents()
        {
            List<Resident> residents = await _context.Resident.ToListAsync();
            return residents;
        }
        public async Task<Resident> GetResidentById(int id)
        {
            return await _context.Resident.FirstOrDefaultAsync(r => r.Id == id);
        }
        public async Task<Resident> AddResident(Resident resident)
        {
            _context.Resident.Add(resident);
            await _context.SaveChangesAsync();
            return resident;
        }
        public async Task<Resident> UpdateResident(Resident resident)
        {
            var foundResident = await GetResidentById(resident.Id);
            if (foundResident != null)
            {
                foundResident.Street = resident.Street;
                foundResident.HouseNumber = resident.HouseNumber;
                foundResident.PhoneNumber = resident.PhoneNumber;
                foundResident.OwnerName = resident.OwnerName;
                await _context.SaveChangesAsync();
                return foundResident;
            }
            else
            {
                return null;
            }
        }
        public async Task<bool> DeleteResident(int id)
        {
            Resident resident = await GetResidentById(id);
            if(resident != null)
            {
                _context.Resident.Remove(resident);
                await _context.SaveChangesAsync();
                return true;
            }
            else
            {
                return false;
            }
            
        }
        public async Task<Resident> CheckResident(string Name, string houseNumber)
        {
            return await _context.Resident.FirstOrDefaultAsync(r => r.OwnerName == Name && r.HouseNumber == houseNumber);
        }
    }
}
