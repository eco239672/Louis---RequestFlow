using Loius.Requests.App.Models;
using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages;

public partial class DepartmentRequestsPage : ContentPage
{
    private readonly Department _department;
    private readonly LocalRequestRepository _repository;
    private readonly CloudRequestSynchronizer? _synchronizer;
    private readonly UserProfileOptions? _userProfile;

    protected DepartmentRequestsPage(
        Department department,
        LocalRequestRepository repository)
        : this(department, repository, null)
    {
    }

    public DepartmentRequestsPage(
        Department department,
        LocalRequestRepository repository,
        CloudRequestSynchronizer? synchronizer,
        UserProfileOptions? userProfile = null)
    {
        InitializeComponent();
        _department = department;
        _repository = repository;
        _synchronizer = synchronizer;
        _userProfile = userProfile;
        DepartmentNameLabel.Text = department.Name;
        LeaderLabel.Text = $"Vedúci oddelenia: {department.Leader}";
        PriorityPicker.ItemsSource = Enum.GetValues<RequestPriority>();
        PriorityPicker.SelectedItem = RequestPriority.Green;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await SynchronizeAndRefreshAsync();
    }

    protected override void OnSizeAllocated(double width, double height)
    {
        base.OnSizeAllocated(width, height);

        var compact = width < 600;
        PageLayout.Padding = new Thickness(compact ? 12 : 20);
        DepartmentNameLabel.FontSize = compact ? 22 : 28;
        LeaderLabel.FontSize = compact ? 13 : 14;
    }

    private async void CreateRequest_Clicked(object? sender, EventArgs e)
    {
        if (string.IsNullOrWhiteSpace(TitleEntry.Text))
        {
            await DisplayAlertAsync("Chýba názov", "Zadajte názov požiadavky.", "Rozumiem");
            return;
        }

        await _repository.CreateAsync(
            TitleEntry.Text.Trim(),
            DescriptionEditor.Text?.Trim(),
            (RequestPriority)(PriorityPicker.SelectedItem ?? RequestPriority.Green),
            _department.Name);

        TitleEntry.Text = string.Empty;
        DescriptionEditor.Text = string.Empty;
        PriorityPicker.SelectedItem = RequestPriority.Green;
        await SynchronizeAndRefreshAsync();
    }

    private async Task RefreshAsync()
    {
        var requests = await _repository.GetOrderedAsync(_department.Name);
        var canApprove = _userProfile?.CanApproveRequests == true;
        foreach (var request in requests)
        {
            request.CanBeApprovedByCurrentUser = canApprove && request.CanBeApproved;
        }
        RequestsView.ItemsSource = requests;
    }

    private async Task SynchronizeAndRefreshAsync()
    {
        try
        {
            if (_synchronizer is not null)
            {
                await _synchronizer.SyncDepartmentAsync(_department.Name);
            }
        }
        catch (HttpRequestException)
        {
            // The local queue is retained and retries next time the page opens.
        }
        await RefreshAsync();
    }

    private void TitleEntry_Completed(object? sender, EventArgs e)
    {
        DescriptionEditor.Focus();
    }

    private async void Approve_Clicked(object? sender, EventArgs e)
    {
        await ChangeStatusAsync(sender, RequestStatus.Approved);
    }

    private async void Reject_Clicked(object? sender, EventArgs e)
    {
        await ChangeStatusAsync(sender, RequestStatus.Rejected);
    }

    private async Task ChangeStatusAsync(object? sender, RequestStatus status)
    {
        if (sender is not Button { CommandParameter: string id } || string.IsNullOrWhiteSpace(id)) return;

        await _repository.QueueStatusChangeAsync(id, status);
        await SynchronizeAndRefreshAsync();
    }

    private async void Back_Clicked(object? sender, EventArgs e)
    {
        await Navigation.PopAsync();
    }
}
