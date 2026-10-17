using Loius.Requests.App.Models;
using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages;

public static class DepartmentPageFactory
{
    public static Page Create(
        Department department,
        LocalRequestRepository repository,
        CloudRequestSynchronizer synchronizer,
        UserProfileOptions userProfile) =>
        new DepartmentRequestsPage(department, repository, synchronizer, userProfile);
}
