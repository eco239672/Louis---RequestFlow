using Loius.Requests.App.Models;
using Loius.Requests.App.Services;

namespace Loius.Requests.App.Pages;

public partial class DepartmentRequestsPage : ContentPage
{
    private static readonly TimeSpan AutoRefreshInterval = TimeSpan.FromSeconds(15);
    private readonly Department _department;
    private readonly LocalRequestRepository _repository;
    private readonly CloudRequestSynchronizer? _synchronizer;
    private readonly UserProfileOptions? _userProfile;
    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private CancellationTokenSource? _autoRefreshCancellation;

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

        _autoRefreshCancellation?.Cancel();
        _autoRefreshCancellation?.Dispose();
        _autoRefreshCancellation = new CancellationTokenSource();

        var cancellationToken = _autoRefreshCancellation.Token;
        await SynchronizeAndRefreshAsync(cancellationToken);

        if (!cancellationToken.IsCancellationRequested)
        {
            _ = RefreshAutomaticallyAsync(cancellationToken);
        }
    }

    protected override void OnDisappearing()
    {
        _autoRefreshCancellation?.Cancel();
        _autoRefreshCancellation?.Dispose();
        _autoRefreshCancellation = null;
        base.OnDisappearing();
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

    private async Task RefreshAutomaticallyAsync(CancellationToken cancellationToken)
    {
        using var timer = new PeriodicTimer(AutoRefreshInterval);

        try
        {
            while (await timer.WaitForNextTickAsync(cancellationToken))
            {
                await SynchronizeAndRefreshAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            // Automatic refresh ends when the user leaves this department.
        }
    }

    private async Task SynchronizeAndRefreshAsync(CancellationToken cancellationToken = default)
    {
        var lockTaken = false;

        try
        {
            await _refreshLock.WaitAsync(cancellationToken);
            lockTaken = true;

            if (_synchronizer is not null)
            {
                await _synchronizer.SyncDepartmentAsync(_department.Name, cancellationToken);
            }
        }
        catch (HttpRequestException)
        {
            // The local queue is retained and the next automatic refresh retries it.
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            return;
        }
        finally
        {
            if (lockTaken)
            {
                _refreshLock.Release();
            }
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
