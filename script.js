"use strict";

const $ = (id) => document.getElementById(id);
const screens = ["modeScreen", "setupScreen", "themeScreen", "handoffScreen", "secretScreen", "gameScreen", "voteScreen", "resultScreen"];
const themes = [
  "無人島に持っていきたいもの",
  "給食でうれしいメニュー",
  "休日にしたいこと",
  "人生で大切だと思うもの",
  "旅行に持っていきたいもの",
  "もらってうれしいプレゼント",
  "学校にあったらうれしいもの",
  "テンションが上がる瞬間",
  "友達におすすめしたい趣味",
  "大人になったら挑戦したいこと",
  "強そうな動物",
  "住んでみたい場所",
  "人気がありそうな職業",
  "楽しいと思う学校行事",
  "給食に出てほしいデザート",
  "授業中に起きたらうれしいこと",
  "クラスにあると便利なもの",
  "修学旅行で行きたい場所",
  "一日だけなってみたい人物",
  "使ってみたい超能力",
  "生まれ変わったらなりたい動物",
  "友達と一緒にやりたいこと",
  "雨の日にしたいこと",
  "夏休みに挑戦したいこと",
  "元気が出る食べ物",
  "怖いと思うもの",
  "世界からなくなったら困るもの",
  "100万円あったら買いたいもの",
  "学校の近くにできてほしい施設",
  "一度は体験してみたいこと"
];

const state = { mode: null, theme: "", players: [], currentPlayer: 0, selectedVoteId: null };

function showScreen(id, progressText = "") {
  screens.forEach((screenId) => $(screenId).classList.toggle("hidden", screenId !== id));
  $("progress").textContent = progressText;
  $("progress").classList.toggle("hidden", !progressText);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function modeLabel() { return state.mode === "wolf" ? "🐺 人狼モード" : "🎯 ノーマルモード"; }
function randomTheme() { return themes[Math.floor(Math.random() * themes.length)]; }

document.querySelectorAll(".mode-card").forEach((button) => {
  button.addEventListener("click", () => selectMode(button.dataset.mode));
});

function selectMode(mode) {
  state.mode = mode;
  $("selectedModeBadge").textContent = modeLabel();
  $("selectedModeBadge").classList.toggle("wolf-badge", mode === "wolf");
  $("playerLimitHelp").textContent = mode === "wolf" ? "人狼モードは3〜8人で遊べます。" : "ノーマルモードは2〜8人で遊べます。";
  $("numPlayers").min = mode === "wolf" ? "3" : "2";
  if (mode === "wolf" && Number($("numPlayers").value) < 3) $("numPlayers").value = "3";
  createNameInputs();
  showScreen("setupScreen", "準備 1 / 4");
}

$("modeRuleText").innerHTML = `
  <h3>ノーマルモード</h3><ol><li>各自が1〜100の数字を秘密で確認します。</li><li>数字を言わず、テーマに合う答えを発表します。</li><li>答えを手がかりに、数字が大きい順へ並べます。</li></ol>
  <h3>人狼モード</h3><ol><li>全員が1〜100の数字を確認し、1人だけ人狼になります。</li><li>市民は正しい順番を、人狼は正体を隠して並べ替えの失敗を狙います。</li><li>並べ替え後、人狼だと思う1人へ投票します。</li><li>正しく並べられれば市民の勝ち。失敗しても人狼を当てれば市民の逆転勝ちです。</li></ol>`;

function clampPlayerCount() {
  const min = state.mode === "wolf" ? 3 : 2;
  const value = Math.min(8, Math.max(min, Number($("numPlayers").value) || min));
  $("numPlayers").value = String(value);
  return value;
}

function createNameInputs() {
  const oldNames = [...document.querySelectorAll(".player-name-input")].map((input) => input.value);
  const count = clampPlayerCount();
  $("nameInputs").replaceChildren();
  for (let i = 0; i < count; i += 1) {
    const input = document.createElement("input");
    input.type = "text";
    input.maxLength = 16;
    input.autocomplete = "off";
    input.className = "player-name-input";
    input.placeholder = `プレイヤー${i + 1}`;
    input.value = oldNames[i] ?? `プレイヤー${i + 1}`;
    input.setAttribute("aria-label", `プレイヤー${i + 1}の名前`);
    $("nameInputs").append(input);
  }
}

$("numPlayers").addEventListener("change", createNameInputs);
$("decreasePlayers").addEventListener("click", () => { $("numPlayers").value = Number($("numPlayers").value) - 1; createNameInputs(); });
$("increasePlayers").addEventListener("click", () => { $("numPlayers").value = Number($("numPlayers").value) + 1; createNameInputs(); });
$("randomThemeBtn").addEventListener("click", () => { $("themeInput").value = randomTheme(); });

$("startBtn").addEventListener("click", () => {
  const inputs = [...document.querySelectorAll(".player-name-input")];
  const names = inputs.map((input, index) => input.value.trim() || `プレイヤー${index + 1}`);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) { $("setupError").textContent = `「${duplicate}」が重複しています。別の名前にしてください。`; return; }
  $("setupError").textContent = "";
  state.theme = $("themeInput").value.trim() || randomTheme();
  const wolfIndex = state.mode === "wolf" ? Math.floor(Math.random() * names.length) : -1;
  const numbers = generateUniqueNumbers(names.length);
  state.players = names.map((name, index) => ({ id: `p${index}`, name, number: numbers[index], isWolf: index === wolfIndex }));
  state.currentPlayer = 0;
  state.selectedVoteId = null;
  $("themeDisplay").textContent = state.theme;
  $("wolfThemeNotice").classList.toggle("hidden", state.mode !== "wolf");
  showScreen("themeScreen", "テーマ 2 / 4");
});

$("toPlayerBtn").addEventListener("click", () => showHandoff());
function generateUniqueNumbers(count) {
  const numbers = new Set();
  while (numbers.size < count) numbers.add(Math.floor(Math.random() * 100) + 1);
  return [...numbers];
}

function showHandoff() {
  const player = state.players[state.currentPlayer];
  $("handoffCount").textContent = `${state.currentPlayer + 1} / ${state.players.length}人目`;
  $("handoffTitle").textContent = `${player.name}さんに渡してください`;
  showScreen("handoffScreen", "個人カード 3 / 4");
}

$("readyBtn").addEventListener("click", () => {
  const player = state.players[state.currentPlayer];
  $("secretPlayerName").textContent = `${player.name}さんのカード`;
  $("numberCard").classList.toggle("is-wolf", player.isWolf);
  if (player.isWolf) {
    $("numberCard").innerHTML = `<span>🐺 人狼</span><strong>${player.number}</strong>`;
    $("secretHint").textContent = "数字を言わずに回答し、怪しまれないよう並べ替えの失敗を狙いましょう。";
  } else {
    $("numberCard").textContent = String(player.number);
    $("secretHint").textContent = state.mode === "wolf" ? "あなたは市民です。正しい並び順を目指し、人狼の妨害にも注意しましょう。" : "この数字を言わずに、テーマに合う答えを考えましょう。";
  }
  showScreen("secretScreen", "個人カード 3 / 4");
});

$("hideAndNextBtn").addEventListener("click", () => {
  state.currentPlayer += 1;
  if (state.currentPlayer < state.players.length) showHandoff();
  else startGame();
});

function startGame() {
  $("gameModeBadge").textContent = modeLabel();
  $("gameModeBadge").classList.toggle("wolf-badge", state.mode === "wolf");
  $("gameTheme").textContent = `テーマ：${state.theme}`;
  $("toVoteBtn").classList.toggle("hidden", state.mode !== "wolf");
  $("submitOrderBtn").classList.toggle("hidden", state.mode === "wolf");
  renderOrder(state.players.map((player) => player.id));
  showScreen("gameScreen", "相談・並び替え 4 / 4");
}

function renderOrder(ids) {
  $("sortable").replaceChildren();
  ids.forEach((id, index) => {
    const player = state.players.find((item) => item.id === id);
    const row = document.createElement("li");
    row.className = "player-row";
    row.draggable = true;
    row.dataset.id = id;
    const name = document.createElement("span"); name.textContent = player.name;
    const up = moveButton("▲", "上へ移動", index === 0, () => moveRow(index, -1));
    const down = moveButton("▼", "下へ移動", index === ids.length - 1, () => moveRow(index, 1));
    row.append(name, up, down);
    row.addEventListener("dragstart", () => row.classList.add("dragging"));
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      renderOrder(currentOrder());
    });
    row.addEventListener("dragover", (event) => {
      event.preventDefault();
      const dragged = $("sortable").querySelector(".dragging");
      if (dragged && dragged !== row) {
        const rect = row.getBoundingClientRect();
        $("sortable").insertBefore(dragged, event.clientY < rect.top + rect.height / 2 ? row : row.nextSibling);
      }
    });
    $("sortable").append(row);
  });
}

function moveButton(text, label, disabled, handler) {
  const button = document.createElement("button");
  button.type = "button"; button.textContent = text; button.className = "move-button";
  button.setAttribute("aria-label", label); button.disabled = disabled; button.addEventListener("click", handler);
  return button;
}
function currentOrder() { return [...$("sortable").children].map((row) => row.dataset.id); }
function moveRow(index, direction) {
  const ids = currentOrder();
  [ids[index], ids[index + direction]] = [ids[index + direction], ids[index]];
  renderOrder(ids);
}

$("submitOrderBtn").addEventListener("click", showResults);
$("toVoteBtn").addEventListener("click", () => {
  $("voteChoices").replaceChildren();
  state.players.forEach((player) => {
    const button = document.createElement("button");
    button.type = "button"; button.className = "vote-choice"; button.textContent = player.name;
    button.addEventListener("click", () => {
      state.selectedVoteId = player.id;
      document.querySelectorAll(".vote-choice").forEach((choice) => choice.classList.remove("selected"));
      button.classList.add("selected"); $("submitVoteBtn").disabled = false;
    });
    $("voteChoices").append(button);
  });
  showScreen("voteScreen", "人狼投票");
});
$("submitVoteBtn").addEventListener("click", showResults);

function showResults() {
  const guessedIds = currentOrder();
  const correct = [...state.players].sort((a, b) => b.number - a.number);
  const exactCount = guessedIds.filter((id, index) => id === correct[index].id).length;
  const allCorrect = exactCount === state.players.length;
  $("scoreSummary").innerHTML = `${allCorrect ? "✅ カード並べ成功" : "❌ カード並べ失敗"}<br>同じ位置だった人は <strong>${exactCount} / ${state.players.length}人</strong>`;
  $("guessedList").replaceChildren(); $("correctList").replaceChildren();
  guessedIds.forEach((id) => appendResultItem($("guessedList"), state.players.find((player) => player.id === id).name));
  correct.forEach((player) => appendResultItem($("correctList"), `${player.name}：${player.number}${player.isWolf ? "（人狼）" : ""}`));
  if (state.mode === "wolf") {
    const wolf = state.players.find((player) => player.isWolf);
    const voted = state.players.find((player) => player.id === state.selectedVoteId);
    const caught = wolf.id === state.selectedVoteId;
    const citizenWin = allCorrect || caught;
    $("resultHeadline").textContent = citizenWin ? "🏘️ 市民チームの勝利！" : "🐺 人狼の勝利！";
    $("wolfResult").classList.remove("hidden");
    $("wolfResult").innerHTML = `${allCorrect ? "✅ 並べ替え成功：市民の勝利条件達成" : "❌ 並べ替え失敗：人狼の妨害成功"}<br>${caught ? "✅ 人狼を見破った：市民の勝利条件達成" : "❌ 人狼を見破れなかった"}<br><b>人狼：${escapeHtml(wolf.name)}</b> ／ 投票：${escapeHtml(voted.name)}`;
  } else {
    $("resultHeadline").textContent = allCorrect ? "🎉 完全一致！" : "結果を見比べよう";
    $("wolfResult").classList.add("hidden");
  }
  showScreen("resultScreen");
}

function appendResultItem(list, text) { const item = document.createElement("li"); item.textContent = text; list.append(item); }
function escapeHtml(text) { const div = document.createElement("div"); div.textContent = text; return div.innerHTML; }

$("sameSettingsBtn").addEventListener("click", () => {
  $("themeInput").value = "";
  selectMode(state.mode);
});
document.querySelectorAll(".back-to-mode").forEach((button) => button.addEventListener("click", resetToMode));
document.querySelectorAll(".restart-button").forEach((button) => button.addEventListener("click", () => $("confirmDialog").classList.remove("hidden")));
$("cancelRestartBtn").addEventListener("click", () => $("confirmDialog").classList.add("hidden"));
$("confirmRestartBtn").addEventListener("click", () => { $("confirmDialog").classList.add("hidden"); resetToMode(); });

function resetToMode() {
  state.mode = null; state.theme = ""; state.players = []; state.currentPlayer = 0; state.selectedVoteId = null;
  $("themeInput").value = ""; $("setupError").textContent = ""; $("submitVoteBtn").disabled = true;
  showScreen("modeScreen");
}
