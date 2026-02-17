const hasMermaid = typeof mermaid !== "undefined" && mermaid?.run;

if (hasMermaid){
  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: {
      primaryColor: "#ffffff",
      primaryTextColor: "#111111",
      primaryBorderColor: "#ec5628",
      lineColor: "#ec5628",
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
      fontSize: "14px"
    }
  });
}

const menu = document.getElementById("menu");
const viewer = document.getElementById("viewer");
const diagramEl = document.getElementById("diagram");
const titleEl = document.getElementById("title");
const fileHintEl = document.getElementById("filehint");
const backBtn = document.getElementById("back");
const resetBtn = document.getElementById("resetZoom");
const reloadFlowBtn = document.getElementById("reloadFlow");
const hardReloadBtn = document.getElementById("hardReload");
const wrap = document.getElementById("diagramWrap");

const flowFiles = {
  lockout: { title: "Lockout call flow", file: "lockout.mmd" },
  jumpstart: { title: "Jumpstart call flow", file: "jumpstart.mmd" },
  residential: { title: "Residential non lockout flow", file: "residential.mmd" },
  auto: { title: "Auto locksmith non lockout flow", file: "auto.mmd" },
  commercial: { title: "Commercial non lockout flow", file: "commercial.mmd" }
};

let activeFlowKey = null;
let panzoomInstance = null;

function destroyPanzoom(){
  if (panzoomInstance){
    try { panzoomInstance.destroy(); } catch(e){}
    panzoomInstance = null;
  }
}

function setupPanzoom(){
  destroyPanzoom();
  const svg = wrap.querySelector("svg");
  if (!svg) return;

  panzoomInstance = Panzoom(svg, {
    maxScale: 5,
    minScale: 0.5,
    contain: "outside"
  });

  wrap.addEventListener("wheel", panzoomInstance.zoomWithWheel, { passive: false });
}

async function renderMermaid(){
  diagramEl.removeAttribute("data-processed");
  try{
    await mermaid.run({ nodes: [diagramEl] });
  } catch (e){
    diagramEl.textContent = "Diagram render error. Reload and try again.";
  }
}

async function loadFlow(key, push=true){
  activeFlowKey = key;
  const meta = flowFiles[key];
  titleEl.textContent = meta.title;
  fileHintEl.textContent = meta.file;

  const res = await fetch(meta.file + "?v=" + Date.now(), { cache: "no-store" });

  if (!res.ok){
    diagramEl.textContent = "flowchart TD\nA[Missing diagram file] --> B[Make sure the .mmd file is in the repo root]";
  } else {
    diagramEl.textContent = (await res.text()).trim();
  }

  menu.classList.add("hidden");
  viewer.classList.remove("hidden");

  if (push){
    history.pushState({ flow: key }, "", "#"+key);
  }

  await renderMermaid();
  setupPanzoom();
}

function showMenu(push=true){
  destroyPanzoom();
  viewer.classList.add("hidden");
  menu.classList.remove("hidden");
  activeFlowKey = null;

  if (push){
    history.pushState({ flow: null }, "", "#");
  }
}

window.addEventListener("popstate", (event) => {
  const state = event.state;
  if (state && state.flow){
    loadFlow(state.flow, false);
  } else {
    showMenu(false);
  }
});

document.querySelectorAll("[data-flow]").forEach(btn => {
  btn.addEventListener("click", () => loadFlow(btn.getAttribute("data-flow")));
});

backBtn.addEventListener("click", () => showMenu());

resetBtn.addEventListener("click", () => {
  if (!panzoomInstance) return;
  panzoomInstance.reset();
  panzoomInstance.zoom(1, { animate: true });
});

if (reloadFlowBtn){
  reloadFlowBtn.addEventListener("click", () => {
    if (!activeFlowKey) return;
    loadFlow(activeFlowKey, false);
  });
}

if (hardReloadBtn){
  hardReloadBtn.addEventListener("click", () => {
    const u = new URL(window.location.href);
    u.searchParams.set("v", Date.now().toString());
    window.location.replace(u.toString());
  });
}

// On first load, check hash
window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash.replace("#","");
  if (hash && flowFiles[hash]){
    loadFlow(hash, false);
  } else {
    history.replaceState({ flow: null }, "", "#");
  }
});
