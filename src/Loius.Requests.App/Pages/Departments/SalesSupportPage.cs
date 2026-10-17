using Loius.Requests.App.Models;
using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages.Departments;

public sealed class SalesSupportPage(Department department, LocalRequestRepository repository)
    : DepartmentRequestsPage(department, repository);
