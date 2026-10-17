using Loius.Requests.App.Models;
using SQLite;

namespace Loius.Requests.App.Services;

public sealed class LocalRequestRepository
{
    private readonly DeviceIdentityService _deviceIdentity;
    private readonly SQLiteAsyncConnection _database;
    private readonly SemaphoreSlim _initializationLock = new(1, 1);
    private bool _initialized;

    public LocalRequestRepository(DeviceIdentityService deviceIdentity)
    {
        _deviceIdentity = deviceIdentity;
        var databasePath = Path.Combine(FileSystem.AppDataDirectory, "loius-requests.db3");
        _database = new SQLiteAsyncConnection(databasePath);
    }

    public async Task<WorkRequest> CreateAsync(string title, string? description, RequestPriority priority, string department)
    {
        await EnsureInitializedAsync();
        var now = DateTime.UtcNow;
        var request = new WorkRequest
        {
            LocalReference = $"OFF-{_deviceIdentity.GetDeviceId()[..6].ToUpperInvariant()}-{now:yyyyMMddHHmmss}",
            Title = title,
            Description = description,
            Department = department,
            Priority = priority,
            CreatedAtUtc = now,
            OriginDeviceId = _deviceIdentity.GetDeviceId()
        };
        await _database.InsertAsync(request);
        return request;
    }

    public async Task<IReadOnlyList<WorkRequest>> GetOrderedAsync(string department)
    {
        await EnsureInitializedAsync();
        var requests = await _database.Table<WorkRequest>()
            .Where(request => request.Department == department)
            .ToListAsync();

        return requests
            .OrderByDescending(request => request.Priority)
            .ThenBy(request => request.CreatedAtUtc)
            .ThenBy(request => request.Id, StringComparer.Ordinal)
            .ToList();
    }

    public async Task<IReadOnlyList<WorkRequest>> GetWaitingForNetworkAsync(string department)
    {
        await EnsureInitializedAsync();
        return await _database.Table<WorkRequest>()
            .Where(request =>
                request.Department == department &&
                request.DeliveryState == SubmissionState.WaitingForNetwork)
            .ToListAsync();
    }

    public async Task MarkAsSentAsync(string id)
    {
        await EnsureInitializedAsync();
        var request = await _database.FindAsync<WorkRequest>(id);
        if (request is null) return;

        request.DeliveryState = SubmissionState.Sent;
        await _database.UpdateAsync(request);
    }

    public async Task QueueStatusChangeAsync(string id, RequestStatus status)
    {
        await EnsureInitializedAsync();
        var request = await _database.FindAsync<WorkRequest>(id);
        if (request is null) return;

        request.Status = status;
        request.PendingStatus = status;
        request.DeliveryState = SubmissionState.WaitingForNetwork;
        await _database.UpdateAsync(request);
    }

    public async Task UpsertFromCloudAsync(WorkRequest request)
    {
        await EnsureInitializedAsync();
        await _database.InsertOrReplaceAsync(request);
    }

    private async Task EnsureInitializedAsync()
    {
        if (_initialized) return;
        await _initializationLock.WaitAsync();
        try
        {
            if (_initialized) return;
            await _database.CreateTableAsync<WorkRequest>();
            var workRequestColumns = await _database.GetTableInfoAsync(nameof(WorkRequest));
            if (workRequestColumns.All(column => column.Name != nameof(WorkRequest.Department)))
            {
                await _database.ExecuteAsync("ALTER TABLE WorkRequest ADD COLUMN Department TEXT");
            }
            if (workRequestColumns.All(column => column.Name != nameof(WorkRequest.DeliveryState)))
            {
                await _database.ExecuteAsync(
                    "ALTER TABLE WorkRequest ADD COLUMN DeliveryState INTEGER NOT NULL DEFAULT 0");
            }
            if (workRequestColumns.All(column => column.Name != nameof(WorkRequest.PendingStatus)))
            {
                await _database.ExecuteAsync("ALTER TABLE WorkRequest ADD COLUMN PendingStatus INTEGER NULL");
            }
            await _database.ExecuteAsync(
                "CREATE INDEX IF NOT EXISTS IX_WorkRequest_Department ON WorkRequest(Department)");
            _initialized = true;
        }
        finally
        {
            _initializationLock.Release();
        }
    }
}
