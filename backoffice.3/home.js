const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
const token = localStorage.getItem("authToken");

if (!token) {
  window.location.href = "index.html";
}

let currentUser = null;
try {
  const rawUser = localStorage.getItem("user");
  currentUser = rawUser && rawUser !== "undefined" ? JSON.parse(rawUser) : null;
} catch {
  localStorage.removeItem("user");
}

function cerrarSesion() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  window.location.href = "index.html";
}

function escapeHTML(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function obtenerMensajeError(data, status, fallback) {
  if (data?.message) return data.message;
  if (data?.error) {
    return typeof data.error === "string"
      ? data.error
      : JSON.stringify(data.error);
  }
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((e) => e.msg || e.message || e).join(", ");
  }
  return `${fallback} (HTTP ${status})`;
}

// ==========================================
// Endpoints CRUD de Proyectos
// ==========================================

async function getProjectsByUser() {
  const authToken = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/projects`, {
    headers: { "auth-token": `${authToken}` }
  });

  if (res.status === 401 || res.status === 403) {
    cerrarSesion();
    return [];
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Detalle API (GET /projects):", res.status, data);
    throw new Error(obtenerMensajeError(data, res.status, "Error al obtener proyectos"));
  }

  return Array.isArray(data) ? data : data.projects || data.data || [];
}

async function getProjectById(id) {
  const authToken = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/projects/${id}`, {
    headers: { "auth-token": `${authToken}` }
  });

  if (res.status === 401 || res.status === 403) {
    cerrarSesion();
    return null;
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("Detalle API (GET /projects/:id):", res.status, data);
    throw new Error(obtenerMensajeError(data, res.status, "Proyecto no encontrado"));
  }

  return data;
}

async function createProject(project) {
  const authToken = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/projects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "auth-token": `${authToken}`
    },
    body: JSON.stringify(project)
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    cerrarSesion();
    return null;
  }

  if (!res.ok) {
    console.error("Detalle API (POST /projects):", res.status, data);
    throw new Error(obtenerMensajeError(data, res.status, "Error al crear proyecto"));
  }

  return data;
}

async function updateProject(projectId, updates) {
  const authToken = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "auth-token": `${authToken}`
    },
    body: JSON.stringify(updates)
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    cerrarSesion();
    return null;
  }

  if (!res.ok) {
    console.error("Detalle API (PUT /projects/:id):", res.status, data);
    throw new Error(obtenerMensajeError(data, res.status, "Error al actualizar"));
  }

  return data;
}

async function deleteProject(projectId) {
  const authToken = localStorage.getItem("authToken");
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: "DELETE",
    headers: { "auth-token": `${authToken}` }
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || res.status === 403) {
    cerrarSesion();
    return null;
  }

  if (!res.ok) {
    console.error("Detalle API (DELETE /projects/:id):", res.status, data);
    throw new Error(obtenerMensajeError(data, res.status, "Error al eliminar"));
  }

  return data;
}

// ==========================================
// Elementos del DOM y lógica de interfaz
// ==========================================

const userGreeting = document.getElementById("userGreeting");
const logoutBtn = document.getElementById("logoutBtn");
const projectsGrid = document.getElementById("projectsGrid");
const homeMessage = document.getElementById("homeMessage");

const modal = document.getElementById("projectModal");
const modalTitle = document.getElementById("modalTitle");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const projectForm = document.getElementById("projectForm");

const detailModal = document.getElementById("detailModal");
const detailContent = document.getElementById("detailContent");
const closeDetailModalBtn = document.getElementById("closeDetailModalBtn");

let modalError = document.getElementById("modalError");
if (!modalError && projectForm) {
  modalError = document.createElement("p");
  modalError.id = "modalError";
  modalError.className = "mensaje error hidden";
  projectForm.prepend(modalError);
}

function mostrarErrorModal(texto) {
  if (!modalError) return;
  modalError.textContent = texto;
  modalError.classList.remove("hidden");
}

function limpiarErrorModal() {
  if (!modalError) return;
  modalError.textContent = "";
  modalError.classList.add("hidden");
}

if (userGreeting && currentUser) {
  userGreeting.textContent = currentUser.name || currentUser.email || "";
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", cerrarSesion);
}

let proyectos = [];
let editingProjectId = null;

function mostrarMensajeHome(texto, esError = false) {
  if (!homeMessage) return;
  homeMessage.textContent = texto;
  homeMessage.className = `mensaje ${esError ? "error" : "exito"}`;
  setTimeout(() => {
    homeMessage.className = "mensaje hidden";
  }, 4000);
}

async function cargarProyectos() {
  projectsGrid.innerHTML = `<p class="estado-lista">Cargando proyectos...</p>`;
  try {
    proyectos = await getProjectsByUser();
    renderizarProyectos();
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
    projectsGrid.innerHTML = `<p class="estado-lista">No se pudieron cargar los proyectos.</p>`;
    mostrarMensajeHome(error.message || "Error al conectar con la API.", true);
  }
}

function renderizarProyectos() {
  projectsGrid.innerHTML = "";

  if (!proyectos.length) {
    projectsGrid.innerHTML = `<p class="estado-lista">Aún no tienes proyectos registrados. ¡Agrega el primero!</p>`;
    return;
  }

  proyectos.forEach((proyecto) => {
    const projectId = proyecto._id || proyecto.id;
    const card = document.createElement("article");
    card.className = "ejemplo-card";

    const tecnologias = Array.isArray(proyecto.technologies)
      ? proyecto.technologies.join(" / ")
      : proyecto.technologies || "";

    const imagenUrl =
      Array.isArray(proyecto.images) && proyecto.images.length > 0
        ? proyecto.images[0]
        : "";

    const imagenHTML = imagenUrl
      ? `<img class="proyecto-img" src="${escapeHTML(imagenUrl)}" alt="${escapeHTML(proyecto.title)}" onerror="this.style.display='none'">`
      : "";

    const repoLink = proyecto.repository
      ? `<a class="repo-link" href="${escapeHTML(proyecto.repository)}" target="_blank" rel="noopener noreferrer">Ver repositorio</a>`
      : "";

    card.innerHTML = `
      ${imagenHTML}
      <h3>${escapeHTML(proyecto.title)}</h3>
      <p class="ejemplo">${escapeHTML(proyecto.description)}</p>
      ${tecnologias ? `<span class="ejemplo">${escapeHTML(tecnologias)}</span>` : ""}
      ${repoLink}
      <div class="ejemplo-actions">
        <button class="ejemplo btn-view" data-id="${escapeHTML(projectId)}">Ver</button>
        <button class="ejemplo btn-edit" data-id="${escapeHTML(projectId)}">Actualizar</button>
        <button class="ejemplo btn-delete" data-id="${escapeHTML(projectId)}">Eliminar</button>
      </div>
    `;

    projectsGrid.appendChild(card);
  });
}

openModalBtn.addEventListener("click", () => {
  editingProjectId = null;
  modalTitle.textContent = "Agregar Proyecto";
  projectForm.reset();
  limpiarErrorModal();
  modal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  limpiarErrorModal();
  modal.classList.add("hidden");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    limpiarErrorModal();
    modal.classList.add("hidden");
  }
});

if (closeDetailModalBtn && detailModal) {
  closeDetailModalBtn.addEventListener("click", () => {
    detailModal.classList.add("hidden");
  });

  detailModal.addEventListener("click", (e) => {
    if (e.target === detailModal) {
      detailModal.classList.add("hidden");
    }
  });
}

projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  limpiarErrorModal();

  const title = document.getElementById("projectTitle").value.trim();
  const description = document.getElementById("projectDesc").value.trim();
  const technologies = document
    .getElementById("projectTech")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const repository = document.getElementById("projectRepo").value.trim();
  const images = document
    .getElementById("projectImages")
    .value.split(",")
    .map((url) => url.trim())
    .filter(Boolean);

  const projectData = {
    title,
    description,
    technologies,
    images
  };

  if (repository) {
    projectData.repository = repository;
  }

  const submitBtn = projectForm.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "Guardando...";
  }

  try {
    if (editingProjectId) {
      await updateProject(editingProjectId, projectData);
      mostrarMensajeHome("Proyecto actualizado con éxito.");
    } else {
      await createProject(projectData);
      mostrarMensajeHome("Proyecto creado con éxito.");
    }

    modal.classList.add("hidden");
    editingProjectId = null;
    projectForm.reset();
    await cargarProyectos();
  } catch (error) {
    console.error("Error al guardar proyecto:", error);
    mostrarErrorModal(`Error al guardar el proyecto: ${error.message}`);
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar";
    }
  }
});

projectsGrid.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("btn-view") && detailModal && detailContent) {
    try {
      const proyecto = await getProjectById(id);
      if (!proyecto) return;

      const tecnologias = Array.isArray(proyecto.technologies)
        ? proyecto.technologies.join(", ")
        : proyecto.technologies || "No especificadas";

      const imagenUrl =
        Array.isArray(proyecto.images) && proyecto.images.length > 0
          ? proyecto.images[0]
          : "";

      detailContent.innerHTML = `
        ${imagenUrl ? `<img class="detalle-imagen" src="${escapeHTML(imagenUrl)}" alt="${escapeHTML(proyecto.title)}" onerror="this.style.display='none'">` : ""}
        <h3>${escapeHTML(proyecto.title)}</h3>
        <p class="detalle-descripcion">${escapeHTML(proyecto.description)}</p>
        <p class="detalle-meta"><strong>Tecnologías:</strong> ${escapeHTML(tecnologias)}</p>
        ${
          proyecto.repository
            ? `<p class="detalle-meta"><strong>Repositorio:</strong> <a class="repo-link" href="${escapeHTML(proyecto.repository)}" target="_blank" rel="noopener noreferrer">${escapeHTML(proyecto.repository)}</a></p>`
            : ""
        }
      `;
      detailModal.classList.remove("hidden");
    } catch (error) {
      console.error("Error al obtener proyecto:", error);
      mostrarMensajeHome(error.message || "No se pudo cargar el detalle.", true);
    }
  }

  if (e.target.classList.contains("btn-edit")) {
    try {
      const proyecto =
        (await getProjectById(id).catch(() => null)) ||
        proyectos.find((p) => (p._id || p.id) === id);

      if (!proyecto) return;

      editingProjectId = id;
      modalTitle.textContent = "Actualizar Proyecto";
      limpiarErrorModal();

      document.getElementById("projectTitle").value = proyecto.title || "";
      document.getElementById("projectDesc").value = proyecto.description || "";
      document.getElementById("projectTech").value = Array.isArray(proyecto.technologies)
        ? proyecto.technologies.join(", ")
        : "";
      document.getElementById("projectRepo").value = proyecto.repository || "";
      document.getElementById("projectImages").value = Array.isArray(proyecto.images)
        ? proyecto.images.join(", ")
        : "";

      modal.classList.remove("hidden");
    } catch (error) {
      console.error("Error al preparar edición:", error);
      mostrarMensajeHome("No se pudo cargar el proyecto para editar.", true);
    }
  }

  if (e.target.classList.contains("btn-delete")) {
    const confirmar = confirm("¿Seguro que deseas eliminar este proyecto?");
    if (!confirmar) return;

    try {
      await deleteProject(id);
      mostrarMensajeHome("Proyecto eliminado correctamente.");
      await cargarProyectos();
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      mostrarMensajeHome(error.message || "Error al eliminar el proyecto.", true);
    }
  }
});

cargarProyectos();