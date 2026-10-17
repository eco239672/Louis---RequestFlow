using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages;

public partial class CloudSettingsPage : ContentPage
{
    private readonly CloudSyncOptions _options;
    private readonly UserProfileOptions _userProfile;
    private readonly CloudUserEnrollmentService _enrollment;

    public CloudSettingsPage(
        CloudSyncOptions options,
        UserProfileOptions userProfile,
        CloudUserEnrollmentService enrollment)
    {
        InitializeComponent();
        _options = options;
        _userProfile = userProfile;
        _enrollment = enrollment;
        AssignedUserLabel.Text = _userProfile.IsEnrolled
            ? $"Priradený používateľ: {_userProfile.FullName} ({_userProfile.RoleDisplayName})"
            : "Tento telefón ešte nie je priradený k používateľovi.";
        EndpointEntry.Text = _options.Endpoint;
        AccessKeyEntry.Text = _options.AccessKey;
    }

    private async void Save_Clicked(object? sender, EventArgs e)
    {
        var endpoint = EndpointEntry.Text?.Trim() ?? string.Empty;
        var accessKey = AccessKeyEntry.Text?.Trim() ?? string.Empty;
        var phoneNumber = PhoneNumberEntry.Text?.Trim() ?? string.Empty;
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps ||
            string.IsNullOrWhiteSpace(accessKey) ||
            string.IsNullOrWhiteSpace(phoneNumber))
        {
            await DisplayAlertAsync("Neplatné údaje", "Zadaj telefónne číslo, HTTPS adresu a prístupový kľúč.", "Rozumiem");
            return;
        }

        try
        {
            var profile = await _enrollment.EnrollAsync(endpoint, accessKey, phoneNumber);
            _options.Save(endpoint, accessKey);
            _userProfile.Save(profile);
        }
        catch (Exception exception) when (exception is HttpRequestException or InvalidOperationException)
        {
            await DisplayAlertAsync("Pripojenie sa nepodarilo", exception.Message, "Rozumiem");
            return;
        }

        await Navigation.PopAsync();
    }
}
