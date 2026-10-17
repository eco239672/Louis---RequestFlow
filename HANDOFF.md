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
- Je pripravená zmena na cloudové priradenie telefónu k používateľovi. Administrátor nastaví meno, rolu, oddelenie a telefónne číslo; aplikácia si rolu nenačítava z voľne vyplneného textu.
- Po otvorení oddelenia aplikácia automaticky synchronizuje údaje každých 15 sekúnd. Obnova sa zastaví po odchode z oddelenia a bez internetu bezpečne ponechá lokálne dáta.
- V cloude je pripravené administračné rozhranie `/admin` s tabuľkou `app_users`. Administrátor môže založiť používateľa v poradí meno, rola, oddelenie, telefónne číslo a deaktivovať účet. Samostatný administrátorský kľúč je v databáze uložený iba ako hash.

## Ďalšie pokračovanie

1. Nasadiť pripravenú migráciu `004_user_device_enrollment.sql`, funkciu a Android APK. Server potom povolí rozhodnutie iba aktívnemu vedúcemu príslušného oddelenia podľa telefónneho čísla a priradeného zariadenia.
2. Pridať push notifikácie: vedúcemu pri novej požiadavke a odosielateľovi po schválení alebo odmietnutí.
4. Upraviť obrazovku zoznamu pre malé telefóny, aby mali prijaté požiadavky a rozhodovacie tlačidlá viac priestoru na zobrazenie.
