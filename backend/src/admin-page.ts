export const adminPage = String.raw`<!doctype html>
<html lang="sk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Louis – RequestFlow | Administrácia</title>
  <style>
    :root { color-scheme: light; font-family: "Segoe UI", Arial, sans-serif; color: #17212b; background: #f5f7fa; }
    * { box-sizing: border-box; }
    body { margin: 0; }
    header { background: #173a5e; color: white; padding: 28px 18px; }
    header div, main { max-width: 1040px; margin: auto; }
    h1 { margin: 0; font-size: clamp(24px, 4vw, 34px); }
    header p { margin: 7px 0 0; color: #d9e9f7; }
    main { padding: 22px 18px 48px; }
    .card { background: white; border: 1px solid #dbe3ea; border-radius: 14px; box-shadow: 0 2px 10px #173a5e12; padding: 20px; margin-bottom: 18px; }
    .hidden { display: none !important; }
    #dashboard { display: flex; flex-direction: column; }
    #usersCard { order: 1; }
    #createCard { order: 2; }
    h2 { margin: 0 0 14px; font-size: 21px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
    label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
    input, select, button { font: inherit; }
    input, select { width: 100%; padding: 10px 11px; border: 1px solid #b8c6d2; border-radius: 8px; background: white; }
    button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 650; background: #1d6fa5; color: white; }
    button:hover { background: #155882; }
    button.secondary { background: #e9eff4; color: #243746; }
    button.secondary:hover { background: #d9e3ea; }
    .actions { display: flex; gap: 10px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
    .message { min-height: 21px; margin: 12px 0 0; color: #a12929; }
    .message.ok { color: #187341; }
    .user { display: grid; grid-template-columns: minmax(180px, 1.1fr) minmax(120px, .7fr) minmax(120px, .7fr) minmax(160px, .9fr) auto; gap: 10px; align-items: end; padding: 14px 0; border-top: 1px solid #e2e8ee; }
    .user:first-of-type { border-top: 0; }
    .badge { display: inline-block; font-size: 12px; margin-top: 6px; padding: 3px 7px; border-radius: 99px; background: #e6f3eb; color: #1e6a3b; }
    .badge.inactive { background: #f6e8e8; color: #963636; }
    #lock { max-width: 480px; margin: 48px auto; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } .user { grid-template-columns: 1fr; } .user button { width: 100%; } }
  </style>
</head>
<body>
  <header><div><h1>Louis – RequestFlow</h1><p>Administrácia používateľov a oddelení</p></div></header>
  <main>
    <section id="lock" class="card">
      <h2>Administrátorský prístup</h2>
      <p>Zadajte administrátorský kľúč. Uloží sa iba počas otvoreného okna prehliadača.</p>
      <label>Administrátorský kľúč<input id="adminKey" type="password" autocomplete="current-password"></label>
      <div class="actions"><button id="unlock">Otvoriť administráciu</button></div>
      <p id="lockMessage" class="message"></p>
    </section>

    <section id="dashboard" class="hidden">
      <section id="createCard" class="card">
        <h2>Pridať zamestnanca</h2>
        <form id="createForm">
          <div class="grid">
            <label>Meno a priezvisko<input id="name" required maxlength="200" placeholder="Ján Novák"></label>
            <label>Rola<select id="role"><option value="employee">Zamestnanec</option><option value="manager">Vedúci</option><option value="administrator">Administrátor</option></select></label>
            <label>Oddelenie<select id="department"></select></label>
            <label>Telefónne číslo<input id="phoneNumber" required inputmode="tel" maxlength="30" placeholder="0901 123 456"></label>
          </div>
          <div class="actions"><button type="submit">Uložiť zamestnanca</button><button type="button" id="addAnother" class="secondary">Pridať ďalšieho zamestnanca</button><button type="button" id="cancelCreate" class="secondary hidden">Zrušiť</button><button type="button" id="signOut" class="secondary">Odhlásiť administráciu</button></div>
          <p id="formMessage" class="message"></p>
        </form>
      </section>
      <section id="usersCard" class="card">
        <div class="actions" style="margin-top:0; justify-content:space-between"><h2 style="margin:0">Používatelia</h2><button type="button" id="addEmployee">Pridať zamestnanca</button></div>
        <p id="listMessage" class="message"></p>
        <div id="users"></div>
      </section>
    </section>
  </main>
  <script>
    const departments = ["", "Nákup", "Marketing", "IT podpora", "Údržba a technika", "Sklad a logistika", "Financie a účtovníctvo", "Personalistika (HR)", "Obchod a zákaznícka podpora", "Vedenie firmy", "Ostatné"];
    const roles = { employee: "Zamestnanec", manager: "Vedúci", administrator: "Administrátor" };
    const keyName = "loius-admin-key";
    const byId = (id) => document.getElementById(id);
    const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
    const departmentOptions = (selected) => departments.map((department) => '<option value="' + escapeHtml(department) + '"' + (department === selected ? ' selected' : '') + '>' + (department || 'Bez oddelenia') + '</option>').join("");
    const roleOptions = (selected) => Object.entries(roles).map(([value, label]) => '<option value="' + value + '"' + (value === selected ? ' selected' : '') + '>' + label + '</option>').join("");
    const setMessage = (id, message, ok) => { const element = byId(id); element.textContent = message || ""; element.className = "message" + (ok ? " ok" : ""); };
    const key = () => sessionStorage.getItem(keyName) || "";
    async function api(path, options) {
      const response = await fetch(path, { ...options, headers: { "content-type": "application/json", "x-loius-admin-key": key(), ...(options && options.headers ? options.headers : {}) } });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Operáciu sa nepodarilo vykonať.");
      return body;
    }
    async function loadUsers() {
      setMessage("listMessage", "", false);
      const users = await api("/admin-api/users");
      const container = byId("users");
      if (!users.length) { container.innerHTML = "<p>Zatiaľ nie sú vytvorení žiadni používatelia.</p>"; return; }
      container.innerHTML = users.map((user, index) => '<div class="user" data-id="' + user.id + '"><div><strong>' + (index + 1) + '. ' + escapeHtml(user.name) + '</strong><span class="badge ' + (user.isActive ? '' : 'inactive') + '">' + (user.isActive ? 'Aktívny účet' : 'Deaktivovaný účet') + '</span><span class="badge ' + (user.deviceLinked ? '' : 'inactive') + '">' + (user.deviceLinked ? 'Telefón pripojený' : 'Telefón nepripojený') + '</span></div><label>Rola<select class="user-role">' + roleOptions(user.role) + '</select></label><label>Oddelenie<select class="user-department">' + departmentOptions(user.department || "") + '</select></label><label>Telefónne číslo<input class="user-phone-number" inputmode="tel" maxlength="30" value="' + escapeHtml(user.phoneNumber) + '"></label><button class="save-user">Uložiť</button><button class="toggle-user secondary">' + (user.isActive ? 'Deaktivovať' : 'Aktivovať') + '</button>' + (user.deviceLinked ? '<button class="unpair-user secondary">Odpojiť telefón</button>' : '') + '</div>').join("");
      container.querySelectorAll(".save-user").forEach((button) => button.addEventListener("click", () => saveUser(button.closest(".user"))));
      container.querySelectorAll(".toggle-user").forEach((button) => button.addEventListener("click", () => toggleUser(button.closest(".user"), button.textContent === "Aktivovať")));
      container.querySelectorAll(".unpair-user").forEach((button) => button.addEventListener("click", () => unpairDevice(button.closest(".user"))));
    }
    async function saveUser(row) {
      try { const phoneNumber = row.querySelector(".user-phone-number").value.trim(); await api("/admin-api/users/" + row.dataset.id, { method: "PATCH", body: JSON.stringify({ role: row.querySelector(".user-role").value, department: row.querySelector(".user-department").value || null, phoneNumber }) }); setMessage("listMessage", "Používateľ bol uložený.", true); await loadUsers(); }
      catch (error) { setMessage("listMessage", error.message, false); }
    }
    async function toggleUser(row, isActive) {
      try { await api("/admin-api/users/" + row.dataset.id, { method: "PATCH", body: JSON.stringify({ isActive }) }); setMessage("listMessage", "Stav účtu bol zmenený.", true); await loadUsers(); }
      catch (error) { setMessage("listMessage", error.message, false); }
    }
    async function unpairDevice(row) {
      try { await api("/admin-api/users/" + row.dataset.id, { method: "PATCH", body: JSON.stringify({ unpairDevice: true }) }); setMessage("listMessage", "Telefón bol odpojený.", true); await loadUsers(); }
      catch (error) { setMessage("listMessage", error.message, false); }
    }
    async function openDashboard() {
      const entered = byId("adminKey").value.trim();
      if (entered) sessionStorage.setItem(keyName, entered);
      if (!key()) { setMessage("lockMessage", "Zadajte administrátorský kľúč.", false); return; }
      try { await loadUsers(); byId("lock").classList.add("hidden"); byId("dashboard").classList.remove("hidden"); }
      catch (error) { sessionStorage.removeItem(keyName); setMessage("lockMessage", error.message, false); }
    }
    function showCreateForm() {
      byId("createForm").reset();
      byId("department").innerHTML = departmentOptions("");
      setMessage("formMessage", "", false);
      byId("createCard").classList.remove("hidden");
      byId("cancelCreate").classList.remove("hidden");
      byId("createCard").scrollIntoView({ behavior: "smooth", block: "start" });
      byId("name").focus();
    }
    byId("department").innerHTML = departmentOptions("");
    byId("unlock").addEventListener("click", openDashboard);
    byId("adminKey").addEventListener("keydown", (event) => { if (event.key === "Enter") openDashboard(); });
    byId("createForm").addEventListener("submit", async (event) => { event.preventDefault(); try { await api("/admin-api/users", { method: "POST", body: JSON.stringify({ name: byId("name").value, role: byId("role").value, department: byId("department").value || null, phoneNumber: byId("phoneNumber").value }) }); event.target.reset(); await loadUsers(); setMessage("formMessage", "Zamestnanec bol uložený. Môžete pridať ďalšieho.", true); byId("usersCard").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (error) { setMessage("formMessage", error.message, false); } });
    byId("addEmployee").addEventListener("click", showCreateForm);
    byId("addAnother").addEventListener("click", showCreateForm);
    byId("cancelCreate").addEventListener("click", () => byId("createCard").classList.add("hidden"));
    byId("signOut").addEventListener("click", () => { sessionStorage.removeItem(keyName); byId("dashboard").classList.add("hidden"); byId("lock").classList.remove("hidden"); byId("adminKey").value = ""; });
    if (key()) openDashboard();
  </script>
</body>
</html>`;
