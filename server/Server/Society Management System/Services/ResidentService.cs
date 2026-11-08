using Society_Management_System.Models;
using Society_Management_System.Repositories;

namespace Society_Management_System.Services
{
    public interface IResidentService
    {
        Task<List<Resident>> GetResidents();
        Task<Resident> GetResidentById(int id);
        Task<Resident> AddResident(Resident resident);
        Task<Resident> UpdateResident(Resident resident);
        Task<bool> DeleteResident(int id);
        Task<Resident> CheckResident(string Name,string houseNumber);
    }
    public class ResidentService : IResidentService
    {
        private readonly IResidentRepository _repository;

        public ResidentService(IResidentRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<Resident>> GetResidents()
        {
            return await _repository.GetResidents();
        }

        public async Task<Resident> GetResidentById(int id)
        {
            return await _repository.GetResidentById(id);
        }

        public async Task<Resident> AddResident(Resident resident)
        {
            return await _repository.AddResident(resident);
        }

        public async Task<Resident> UpdateResident(Resident resident)
        {
            return await _repository.UpdateResident(resident);
        }

        public async Task<bool> DeleteResident(int id)
        {
            return await _repository.DeleteResident(id);
        }
        public async Task<Resident> CheckResident(string Name,string houseNumber)
        {
            return await _repository.CheckResident(Name, houseNumber);
        }
    }
}
