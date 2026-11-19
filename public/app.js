const loginPanel = document.querySelector('#login-panel');
const adminPanel = document.querySelector('#admin-panel');
const countryList = document.querySelector('#country-list');
const countryCount = document.querySelector('#country-count');
const actionsHeading = document.querySelector('#actions-heading');
const countryIdInput = document.querySelector('#create-form [name="pais_id"]');
const notice = document.querySelector('#notice');
let isAdmin = false;
let noticeTimer;

function showNotice(message, isError = false) {
  window.clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.classList.toggle('error', isError);
  notice.hidden = false;
  noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 4500);
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.mensaje || `Error HTTP ${response.status}`);
  return data;
}

function setAdminMode(authenticated) {
  isAdmin = authenticated;
  loginPanel.hidden = authenticated;
  adminPanel.hidden = false;
  actionsHeading.hidden = false;
  document.querySelector('#logout-button').hidden = !authenticated;
}

function renderCountries(countries) {
  window.currentCountries = countries;
  countryCount.textContent = String(countries.length);
  if (countryIdInput && !countryIdInput.value) {
    const highestId = countries.reduce((highest, country) => Math.max(highest, Number(country.pais_id) || 0), 0);
    countryIdInput.value = String(highestId + 1);
  }
  if (countries.length === 0) {
    countryList.innerHTML = '<tr><td class="empty-state" colspan="3">Todavía no hay países registrados.</td></tr>';
    return;
  }

  countryList.replaceChildren(...countries.map((country) => {
    const row = document.createElement('tr');
    const idCell = document.createElement('td');
    idCell.className = 'id-value';
    idCell.textContent = country.pais_id;
    const nameCell = document.createElement('td');
    nameCell.className = 'name-value';
    nameCell.textContent = country.pais_descripcion || 'Sin descripción';
    row.append(idCell, nameCell);

    const actionsCell = document.createElement('td');
    const actions = document.createElement('div');
    actions.className = 'row-actions';

    const editButton = document.createElement('button');
    editButton.className = 'button button-edit';
    editButton.type = 'button';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => beginEdit(row, country));
    actions.append(editButton);

    if (isAdmin) {
      const deleteButton = document.createElement('button');
      deleteButton.className = 'button button-delete';
      deleteButton.type = 'button';
      deleteButton.textContent = 'Eliminar';
      deleteButton.addEventListener('click', () => deleteCountry(country));
      actions.append(deleteButton);
    }
    actionsCell.append(actions);
    row.append(actionsCell);
    return row;
  }));
}

async function loadCountries() {
  countryList.innerHTML = '<tr><td class="empty-state" colspan="3">Cargando países…</td></tr>';
  try {
    renderCountries(await request('/api/paises'));
  } catch (error) {
    countryList.innerHTML = '<tr><td class="empty-state" colspan="3"></td></tr>';
    countryList.querySelector('.empty-state').textContent = error.message;
    showNotice(error.message, true);
  }
}

function beginEdit(row, country) {
  const nameCell = row.children[1];
  const actions = row.children[2].firstElementChild;
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.maxLength = 50;
  input.value = country.pais_descripcion || '';
  input.setAttribute('aria-label', `Descripción del país ${country.pais_id}`);
  nameCell.replaceChildren(input);

  const save = document.createElement('button');
  save.className = 'button button-green';
  save.type = 'button';
  save.textContent = 'Guardar';
  save.addEventListener('click', async () => {
    save.disabled = true;
    try {
      await request(`/api/paises/${country.pais_id}`, {
        method: 'PUT',
        body: JSON.stringify({ pais_descripcion: input.value }),
      });
      showNotice('Nombre actualizado correctamente.');
      await loadCountries();
    } catch (error) {
      showNotice(error.message, true);
      save.disabled = false;
    }
  });

  const cancel = document.createElement('button');
  cancel.className = 'button button-light';
  cancel.type = 'button';
  cancel.textContent = 'Cancelar';
  cancel.addEventListener('click', () => renderCountries(window.currentCountries));
  actions.replaceChildren(save, cancel);
  input.focus();
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') save.click();
    if (event.key === 'Escape') cancel.click();
  });
}

async function deleteCountry(country) {
  if (!window.confirm(`¿Eliminar el país «${country.pais_descripcion || country.pais_id}»?`)) return;
  try {
    await request(`/api/paises/${country.pais_id}`, { method: 'DELETE' });
    showNotice('País eliminado correctamente.');
    await loadCountries();
  } catch (error) {
    showNotice(error.message, true);
  }
}

document.querySelector('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  button.disabled = true;
  try {
    const password = new FormData(form).get('password');
    await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
    form.reset();
    setAdminMode(true);
    showNotice('Sesión iniciada. Ya puedes gestionar los países.');
    await loadCountries();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  try {
    await request('/api/auth/logout', { method: 'POST' });
    setAdminMode(false);
    showNotice('Sesión cerrada. El catálogo queda en modo de consulta.');
    await loadCountries();
  } catch (error) {
    showNotice(error.message, true);
  }
});

document.querySelector('#create-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button');
  const values = new FormData(form);
  button.disabled = true;
  try {
    await request('/api/paises', {
      method: 'POST',
      body: JSON.stringify({
        pais_id: Number(values.get('pais_id')),
        pais_descripcion: values.get('pais_descripcion'),
      }),
    });
    form.reset();
    showNotice('País agregado correctamente.');
    await loadCountries();
  } catch (error) {
    showNotice(error.message, true);
  } finally {
    button.disabled = false;
  }
});

document.querySelector('#refresh-button').addEventListener('click', loadCountries);

async function initialize() {
  try {
    const session = await request('/api/auth/session');
    setAdminMode(session.autenticado);
  } catch (error) {
    showNotice(error.message, true);
    setAdminMode(false);
  }
  await loadCountries();
}

initialize();
