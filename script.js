"use strict";

const PASSCODE = "GIFTSGIVENINWAITING";

/* ---------- DOM ---------- */
const intro = document.getElementById("intro");
const title = document.getElementById("title");
const game  = document.getElementById("game");

const startBtn = document.getElementById("startBtn");
const playBtn  = document.getElementById("playBtn");

const newBtn   = document.getElementById("newBtn");
const resetBtn = document.getElementById("resetBtn");

const boardEl  = document.getElementById("board");
const statusEl = document.getElementById("status");

const eraseBtn = document.getElementById("eraseBtn");
const padBtns  = Array.from(document.querySelectorAll(".padBtn[data-n]"));

const winModal = document.getElementById("winModal");
const copyBtn  = document.getElementById("copyBtn");
const backTitleBtn = document.getElementById("backTitleBtn");
const playAgainBtn = document.getElementById("playAgainBtn");
const copyMsg  = document.getElementById("copyMsg");

/* ---------- STATE ---------- */
let solution = Array(81).fill(0);
let puzzleStart = Array(81).fill(0);
let grid = Array(81).fill(0);
let fixed = Array(81).fill(false);
let selected = -1;

/* ---------- SCREEN HELPERS ---------- */
function showScreen(s){
  hideWin();
  [intro, title, game].forEach(x => x.classList.remove("active"));
  s.classList.add("active");
}

function setStatus(msg, kind=""){
  statusEl.textContent = msg;
  statusEl.style.color =
    kind === "ok" ? "rgba(124,255,161,.95)" :
    kind === "bad" ? "rgba(255,107,107,.95)" :
    "rgba(255,255,255,.92)";
}

/* ---------- MODAL ---------- */
function showWin(){
  winModal.classList.add("show");
  winModal.setAttribute("aria-hidden","false");
}
function hideWin(){
  winModal.classList.remove("show");
  winModal.setAttribute("aria-hidden","true");
  copyMsg.textContent = "";
}

/* ---------- SUDOKU GEN (Backtracking) ---------- */
function randInt(n){ return Math.floor(Math.random() * n); }

function shuffled(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = randInt(i+1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rcToIdx(r,c){ return r*9 + c; }
function idxToRC(i){ return {r: Math.floor(i/9), c: i%9}; }

function isValid(board, idx, val){
  const {r,c} = idxToRC(idx);

  // row
  for(let cc=0; cc<9; cc++){
    const j = rcToIdx(r,cc);
    if(j !== idx && board[j] === val) return false;
  }
  // col
  for(let rr=0; rr<9; rr++){
    const j = rcToIdx(rr,c);
    if(j !== idx && board[j] === val) return false;
  }
  // box
  const br = Math.floor(r/3)*3;
  const bc = Math.floor(c/3)*3;
  for(let rr=br; rr<br+3; rr++){
    for(let cc=bc; cc<bc+3; cc++){
      const j = rcToIdx(rr,cc);
      if(j !== idx && board[j] === val) return false;
    }
  }
  return true;
}

function solve(board){
  // find empty
  let empty = -1;
  for(let i=0;i<81;i++){
    if(board[i] === 0){ empty = i; break; }
  }
  if(empty === -1) return true;

  const nums = shuffled([1,2,3,4,5,6,7,8,9]);
  for(const v of nums){
    if(isValid(board, empty, v)){
      board[empty] = v;
      if(solve(board)) return true;
      board[empty] = 0;
    }
  }
  return false;
}

function generateNewMedium(){
  // 1) create solved grid
  const b = Array(81).fill(0);
  solve(b);
  solution = b.slice();

  // 2) remove values for medium
  // Medium-ish: remove ~45-50 cells. We'll do 46.
  const toRemove = 46;
  const p = solution.slice();
  const indices = shuffled([...Array(81)].map((_,i)=>i));

  let removed = 0;
  for(const i of indices){
    if(removed >= toRemove) break;
    p[i] = 0;
    removed++;
  }

  puzzleStart = p.slice();
  grid = p.slice();
  fixed = grid.map(v => v !== 0);
  selected = -1;

  setStatus("Select a cell.", "");
  render();
}

/* ---------- RENDER ---------- */
function render(){
  boardEl.innerHTML = "";

  for(let i=0;i<81;i++){
    const v = grid[i];
    const cell = document.createElement("div");
    cell.className = "cell " + (fixed[i] ? "fixed" : "editable");
    cell.dataset.idx = String(i);
    cell.textContent = v === 0 ? "" : String(v);

    const {r,c} = idxToRC(i);
    if(c === 2 || c === 5) cell.classList.add("thickR");
    if(r === 2 || r === 5) cell.classList.add("thickB");

    if(i === selected) cell.classList.add("selected");

    cell.addEventListener("click", () => selectCell(i));
    boardEl.appendChild(cell);
  }

  applyHighlights();
}

function selectCell(i){
  hideWin();
  selected = i;
  if(fixed[i]) setStatus("That number is fixed.", "");
  else setStatus("Enter 1–9 or erase.", "");
  render();
}

function applyHighlights(){
  const cells = Array.from(boardEl.children);
  cells.forEach(el => el.classList.remove("same","conflict"));

  if(selected >= 0){
    const val = grid[selected];
    if(val !== 0){
      for(let i=0;i<81;i++){
        if(grid[i] === val) cells[i].classList.add("same");
      }
    }
  }

  const bad = findConflicts(grid);
  bad.forEach(i => cells[i].classList.add("conflict"));
}

function findConflicts(board){
  const bad = new Set();

  // rows
  for(let r=0;r<9;r++){
    const seen = new Map();
    for(let c=0;c<9;c++){
      const i = rcToIdx(r,c);
      const v = board[i];
      if(v === 0) continue;
      if(!seen.has(v)) seen.set(v, []);
      seen.get(v).push(i);
    }
    for(const arr of seen.values()){
      if(arr.length > 1) arr.forEach(i => bad.add(i));
    }
  }

  // cols
  for(let c=0;c<9;c++){
    const seen = new Map();
    for(let r=0;r<9;r++){
      const i = rcToIdx(r,c);
      const v = board[i];
      if(v === 0) continue;
      if(!seen.has(v)) seen.set(v, []);
      seen.get(v).push(i);
    }
    for(const arr of seen.values()){
      if(arr.length > 1) arr.forEach(i => bad.add(i));
    }
  }

  // boxes
  for(let br=0;br<3;br++){
    for(let bc=0;bc<3;bc++){
      const seen = new Map();
      for(let r=br*3;r<br*3+3;r++){
        for(let c=bc*3;c<bc*3+3;c++){
          const i = rcToIdx(r,c);
          const v = board[i];
          if(v === 0) continue;
          if(!seen.has(v)) seen.set(v, []);
          seen.get(v).push(i);
        }
      }
      for(const arr of seen.values()){
        if(arr.length > 1) arr.forEach(i => bad.add(i));
      }
    }
  }

  return bad;
}

/* ---------- INPUT ---------- */
function setValue(val){
  if(selected < 0){
    setStatus("Select a cell first.", "bad");
    return;
  }
  if(fixed[selected]){
    setStatus("That number is fixed.", "bad");
    return;
  }

  grid[selected] = val;
  render();
  checkWin();
}

function erase(){
  setValue(0);
}

function checkWin(){
  // all filled
  for(const v of grid) if(v === 0) return;

  // no conflicts
  if(findConflicts(grid).size > 0){
    setStatus("There are conflicts to fix.", "bad");
    return;
  }

  // must match solution
  for(let i=0;i<81;i++){
    if(grid[i] !== solution[i]) {
      setStatus("Not quite — check a row/column/box.", "bad");
      return;
    }
  }

  setStatus("Solved!", "ok");
  showWin();
}

/* ---------- RESET / NEW ---------- */
function resetPuzzle(){
  hideWin();
  grid = puzzleStart.slice();
  fixed = grid.map(v => v !== 0);
  selected = -1;
  setStatus("Reset to starting puzzle.", "");
  render();
}

/* ---------- CLIPBOARD ---------- */
async function copyToClipboard(text){
  if(navigator.clipboard?.writeText){
    await navigator.clipboard.writeText(text);
    return true;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  const ok = document.execCommand("copy");
  document.body.removeChild(ta);
  return ok;
}

/* ---------- EVENTS ---------- */
startBtn.addEventListener("click", () => showScreen(title));
playBtn.addEventListener("click", () => {
  showScreen(game);
  generateNewMedium();
});

newBtn.addEventListener("click", () => generateNewMedium());
resetBtn.addEventListener("click", () => resetPuzzle());

padBtns.forEach(b => {
  b.addEventListener("click", () => setValue(Number(b.dataset.n)));
});
eraseBtn.addEventListener("click", () => erase());

copyBtn.addEventListener("click", async () => {
  try{
    const ok = await copyToClipboard(PASSCODE);
    copyMsg.textContent = ok ? "Copied to clipboard." : "Copy failed — copy manually.";
  }catch{
    copyMsg.textContent = "Copy failed — copy manually.";
  }
});

backTitleBtn.addEventListener("click", () => {
  hideWin();
  showScreen(title);
});

playAgainBtn.addEventListener("click", () => {
  hideWin();
  generateNewMedium();
});

// keyboard
window.addEventListener("keydown", (e) => {
  if(!game.classList.contains("active")) return;
  if(winModal.classList.contains("show")) return;

  const k = e.key;

  if(k >= "1" && k <= "9"){ setValue(Number(k)); return; }
  if(k === "Backspace" || k === "Delete"){ erase(); return; }

  if(selected < 0) return;
  const {r,c} = idxToRC(selected);
  if(k === "ArrowUp" && r > 0) selectCell(rcToIdx(r-1,c));
  if(k === "ArrowDown" && r < 8) selectCell(rcToIdx(r+1,c));
  if(k === "ArrowLeft" && c > 0) selectCell(rcToIdx(r,c-1));
  if(k === "ArrowRight" && c < 8) selectCell(rcToIdx(r,c+1));
});

/* ---------- BOOT ---------- */
showScreen(intro);
