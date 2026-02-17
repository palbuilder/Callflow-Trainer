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

const menu = document.getElementById("menu");
const viewer = document.getElementById("viewer");
const diagramEl = document.getElementById("diagram");
const titleEl = document.getElementById("title");
const fileHintEl = document.getElementById("filehint");
const backBtn = document.getElementById("back");
const resetBtn = document.getElementById("resetZoom");
const wrap = document.getElementById("diagramWrap");

const flowFiles = {
  lockout: { title: "Lockout call flow", file: "flows/lockout.mmd" },
  jumpstart: { title: "Jumpstart call flow", file: "flows/jumpstart.mmd" },
  residential: { title: "Residential call flow", file: "flows/residential.mmd" },
  auto: { title: "Auto call flow", file: "flows/auto.mmd" },
  commercial: { title: "Commercial call flow", file: "flows/commercial.mmd" }
};

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

async function loadFlow(key){
  const meta = flowFiles[key];
  titleEl.textContent = meta.title;
  fileHintEl.textContent = meta.file;

  const res = await fetch(meta.file, { cache: "no-store" });
  if (!res.ok){
    diagramEl.textContent = "flowchart TD\nA[Missing diagram file] --> B[Add the .mmd file in /flows]";
  } else {
    diagramEl.textContent = (await res.text()).trim();
  }

  menu.classList.add("hidden");
  viewer.classList.remove("hidden");

  await mermaid.run({ nodes: [diagramEl] });
  setupPanzoom();
}

function showMenu(){
  destroyPanzoom();
  viewer.classList.add("hidden");
  menu.classList.remove("hidden");
}

document.querySelectorAll("[data-flow]").forEach(btn => {
  btn.addEventListener("click", () => loadFlow(btn.getAttribute("data-flow")));
});

backBtn.addEventListener("click", showMenu);

resetBtn.addEventListener("click", () => {
  if (!panzoomInstance) return;
  panzoomInstance.reset();
  panzoomInstance.zoom(1, { animate: true });
});
