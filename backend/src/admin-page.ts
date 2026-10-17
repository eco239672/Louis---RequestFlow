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
    .modal { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; overflow-y: auto; padding: 18px; background: #17212b99; }
    .modal .card { width: min(760px, 100%); margin: auto; }
    h2 { margin: 0 0 14px; font-size: 21px; }
    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; }
    label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
    input, select, button { font: inherit; }
    input, select { width: 100%; padding: 10px 11px; border: 1px solid #b8c6d2; border-radius: 8px; background: white; }
    button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 650; background: #1d6fa5; color: white; }
    button:hover { background: #155882; }
    button.secondary { background: #e9eff4; color: #243746; }
    button.secondary:hover { background: #d9e3ea; }
    button.danger { background: #b33a3a; }
    button.danger:hover { background: #902c2c; }
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
      <div id="createModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="createTitle">
      <section id="createCard" class="card">
        <h2 id="createTitle">Pridať zamestnanca</h2>
        <form id="createForm">
          <div class="grid">
            <label>Meno a priezvisko<input id="name" required maxlength="200" placeholder="Ján Novák"></label>
            <label>Rola<select id="role"><option value="employee">Zamestnanec</option><option value="manager">Vedúci</option><option value="administrator">Administrátor</option></select></label>
            <label>Oddelenie<select id="department"></select></label>
            <label>Telefónne číslo<input id="phoneNumber" required inputmode="tel" maxlength="30" placeholder="0901 123 456"></label>
          </div>
          <div class="actions"><button type="submit">Uložiť zamestnanca</button><button type="button" id="cancelCreate" class="secondary">Zrušiť</button></div>
          <p id="formMessage" class="message"></p>
        </form>
      </section>
      </div>
      <div id="editModal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="editTitle">
      <section class="card">
        <h2 id="editTitle">Zmeniť zamestnanca</h2>
        <form id="editForm">
          <input id="editUserId" type="hidden">
          <div class="grid">
            <label>Meno a priezvisko<input id="editName" required maxlength="200"></label>
            <label>Rola<select id="editRole"><option value="employee">Zamestnanec</option><option value="manager">Vedúci</option><option value="administrator">Administrátor</option></select></label>
            <label>Oddelenie<select id="editDepartment"></select></label>
            <label>Telefónne číslo<input id="editPhoneNumber" required inputmode="tel" maxlength="30"></label>
          </div>
          <div class="actions"><button type="submit">Uložiť zmeny</button><button type="button" id="cancelEdit" class="secondary">Zrušiť</button></div>
          <p id="editMessage" class="message"></p>
        </form>
      </section>
      </div>
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
    let currentUsers = [];
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
      currentUsers = users;
      const container = byId("users");
      if (!users.length) { container.innerHTML = "<p>Zatiaľ nie sú vytvorení žiadni používatelia.</p>"; return; }
      container.innerHTML = users.map((user, index) => '<div class="user" data-id="' + user.id + '"><div><strong>' + (index + 1) + '. ' + escapeHtml(user.name) + '</strong><span class="badge ' + (user.isActive ? '' : 'inactive') + '">' + (user.isActive ? 'Aktívny účet' : 'Deaktivovaný účet') + '</span><span class="badge ' + (user.deviceLinked ? '' : 'inactive') + '">' + (user.deviceLinked ? 'Telefón pripojený' : 'Telefón nepripojený') + '</span></div><div><strong>Rola</strong><br>' + escapeHtml(roles[user.role] || user.role) + '</div><div><strong>Oddelenie</strong><br>' + escapeHtml(user.department || 'Bez oddelenia') + '</div><div><strong>Telefónne číslo</strong><br>' + escapeHtml(user.phoneNumber) + '</div><button class="edit-user">Zmeniť</button><button class="remove-user danger">Odstrániť</button>' + (user.deviceLinked ? '<button class="unpair-user secondary">Odpojiť telefón</button>' : '') + '</div>').join("");
      container.querySelectorAll(".edit-user").forEach((button) => button.addEventListener("click", () => openEditForm(button.closest(".user").dataset.id)));
      container.querySelectorAll(".remove-user").forEach((button) => button.addEventListener("click", () => removeUser(button.closest(".user"))));
      container.querySelectorAll(".unpair-user").forEach((button) => button.addEventListener("click", () => unpairDevice(button.closest(".user"))));
    }
    function openEditForm(id) {
      const user = currentUsers.find((item) => item.id === id);
      if (!user) return;
      byId("editUserId").value = user.id;
      byId("editName").value = user.name;
      byId("editRole").value = user.role;
      byId("editDepartment").innerHTML = departmentOptions(user.department || "");
      byId("editPhoneNumber").value = user.phoneNumber;
      setMessage("editMessage", "", false);
      byId("editModal").classList.remove("hidden");
      byId("editName").focus();
    }
    async function removeUser(row) {
      const name = row.querySelector("strong").textContent.replace(/^\d+\.\s*/, "");
      if (!confirm('Naozaj chcete odstrániť používateľa „' + name + '“?')) return;
      try { await api("/admin-api/users/" + row.dataset.id, { method: "DELETE" }); setMessage("listMessage", "Používateľ bol odstránený.", true); await loadUsers(); }
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
      byId("createModal").classList.remove("hidden");
      byId("name").focus();
    }
    byId("department").innerHTML = departmentOptions("");
    byId("editDepartment").innerHTML = departmentOptions("");
    byId("unlock").addEventListener("click", openDashboard);
    byId("adminKey").addEventListener("keydown", (event) => { if (event.key === "Enter") openDashboard(); });
    byId("createForm").addEventListener("submit", async (event) => { event.preventDefault(); try { await api("/admin-api/users", { method: "POST", body: JSON.stringify({ name: byId("name").value, role: byId("role").value, department: byId("department").value || null, phoneNumber: byId("phoneNumber").value }) }); event.target.reset(); await loadUsers(); byId("createModal").classList.add("hidden"); setMessage("listMessage", "Zamestnanec bol uložený.", true); byId("usersCard").scrollIntoView({ behavior: "smooth", block: "start" }); } catch (error) { setMessage("formMessage", error.message, false); } });
    byId("addEmployee").addEventListener("click", showCreateForm);
    byId("cancelCreate").addEventListener("click", () => byId("createModal").classList.add("hidden"));
    byId("editForm").addEventListener("submit", async (event) => { event.preventDefault(); try { await api("/admin-api/users/" + byId("editUserId").value, { method: "PATCH", body: JSON.stringify({ name: byId("editName").value, role: byId("editRole").value, department: byId("editDepartment").value || null, phoneNumber: byId("editPhoneNumber").value }) }); await loadUsers(); byId("editModal").classList.add("hidden"); setMessage("listMessage", "Údaje zamestnanca boli zmenené.", true); } catch (error) { setMessage("editMessage", error.message, false); } });
    byId("cancelEdit").addEventListener("click", () => byId("editModal").classList.add("hidden"));
    byId("signOut").addEventListener("click", () => { sessionStorage.removeItem(keyName); byId("dashboard").classList.add("hidden"); byId("lock").classList.remove("hidden"); byId("adminKey").value = ""; });
    if (key()) openDashboard();
  </script>
</body>
</html>`;
