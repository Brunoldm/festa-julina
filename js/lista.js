// ── lista.js ──────────────────────────────────────────────────────
// Lógica da lista de comes e bebes
// Firebase Firestore · Modo Admin · Modal de novo item
// ──────────────────────────────────────────────────────────────────

import { db } from "./firebase.js";

import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ── Admin: detecta ?admin=true na URL ─────────────────────────────
const isAdmin = new URLSearchParams(window.location.search).get("admin") === "true";

if (isAdmin) {
  document.getElementById("admin-badge").classList.remove("hidden");
}

// ── Referências DOM ───────────────────────────────────────────────
const listaEl   = document.getElementById("lista-itens");
const loadingEl = document.getElementById("loading");

// ── Renderiza os itens vindos do Firestore ────────────────────────
function renderizar(itens) {
  // Esconde loading, mostra lista
  loadingEl.classList.add("hidden");
  listaEl.classList.remove("hidden");

  listaEl.innerHTML = "";

  if (itens.length === 0) {
    listaEl.innerHTML = `
      <p style="text-align:center; color:var(--terracota); opacity:0.5; padding:40px 0;">
        Nenhum item cadastrado ainda.
      </p>`;
    return;
  }

  itens.forEach((item) => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.id = `card-${item.id}`;

    // ── Cabeçalho do card (emoji + nome + botão admin) ──
    const header = document.createElement("div");
    header.className = "item-header";
    header.innerHTML = `
      <span class="item-emoji">${item.emoji || "🎉"}</span>
      <h3 class="item-nome">${escapeHtml(item.nome)}</h3>
      ${isAdmin ? `
        <button class="btn-admin" onclick="adminAcao('${item.id}', ${!!item.responsavel})">
          ${item.responsavel ? "↩ Liberar" : "🗑 Deletar"}
        </button>` : ""}
    `;
    card.appendChild(header);

    // ── Corpo do card (reservado ou disponível) ──
    const corpo = document.createElement("div");

    if (item.responsavel && item.responsavel !== "") {
      // Já reservado
      corpo.innerHTML = `
        <div class="tag-confirmado">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="7" fill="#F5A623" opacity="0.25"/>
            <path d="M4 7l2 2 4-4" stroke="#C45A00" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          Quem vai levar: <strong>${escapeHtml(item.responsavel)}</strong>
        </div>
      `;
    } else {
      // Disponível para reserva
      corpo.innerHTML = `
        <div class="item-acao">
          <input
            type="text"
            id="input-${item.id}"
            class="item-input"
            placeholder="Digite seu nome para reservar..."
            onkeydown="if(event.key==='Enter') reservarItem('${item.id}')"
          />
          <button class="btn-reservar" onclick="reservarItem('${item.id}')">
            Confirmar
          </button>
        </div>
        <p id="erro-${item.id}" class="item-erro hidden">
          Digite seu nome antes de confirmar.
        </p>
      `;
    }

    card.appendChild(corpo);
    listaEl.appendChild(card);
  });
}

// ── Reservar item (salva responsável no Firestore) ────────────────
window.reservarItem = async function (id) {
  const input = document.getElementById(`input-${id}`);
  const nome  = input.value.trim();

  if (!nome) {
    document.getElementById(`erro-${id}`).classList.remove("hidden");
    input.focus();
    return;
  }

  // Bloqueia input e botão imediatamente (feedback visual)
  input.disabled = true;
  input.nextElementSibling.disabled = true;

  try {
    await updateDoc(doc(db, "itens", id), { responsavel: nome });
  } catch (e) {
    console.error("Erro ao reservar:", e);
    input.disabled = false;
    input.nextElementSibling.disabled = false;
  }
};

// ── Admin: libera responsável ou deleta item ──────────────────────
window.adminAcao = async function (id, temResponsavel) {
  try {
    if (temResponsavel) {
      // Libera o campo (remove responsável)
      await updateDoc(doc(db, "itens", id), { responsavel: "" });
    } else {
      // Deleta o documento
      await deleteDoc(doc(db, "itens", id));
    }
  } catch (e) {
    console.error("Erro na ação admin:", e);
  }
};

// ── Modal: abrir / fechar ─────────────────────────────────────────
window.abrirModal = function () {
  document.getElementById("modal").classList.remove("hidden");
  document.getElementById("modal-item").value   = "";
  document.getElementById("modal-pessoa").value = "";
  document.getElementById("modal-erro").classList.add("hidden");
  setTimeout(() => document.getElementById("modal-item").focus(), 80);
};

window.fecharModal = function () {
  document.getElementById("modal").classList.add("hidden");
};

window.fecharModalOverlay = function (e) {
  if (e.target === document.getElementById("modal")) fecharModal();
};

// Fecha modal com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") fecharModal();
});

// ── Modal: adicionar novo item ao Firestore ───────────────────────
const EMOJIS_CUSTOM = ["🎉","🍽️","🧃","🍰","🫙","🥘","🎊","🫕","🍖"];

window.adicionarItem = async function () {
  const nomeItem   = document.getElementById("modal-item").value.trim();
  const nomePessoa = document.getElementById("modal-pessoa").value.trim();

  if (!nomeItem || !nomePessoa) {
    document.getElementById("modal-erro").classList.remove("hidden");
    return;
  }

  const emoji = EMOJIS_CUSTOM[Math.floor(Math.random() * EMOJIS_CUSTOM.length)];

  try {
    // Adiciona documento novo ao Firestore — já entra confirmado
    await addDoc(collection(db, "itens"), {
      nome:        nomeItem,
      emoji:       emoji,
      responsavel: nomePessoa, // já reservado por quem criou
    });
    fecharModal();
  } catch (e) {
    console.error("Erro ao adicionar item:", e);
  }
};

// ── Listener em tempo real (onSnapshot) ──────────────────────────
// Atualiza a tela automaticamente sempre que o Firestore mudar
onSnapshot(collection(db, "itens"), (snapshot) => {
  const itens = [];
  snapshot.forEach((docItem) => {
    itens.push({ id: docItem.id, ...docItem.data() });
  });
  // Ordena: disponíveis primeiro, depois reservados
  itens.sort((a, b) => {
    const aRes = a.responsavel && a.responsavel !== "";
    const bRes = b.responsavel && b.responsavel !== "";
    return aRes - bRes;
  });
  renderizar(itens);
});

// ── Utilitário: escapa HTML pra evitar XSS ────────────────────────
function escapeHtml(text) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(text || ""));
  return div.innerHTML;
}
