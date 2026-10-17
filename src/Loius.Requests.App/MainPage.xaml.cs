using Loius.Requests.App.Pages;
using Loius.Requests.App.Services;

namespace Loius.Requests.App;

public partial class MainPage : ContentPage
{
    private readonly LocalRequestRepository _repository;
    private readonly CloudSyncOptions _cloudSyncOptions;
    private readonly CloudRequestSynchronizer _synchronizer;
    private readonly UserProfileOptions _userProfile;
    private readonly CloudUserEnrollmentService _enrollment;

    public MainPage(
        LocalRequestRepository repository,
        CloudSyncOptions cloudSyncOptions,
        CloudRequestSynchronizer synchronizer,
        UserProfileOptions userProfile,
        CloudUserEnrollmentService enrollment)
    {
        InitializeComponent();
        _repository = repository;
        _cloudSyncOptions = cloudSyncOptions;
        _synchronizer = synchronizer;
        _userProfile = userProfile;
        _enrollment = enrollment;
    }

    private async void Department_Clicked(object? sender, EventArgs e)
    {
        if (sender is not Button { Text: { Length: > 0 } departmentName }) return;

        var department = CompanyStructure.Departments.SingleOrDefault(
            item => item.Name == departmentName);
        if (department is null) return;

        await Navigation.PushAsync(DepartmentPageFactory.Create(department, _repository, _synchronizer, _userProfile));
    }

    private async void CloudSettings_Clicked(object? sender, EventArgs e)
    {
        await Navigation.PushAsync(new CloudSettingsPage(_cloudSyncOptions, _userProfile, _enrollment));
    }
}
