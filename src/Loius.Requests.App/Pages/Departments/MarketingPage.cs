using Loius.Requests.App.Models;
using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages.Departments;

public sealed class MarketingPage(Department department, LocalRequestRepository repository)
    : DepartmentRequestsPage(department, repository);
