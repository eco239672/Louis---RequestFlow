# Stav – 17. 10. 2026

## Hotovo

- Samostatný Neon projekt **Loius Requests** v `aws-eu-central-1`; e-shop nebol menený.
- Tabuľka `work_requests` a index pre oddelenie/radenie sú vytvorené.
- Funkcia `loiusapi` je nasadená a pri teste úspešne prijala aj vrátila požiadavku `CLOUD-TEST-001` v oddelení IT podpora.
- Android aplikácia má lokálnu frontu, odoslanie do cloudu, načítanie z cloudu a obrazovku na nastavenie synchronizácie.
- Aktuálny testovací APK je `src/Loius.Requests.App/bin/Release/net10.0-android/android-x64/publish/com.loius.requests-Signed.apk`.
- Na oboch emulátoroch sú uložené rovnaké cloudové údaje. Test prešiel oboma smermi v oddelení IT podpora: požiadavka zamestnanca sa zobrazila vedúcemu a požiadavka vedúceho zamestnancovi.
- Cloudová databáza už podporuje stavy **potvrdená** a **odmietnutá**. Funkcia `loiusapi` je nasadená s API pre bezpečnú zmenu stavu a test vytvorenia → potvrdenia prešiel v cloude.
- Aktuálny APK je nainštalovaný na oboch emulátoroch. V rozhraní sú viditeľné stavy a tlačidlá **Potvrdiť/Odmietnuť**; potvrdenie cez rozhranie vedúceho zmenilo stav v cloude na `approved` a druhý telefón ho načítal.
- Každý používateľ si v nastavení zadá meno a pracovnú pozíciu. Ak pozícia obsahuje slovo **vedúci** (aj bez diakritiky), zobrazia sa mu tlačidlá **Potvrdiť/Odmietnuť**; ostatným používateľom nie.
- Po otvorení oddelenia aplikácia automaticky synchronizuje údaje každých 15 sekúnd. Obnova sa zastaví po odchode z oddelenia a bez internetu bezpečne ponechá lokálne dáta.

## Ďalšie pokračovanie

1. Pred produkčným použitím doplniť individuálne prihlásenie a roly zamestnanec/vedúci. Súčasné rozpoznanie slova **vedúci** je iba lokálne pravidlo rozhrania a nie je ním bezpečne vynútené oprávnenie na serveri.
2. Upraviť obrazovku zoznamu pre malé telefóny, aby mali prijaté požiadavky a rozhodovacie tlačidlá viac priestoru na zobrazenie.
