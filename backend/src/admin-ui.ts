export const adminStyles = String.raw`
  :root { color-scheme: light; font-family: "Segoe UI", Arial, sans-serif; color: #17212b; background: #f5f7fa; }
  * { box-sizing: border-box; } body { margin: 0; }
  header { background: #173a5e; color: white; padding: 28px 18px; }
  header div, main { max-width: 1360px; margin: auto; } h1 { margin: 0; font-size: clamp(24px, 4vw, 34px); }
  header p { margin: 7px 0 0; color: #d9e9f7; } main { padding: 22px 18px 48px; }
  .card { background: white; border: 1px solid #dbe3ea; border-radius: 14px; box-shadow: 0 2px 10px #173a5e12; padding: 20px; margin-bottom: 18px; }
  .employee-list { padding-top: 8px; padding-bottom: 8px; } .employee-list .message { min-height: 0; margin: 0; } .employee-list .message:not(:empty) { min-height: 21px; margin: 0 0 12px; }
  .hidden { display: none !important; } h2 { margin: 0 0 14px; font-size: 21px; } h3 { margin: 0; font-size: 18px; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 13px; } label { display: grid; gap: 6px; font-weight: 600; font-size: 14px; }
  input, select, button { font: inherit; } input, select { width: 100%; padding: 10px 11px; border: 1px solid #b8c6d2; border-radius: 8px; background: white; }
  button, .button { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 650; background: #1d6fa5; color: white; text-decoration: none; display: inline-block; }
  button:hover, .button:hover { background: #155882; } button.secondary, .button.secondary { background: #e9eff4; color: #243746; } button.secondary:hover, .button.secondary:hover { background: #d9e3ea; }
  #addEmployee, .user-card .button { width: 222px; }
  button.danger { background: #b33a3a; } button.danger:hover { background: #902c2c; } .actions { display: flex; gap: 10px; align-items: center; margin-top: 16px; flex-wrap: wrap; }
  .message { min-height: 21px; margin: 12px 0 0; color: #a12929; } .message.ok { color: #187341; }
  .user-card { display: grid; grid-template-columns: 250px repeat(4, minmax(115px, 150px)) minmax(160px, 1fr); gap: 12px; align-items: center; padding: 16px 0; border-top: 1px solid #e2e8ee; }
  .user-card:first-of-type { border-top: 0; } .detail { color: #425466; } .badge { display: inline-block; font-size: 12px; margin: 6px 4px 0 0; padding: 3px 7px; border-radius: 99px; background: #e6f3eb; color: #1e6a3b; }
  .user-card .button { display: inline-flex; justify-self: end; align-items: center; justify-content: center; text-align: center; }
  .badge.inactive { background: #f6e8e8; color: #963636; } .modal { position: fixed; inset: 0; z-index: 10; display: grid; place-items: center; overflow-y: auto; padding: 18px; background: #17212b99; } .modal .card { width: min(760px, 100%); margin: auto; }
  #lock { max-width: 480px; margin: 48px auto; } @media (max-width: 1000px) { .user-card { grid-template-columns: minmax(200px, 1fr) repeat(2, minmax(140px, .8fr)); } .user-card .button { grid-column: 1 / -1; justify-self: start; } } @media (max-width: 700px) { .grid, .user-card { grid-template-columns: 1fr; } .user-card .button { width: 100%; text-align: center; } }
`;

export const adminClientScript = String.raw`
  const departments = ["", "Nákup", "Marketing", "IT podpora", "Údržba a technika", "Sklad a logistika", "Financie a účtovníctvo", "Personalistika (HR)", "Obchod a zákaznícka podpora", "Vedenie firmy", "Ostatné"];
  const roles = { employee: "Zamestnanec", manager: "Vedúci", administrator: "Administrátor" };
  const keyName = "loius-admin-key"; const byId = (id) => document.getElementById(id);
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const departmentOptions = (selected) => departments.map((department) => '<option value="' + escapeHtml(department) + '"' + (department === selected ? ' selected' : '') + '>' + (department || 'Bez oddelenia') + '</option>').join("");
  const setMessage = (id, message, ok) => { const element = byId(id); element.textContent = message || ""; element.className = "message" + (ok ? " ok" : ""); };
  const key = () => sessionStorage.getItem(keyName) || "";
  async function api(path, options) { const response = await fetch(path, { ...options, headers: { "content-type": "application/json", "x-loius-admin-key": key(), ...(options && options.headers ? options.headers : {}) } }); const body = await response.json().catch(() => ({})); if (!response.ok) throw new Error(body.error || "Operáciu sa nepodarilo vykonať."); return body; }
`;
