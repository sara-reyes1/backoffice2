const API_BASE = "https://portfolio-api-three-black.vercel.app/api/v1";
const formulario = document.querySelector(".formulario");

let mensaje = document.getElementById("mensaje");
if (!mensaje && formulario) {
  mensaje = document.createElement("p");
  mensaje.id = "mensaje";
  mensaje.className = "mensaje";
  formulario.appendChild(mensaje);
}

function mostrarMensaje(texto, esError = true) {
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = esError ? "mensaje error" : "mensaje exito";
}

if (formulario) {
  const enlaceBoton = formulario.querySelector(".boton a");
  if (enlaceBoton) {
    enlaceBoton.addEventListener("click", (e) => {
      e.preventDefault();
      formulario.requestSubmit();
    });
  }

  const emailInput = document.getElementById("email");
  const isRegister = Boolean(emailInput);

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (isRegister) {
      const itsonInput = document.getElementById("itsonId");
      const user = {
        name: document.getElementById("username").value.trim(),
        email: emailInput.value.trim(),
        itsonId: itsonInput ? itsonInput.value.trim() : "000000",
        password: document.getElementById("password").value
      };

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user)
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarMensaje(data.message || "Error al registrar. Vuelve a intentarlo.");
          return;
        }

        mostrarMensaje("Usuario registrado con éxito", false);
        setTimeout(() => {
          window.location.href = "Login.html";
        }, 1500);
      } catch (error) {
        mostrarMensaje("No se puede conectar con la API.");
        console.error(error);
      }
    } else {
      const credentials = {
        email: document.getElementById("username").value.trim(),
        password: document.getElementById("password").value
      };

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials)
        });

        const data = await res.json();

        if (!res.ok) {
          mostrarMensaje(data.message || "Correo o contraseña incorrectos.");
          return;
        }

        localStorage.setItem("authToken", data.token);
        const userData = data.user || data.userPublicData || { email: credentials.email };
        localStorage.setItem("user", JSON.stringify(userData));

        window.location.href = "Home.html";
      } catch (error) {
        mostrarMensaje("No se pudo conectar con la API.");
        console.error(error);
      }
    }
  });
}