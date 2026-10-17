# Louis – RequestFlow

## English description

Louis – RequestFlow is a mobile internal request-management app for company teams. Employees create requests and select the responsible department; department managers can review, approve, or reject them. The app keeps requests available offline and synchronizes them through a separate cloud backend, allowing multiple devices to work with the same up-to-date requests.

Offline-first základ aplikácie na evidenciu požiadaviek pre Windows, Android a iOS.

## Čo už je pripravené

- .NET MAUI projekt otvoriteľný vo Visual Studiu;
- lokálna SQLite databáza na každom zariadení;
- tvorba požiadaviek bez pripojenia;
- výber oddelenia pred vytvorením požiadavky (napríklad nákup, marketing alebo IT podpora);
- UUID, dočasná lokálna referencia, čas v UTC, priorita semafora a stav;
- stavy požiadavky: čaká na potvrdenie vedúcim, potvrdená, odmietnutá, rozpracovaná, čaká sa, vybavená, dokončená alebo zrušená;
- fronta neodoslaných zmien so synchronizáciou cez cloudové API;
- stabilné radenie: červená → žltá → zelená, potom od najstaršej požiadavky.

## Spustenie

1. Vo Visual Studio Installer nainštalujte workload **.NET Multi-platform App UI development** spolu s .NET SDK podporovaným vybranou verziou Visual Studia.
2. Otvorte `Loius.Requests.sln` vo Visual Studiu.
3. Obnovte NuGet balíky a spustite profil Windows Machine alebo Android Emulator.

## Cloudová synchronizácia

Samostatný cloudový projekt **Loius Requests** beží v Neone v regióne EÚ. Nie je prepojený s projektom e-shopu.

- serverová funkcia je v `backend/src/index.ts`;
- spoločná tabuľka je `work_requests`;
- aplikácia odosiela čakajúce požiadavky a po otvorení oddelenia stiahne aktuálny zoznam;
- pre test je konfigurácia dostupná cez tlačidlo **Nastavenie synchronizácie** na úvodnej obrazovke.

Aktuálny prístupový kľúč je len dočasný mechanizmus pre testovacie zariadenia. Pred produkčným nasadením treba doplniť samostatné používateľské účty, prihlásenie a oprávnenia podľa roly.

## Ďalší krok

- vedúci zvoleného oddelenia potvrdí alebo odmietne novú požiadavku; zvolené oddelenie sa pritom nemení;
- doplniť prihlásenie a roly, aby tlačidlá rozhodnutia videl a používal iba vedúci príslušného oddelenia;
- používateľ si nebude môcť sám meniť svoje oddelenie ani vedúceho: tieto údaje bude spravovať administrátor externe.
