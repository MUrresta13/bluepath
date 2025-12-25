"use strict";

const PASSCODE = "GIFTSGIVENINWAITING";

/**
 * Medium sudoku set (puzzle + solution). 0 = empty.
 * Randomly chosen each game.
 */
const PUZZLES = [
  {
    // Medium
    puzzle: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
    solution:"534678912672195348198342567859761423426853791713924856961537284287419635345286179"
  },
  {
    puzzle: "009000004700009810006700000060030200000208000004070050000006500071500006300000900",
    solution:"819265734753469812246731589567834291935218467124976358482196573971583646368427915"
  },
  {
    puzzle: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
    solution:"435269781682571493197834562826195347374682915951743628519326874248957136763418259"
  },
  {
    puzzle: "200080300060070084030500209000105408000000000402706000301007040720040060004010003",
    solution:"245986371169273584837541269673195428918324657452768931391657842728439165564812793"
  },
  {
    puzzle: "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
    solution:"483651927765423189291785326176934852859216743342597619926178534834059271517342968"
  },
  {
    puzzle: "100920000524010000000000070050008102000000000402700090060000000000030945000071006",
    solution:"176923584524817639938654271753498162619235478482716395265189713817362945394571826"
  }
];

const screenIntro = document.getElementById("screenIntro");
const screenTitle = document.getElementById("screenTitle");
const screenGame  = document.getElementById("screenGame");

const btnStart = document.getElementById("btnStart");
const btnPlay  = document.getElementById("btnPlay");

const btnNew   = document.getElementById("btnNew");
const btnReset = document.getElementById("btnReset");

const boardEl  = document.getElementById("board");
const statusEl = document.getElementById("status");

const padBtns  = Array.from(document.querySelectorAll(".padBtn[data-num]"));
const btnErase = document.getElementById("btnErase");

const winModal = document.getElementById("winModal");
const btnCopy  = document.getElementById("btnCopy");
const btnBackTitle = document.getElementById("btnBackTitle");
const btnPlayAgain = document.getElementById("btnPlayAgain");
const copyMsg  = document.getElementById("copyMsg");

// State
let currentPuzzle = null;
let grid = [];        // 81 chars '0'..'9'
let fixed = [];       // boolean[81]
let selected = -1;    // index 0..80

function showScreen(s){
  hideModal();
  screenIntro.classList.remove("active");
  screenTitle.classList.remove("active");
  screenGame.classList.remove("active");
  s.classList.add("active");
}

function showModal(){
  winModal.classList.add("show");
  winModal.setAttribute("aria-hidden","false");
}
function hideModal(){
  winModal.classList.remove("show");
  winModal.setAttribute("aria-hidden","true");
  copyMsg.textContent = "";
}

function setStatus(msg, kind=""){
  statusEl.textContent = msg;
  statusEl.style.color =
    kind === "ok" ? "rgba(124,255,161,.95)" :
    kind === "bad" ? "rgba(255,107,107,.95)" :
    "rgba(255,255,255,.92)";
}

function idxToRC(i){ return { r: Math.floor(i/9), c: i%9 }; }
function rcToIdx(r,c){ return r*9 + c; }
function boxIndex(r,c){ return Math.floor(r/3)*3 + Math.floor(c/3); }

function pickPuzzle(){
  currentPuzzle = PUZZLES[Math.floor(Math.random() * PUZZLES.length)];
  grid = currentPuzzle.puzzle.split("");
  fixed = grid.map(ch => ch !== "0");
  selected = -1;
}

function render(){
  boardEl.innerHTML = "";

  for(let i=0;i<81;i++){
    const ch = grid[i];
    const cell = document.createElement("div");
    cell.className = "cell " + (fixed[i] ? "fixed" : "editable");
    cell.dataset.idx = String(i);
    cell.textContent = ch === "0" ? "" : ch;

    // bold 3x3 borders
    const {r,c} = idxToRC(i);
    if(c === 2 || c === 5) cell.classList.add("boxBorderR");
    if(r === 2 || r === 5) cell.classList.add("boxBorderB");

    if(i === selected) cell.classList.add("selected");

    cell.addEventListener("click", () => selectCell(i));
    boardEl.appendChild(cell);
  }

  applyHighlights();
}

function selectCell(i){
  hideModal();
  selected = i;
  if(fixed[i]){
    setStatus("That number is fixed.", "");
  }else{
    setStatus("Enter a number (1–9) or erase.", "");
  }
  render();
}

function applyHighlights(){
  const cells = Array.from(boardEl.children);

  // Clear classes
  cells.forEach(el => {
    el.classList.remove("same","conflict");
  });

  // Same-number highlight
  if(selected >= 0){
    const val = grid[selected];
    if(val !== "0"){
      cells.forEach((el, i) => {
        if(grid[i] === val) el.classList.add("same");
      });
    }
  }

  // Conflicts
  const conflicts = findConflicts();
  conflicts.forEach(i => cells[i].classList.add("conflict"));
}

function findConflicts(){
  const bad = new Set();

  // rows
  for(let r=0;r<9;r++){
    const seen = new Map(); // val -> indices
    for(let c=0;c<9;c++){
      const i = rcToIdx(r,c);
      const v = grid[i];
      if(v === "0") continue;
      if(!seen.has(v)) seen.set(v, []);
      seen.get(v).push(i);
    }
    for(const [v, arr] of seen.entries()){
      if(arr.length > 1) arr.forEach(i => bad.add(i));
    }
  }

  // cols
  for(let c=0;c<9;c++){
    const seen = new Map();
    for(let r=0;r<9;r++){
      const i = rcToIdx(r,c);
      const v = grid[i];
      if(v === "0") continue;
      if(!seen.has(v)) seen.set(v, []);
      seen.get(v).push(i);
    }
    for(const [v, arr] of seen.entries()){
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
          const v = grid[i];
          if(v === "0") continue;
          if(!seen.has(v)) seen.set(v, []);
          seen.get(v).push(i);
        }
      }
      for(const [v, arr] of seen.entries()){
        if(arr.length > 1) arr.forEach(i => bad.add(i));
      }
    }
  }

  return bad;
}

function setCellValue(v){
  if(selected < 0){
    setStatus("Select a cell first.", "bad");
    return;
  }
  if(fixed[selected]){
    setStatus("That number is fixed.", "bad");
    return;
  }
  grid[selected] = v;
  render();
  checkWin();
}

function eraseCell(){
  setCellValue("0");
}

function checkWin(){
  // Must be filled
  if(grid.includes("0")) return;

  // Must have no conflicts
  if(findConflicts().size > 0) return;

  // Must match solution exactly
  const cur = grid.join("");
  if(cur === currentPuzzle.solution){
    setStatus("Solved!", "ok");
    showModal();
  }else{
    // Filled but not correct
    setStatus("Not quite right — check for mistakes.", "bad");
  }
}

function resetToStart(){
  grid = currentPuzzle.puzzle.split("");
  fixed = grid.map(ch => ch !== "0");
  selected = -1;
  hideModal();
  setStatus("Puzzle reset.", "");
  render();
}

function newPuzzle(){
  hideModal();
  pickPuzzle();
  setStatus("New puzzle loaded.", "");
  render();
}

// Clipboard
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

// Events
btnStart.addEventListener("click", () => showScreen(screenTitle));
btnPlay.addEventListener("click", () => {
  showScreen(screenGame);
  newPuzzle();
});

btnNew.addEventListener("click", () => newPuzzle());
btnReset.addEventListener("click", () => resetToStart());

padBtns.forEach(b => {
  b.addEventListener("click", () => setCellValue(b.dataset.num));
});
btnErase.addEventListener("click", () => eraseCell());

btnCopy.addEventListener("click", async () => {
  try{
    const ok = await copyToClipboard(PASSCODE);
    copyMsg.textContent = ok ? "Copied to clipboard." : "Copy failed — copy manually.";
  }catch{
    copyMsg.textContent = "Copy failed — copy manually.";
  }
});

btnBackTitle.addEventListener("click", () => {
  hideModal();
  showScreen(screenTitle);
});

btnPlayAgain.addEventListener("click", () => {
  hideModal();
  newPuzzle();
});

// Keyboard controls
window.addEventListener("keydown", (e) => {
  if(!screenGame.classList.contains("active")) return;
  if(winModal.classList.contains("show")) return;

  const key = e.key;

  // Numbers
  if(key >= "1" && key <= "9"){
    setCellValue(key);
    return;
  }
  if(key === "Backspace" || key === "Delete"){
    eraseCell();
    return;
  }

  // Arrow movement
  if(selected < 0) return;
  const {r,c} = idxToRC(selected);
  if(key === "ArrowUp" && r > 0) selectCell(rcToIdx(r-1,c));
  if(key === "ArrowDown" && r < 8) selectCell(rcToIdx(r+1,c));
  if(key === "ArrowLeft" && c > 0) selectCell(rcToIdx(r,c-1));
  if(key === "ArrowRight" && c < 8) selectCell(rcToIdx(r,c+1));
});

// Boot
showScreen(screenIntro);
