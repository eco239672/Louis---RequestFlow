using Loius.Requests.App.Models;

namespace Loius.Requests.App.Services;

public static class CompanyStructure
{
    public static Department[] Departments { get; } =
    [
        new("purchasing", "Nákup", "Ing. Roman Február"),
        new("marketing", "Marketing", "Marec Štefan"),
        new("it", "IT podpora", "Ing. Apríl Ondrej"),
        new("maintenance", "Údržba a technika", "Máj Ernest"),
        new("logistics", "Sklad a logistika", "Jún Erwin"),
        new("finance", "Financie a účtovníctvo", "Júlová Júlia"),
        new("hr", "Personalistika (HR)", "Zatiaľ nepriradený"),
        new("sales", "Obchod a zákaznícka podpora", "Zatiaľ nepriradený"),
        new("management", "Vedenie firmy", "Ing. Január Alfons"),
        new("other", "Ostatné", "Zatiaľ nepriradený")
    ];
}
