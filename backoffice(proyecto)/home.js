const API_BASE = "[https://portfolio-api-three-black.vercel.app/api/v1](https://portfolio-api-three-black.vercel.app/api/v1)";
const token = localStorage.getItem("authToken");

if (!token) {
  window.location.href = "Login.html";
}

let currentUser = null;
try {
  const rawUser = localStorage.getItem("user");
  currentUser = rawUser && rawUser !== "undefined" ? JSON.parse(rawUser) : null;
} catch (error) {
  localStorage.removeItem("user");
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  window.location.href = "Login.html";
});

const projectsGrid = document.getElementById("projectsGrid");
const modal = document.getElementById("projectModal");
const modalTitle = document.getElementById("modalTitle");
const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const projectForm = document.getElementById("projectForm");

modal.classList.add("hidden");

let proyectos = [];
let editingProjectId = null;

async function cargarProyectos() {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: { "auth-token": token }
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = "Login.html";
      return;
    }

    if (!res.ok) throw new Error("Error al obtener proyectos");

    proyectos = await res.json();
    renderizarProyectos();
  } catch (error) {
    console.error("Error al cargar proyectos:", error);
    projectsGrid.innerHTML = `<p>No se pudieron cargar los proyectos.</p>`;
  }
}

function renderizarProyectos() {
  projectsGrid.innerHTML = "";

  if (!proyectos.length) {
    projectsGrid.innerHTML = `<p>Aún no tienes proyectos registrados. ¡Agrega el primero!</p>`;
    return;
  }

  proyectos.forEach((proyecto) => {
    const card = document.createElement("article");
    card.className = "ejemplo-card";

    const tecnologias = Array.isArray(proyecto.technologies)
      ? proyecto.technologies.join(" / ")
      : proyecto.technologies || "";

    const repoLink = proyecto.repository
      ? `<a class="repo-link" href="${proyecto.repository}" target="_blank" rel="noopener noreferrer">Ver repositorio</a>`
      : "";

    card.innerHTML = `
      <h3>${proyecto.title}</h3>
      <p class="ejemplo">${proyecto.description}</p>
      ${tecnologias ? `<span class="ejemplo">${tecnologias}</span>` : ""}
      ${repoLink}
      <div class="ejemplo-actions">
        <button class="ejemplo btn-edit" data-id="${proyecto._id}">Actualizar</button>
        <button class="ejemplo btn-delete" data-id="${proyecto._id}">Eliminar</button>
      </div>
    `;

    projectsGrid.appendChild(card);
  });
}

openModalBtn.addEventListener("click", () => {
  editingProjectId = null;
  modalTitle.textContent = "Agregar Proyecto";
  projectForm.reset();
  modal.classList.remove("hidden");
});

closeModalBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.add("hidden");
  }
});

projectForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("projectTitle").value.trim();
  const description = document.getElementById("projectDesc").value.trim();
  const technologies = document
    .getElementById("projectTech")
    .value.split(",")
    .map((t) => t.trim())
    .filter((t) => t !== "");
  const repository = document.getElementById("projectRepo").value.trim();
  const imageUrl = document.getElementById("projectImages").value.trim();

  const projectData = {
    title,
    description,
    technologies,
    images: imageUrl ? [imageUrl] : []
  };

  if (repository) {
    projectData.repository = repository;
  }

  if (currentUser && (currentUser.id || currentUser._id)) {
    projectData.userId = currentUser.id || currentUser._id;
  }

  const url = editingProjectId
    ? `${API_BASE}/projects/${editingProjectId}`
    : `${API_BASE}/projects`;

  const method = editingProjectId ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "auth-token": token
      },
      body: JSON.stringify(projectData)
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || "Error al guardar el proyecto.");
      return;
    }

    modal.classList.add("hidden");
    editingProjectId = null;
    projectForm.reset();
    cargarProyectos();
  } catch (error) {
    console.error("Error al guardar proyecto:", error);
    alert("No se pudo conectar con la API.");
  }
});

projectsGrid.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  if (!id) return;

  if (e.target.classList.contains("btn-edit")) {
    const proyecto = proyectos.find((p) => p._id === id);
    if (!proyecto) return;

    editingProjectId = id;
    modalTitle.textContent = "Actualizar Proyecto";

    document.getElementById("projectTitle").value = proyecto.title || "";
    document.getElementById("projectDesc").value = proyecto.description || "";
    document.getElementById("projectTech").value = Array.isArray(proyecto.technologies)
      ? proyecto.technologies.join(", ")
      : "";
    document.getElementById("projectRepo").value = proyecto.repository || "";
    document.getElementById("projectImages").value =
      Array.isArray(proyecto.images) && proyecto.images.length > 0
        ? proyecto.images[0]
        : "";

    modal.classList.remove("hidden");
  }

  if (e.target.classList.contains("btn-delete")) {
    const confirmar = confirm("¿Seguro que deseas eliminar este proyecto?");
    if (!confirmar) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${id}`, {
        method: "DELETE",
        headers: { "auth-token": token }
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || "Error al eliminar el proyecto.");
        return;
      }

      cargarProyectos();
    } catch (error) {
      console.error("Error al eliminar proyecto:", error);
      alert("No se pudo conectar con la API.");
    }
  }
});
cargarProyectos();