using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages;

public partial class CloudSettingsPage : ContentPage
{
    private readonly CloudSyncOptions _options;
    private readonly UserProfileOptions _userProfile;

    public CloudSettingsPage(CloudSyncOptions options, UserProfileOptions userProfile)
    {
        InitializeComponent();
        _options = options;
        _userProfile = userProfile;
        FullNameEntry.Text = _userProfile.FullName;
        JobTitleEntry.Text = _userProfile.JobTitle;
        EndpointEntry.Text = _options.Endpoint;
        AccessKeyEntry.Text = _options.AccessKey;
    }

    private async void Save_Clicked(object? sender, EventArgs e)
    {
        var endpoint = EndpointEntry.Text?.Trim() ?? string.Empty;
        var accessKey = AccessKeyEntry.Text?.Trim() ?? string.Empty;
        var fullName = FullNameEntry.Text?.Trim() ?? string.Empty;
        var jobTitle = JobTitleEntry.Text?.Trim() ?? string.Empty;
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps ||
            string.IsNullOrWhiteSpace(accessKey) ||
            string.IsNullOrWhiteSpace(fullName) ||
            string.IsNullOrWhiteSpace(jobTitle))
        {
            await DisplayAlertAsync("Neplatné údaje", "Zadaj meno, funkciu, HTTPS adresu a prístupový kľúč.", "Rozumiem");
            return;
        }

        _options.Save(endpoint, accessKey);
        _userProfile.Save(fullName, jobTitle);
        await Navigation.PopAsync();
    }
}
