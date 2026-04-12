const WORLD = {
  width: 121,
  height: 81,
  pixelSize: 9,
};

const COLORS = {
  point: "#c2552d",
  line: "#0f766e",
  polygon: "#235789",
  circle: "#7b8c2f",
  selected: "#f59e0b",
  pending: "#b45309",
  clipWindow: "#c2552d",
  selection: "#0f766e",
};

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");
const canvasFrame = document.querySelector(".canvas-frame");
const workspace = document.querySelector(".workspace");
const workspaceSplitter = document.getElementById("workspaceSplitter");

const toolButtons = [...document.querySelectorAll("[data-tool]")];
const toolLabel = document.getElementById("toolLabel");
const lineAlgorithmSelect = document.getElementById("lineAlgorithmSelect");
const polygonAlgorithmSelect = document.getElementById("polygonAlgorithmSelect");
const clipAlgorithmSelect = document.getElementById("clipAlgorithmSelect");
const finishPolygonButton = document.getElementById("finishPolygonButton");
const cancelPendingButton = document.getElementById("cancelPendingButton");
const translateButton = document.getElementById("translateButton");
const scaleButton = document.getElementById("scaleButton");
const rotateButton = document.getElementById("rotateButton");
const reflectXButton = document.getElementById("reflectXButton");
const reflectYButton = document.getElementById("reflectYButton");
const reflectXYButton = document.getElementById("reflectXYButton");
const applyClipButton = document.getElementById("applyClipButton");
const clearClipButton = document.getElementById("clearClipButton");
const deleteSelectedButton = document.getElementById("deleteSelectedButton");
const clearCanvasButton = document.getElementById("clearCanvasButton");
const toggleDataViewButton = document.getElementById("toggleDataViewButton");
const clearTraceButton = document.getElementById("clearTraceButton");
const themeToggleButton = document.getElementById("themeToggleButton");
const zoomOutButton = document.getElementById("zoomOutButton");
const zoomSlider = document.getElementById("zoomSlider");
const zoomResetButton = document.getElementById("zoomResetButton");
const zoomInButton = document.getElementById("zoomInButton");
const zoomLevelLabel = document.getElementById("zoomLevelLabel");
const translateXInput = document.getElementById("translateXInput");
const translateYInput = document.getElementById("translateYInput");
const scaleXInput = document.getElementById("scaleXInput");
const scaleYInput = document.getElementById("scaleYInput");
const rotationInput = document.getElementById("rotationInput");
const pivotModeSelect = document.getElementById("pivotModeSelect");
const cursorPosition = document.getElementById("cursorPosition");
const selectionSummary = document.getElementById("selectionSummary");
const stats = document.getElementById("stats");
const statusMessage = document.getElementById("statusMessage");
const dataInspector = document.getElementById("dataInspector");
const traceInspector = document.getElementById("traceInspector");

const state = {
  tool: "point",
  shapes: [],
  nextId: 1,
  selectedIds: new Set(),
  pendingPoints: [],
  drag: null,
  clipWindow: null,
  pixelSize: WORLD.pixelSize,
  zoomScale: 0.8,
  dataViewMode: "selected",
  theme: "light",
  algorithmTrace: {
    title: "Console iniciado",
    lines: ["Aguardando a criação de uma reta ou a aplicação de um recorte."],
  },
};

const toolNames = {
  point: "Ponto",
  line: "Reta",
  circle: "Circunferência",
  polygon: "Polígono",
  select: "Seleção",
  "clip-window": "Janela de recorte",
};

function roundCoord(value) {
  return Math.round(value);
}

function clampCoord(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function sanitizeWorldPoint(point) {
  return {
    x: clampCoord(roundCoord(point.x), -Math.floor(WORLD.width / 2), Math.floor(WORLD.width / 2)),
    y: clampCoord(roundCoord(point.y), -Math.floor(WORLD.height / 2), Math.floor(WORLD.height / 2)),
  };
}

function clonePoint(point) {
  return { x: point.x, y: point.y };
}

function formatPoint(point) {
  return `(${Number(point.x).toFixed(2)}, ${Number(point.y).toFixed(2)})`;
}

function refreshAlgorithmTrace() {
  traceInspector.textContent = [
    `>>> ${state.algorithmTrace.title}`,
    "",
    ...state.algorithmTrace.lines,
  ].join("\n");
}

function setAlgorithmTrace(title, lines) {
  state.algorithmTrace = { title, lines };
  refreshAlgorithmTrace();
}

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle("dark-theme", theme === "dark");
  themeToggleButton.textContent = theme === "dark" ? "Modo claro" : "Modo escuro";
}

function updateZoomLabel() {
  zoomLevelLabel.textContent = `Zoom ${Math.round(state.zoomScale * 100)}%`;
  zoomSlider.value = String(Math.round(state.zoomScale * 100));
}

function serializeShape(shape) {
  switch (shape.type) {
    case "point":
      return {
        id: shape.id,
        type: shape.type,
        position: clonePoint(shape.position),
      };
    case "line":
      return {
        id: shape.id,
        type: shape.type,
        algorithm: shape.algorithm,
        start: clonePoint(shape.start),
        end: clonePoint(shape.end),
      };
    case "circle":
      return {
        id: shape.id,
        type: shape.type,
        center: clonePoint(shape.center),
        radius: shape.radius,
      };
    case "polygon":
      return {
        id: shape.id,
        type: shape.type,
        algorithm: shape.algorithm,
        vertices: shape.vertices.map(clonePoint),
      };
    default:
      return { id: shape.id, type: shape.type };
  }
}

function refreshDataInspector() {
  const visibleShapes = state.dataViewMode === "selected"
    ? state.shapes.filter((shape) => state.selectedIds.has(shape.id))
    : state.shapes;

  const inspectorPayload = {
    mode: state.dataViewMode === "selected" ? "somente selecao" : "tudo",
    tool: state.tool,
    totals: {
      shapes: state.shapes.length,
      selected: state.selectedIds.size,
      visibleInInspector: visibleShapes.length,
    },
    selectedIds: [...state.selectedIds],
    clipWindow: state.clipWindow
      ? {
          minX: state.clipWindow.minX,
          maxX: state.clipWindow.maxX,
          minY: state.clipWindow.minY,
          maxY: state.clipWindow.maxY,
        }
      : null,
    pendingPoints: state.pendingPoints.map(clonePoint),
    structures: visibleShapes.map(serializeShape),
  };

  dataInspector.textContent = JSON.stringify(inspectorPayload, null, 2);
  toggleDataViewButton.textContent =
    state.dataViewMode === "selected" ? "Mostrar tudo" : "Mostrar seleção";
}

function createShape(shape) {
  state.shapes.push({ ...shape, id: state.nextId++ });
  updateStats();
  refreshDataInspector();
  render();
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function setTool(tool) {
  state.tool = tool;
  state.pendingPoints = [];
  state.drag = null;
  toolLabel.textContent = toolNames[tool];
  toolButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  syncPendingButtons();
  refreshDataInspector();
  render();
  setStatus(`Ferramenta ativa: ${toolNames[tool]}.`);
}

function setZoom(scale) {
  state.zoomScale = Math.min(1, Math.max(0.45, Number(scale.toFixed(2))));
  configureCanvasResolution();
}

function getCanvasSpaceMetrics() {
  const workspaceStyles = window.getComputedStyle(workspace);
  const workspaceHorizontalPadding =
    parseFloat(workspaceStyles.paddingLeft) + parseFloat(workspaceStyles.paddingRight);
  const frameStyles = window.getComputedStyle(canvasFrame);
  const frameHorizontalPadding = parseFloat(frameStyles.paddingLeft) + parseFloat(frameStyles.paddingRight);
  const totalAvailableWidth = Math.max(
    320,
    workspace.clientWidth - workspaceHorizontalPadding - frameHorizontalPadding,
  );
  return { totalAvailableWidth, workspaceHorizontalPadding, frameHorizontalPadding };
}

function shouldIgnoreShortcut(event) {
  const target = event.target;
  if (!target) {
    return false;
  }

  const tagName = target.tagName?.toLowerCase();
  return (
    target.isContentEditable ||
    tagName === "input" ||
    tagName === "select" ||
    tagName === "textarea"
  );
}

function syncPendingButtons() {
  finishPolygonButton.disabled = !(state.tool === "polygon" && state.pendingPoints.length >= 3);
  cancelPendingButton.disabled = state.pendingPoints.length === 0 && !state.drag;
}

function worldToCanvas(point) {
  const centerX = (WORLD.width * state.pixelSize) / 2;
  const centerY = (WORLD.height * state.pixelSize) / 2;
  return {
    x: centerX + point.x * state.pixelSize,
    y: centerY - point.y * state.pixelSize,
  };
}

function canvasToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const logicalWidth = WORLD.width * state.pixelSize;
  const logicalHeight = WORLD.height * state.pixelSize;
  const scaleX = logicalWidth / rect.width;
  const scaleY = logicalHeight / rect.height;
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;
  const worldX = (canvasX - logicalWidth / 2) / state.pixelSize;
  const worldY = (logicalHeight / 2 - canvasY) / state.pixelSize;
  return sanitizeWorldPoint({ x: worldX, y: worldY });
}

function drawPixel(point, color) {
  const canvasPoint = worldToCanvas(point);
  const size = state.pixelSize;
  ctx.fillStyle = color;
  ctx.fillRect(
    Math.round(canvasPoint.x - size / 2 + 0.5),
    Math.round(canvasPoint.y - size / 2 + 0.5),
    size - 1,
    size - 1,
  );
}

function drawGuidePoint(point, color, radius = 5) {
  const canvasPoint = worldToCanvas(point);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(canvasPoint.x, canvasPoint.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawRectangleGuide(rect, color, lineDash = [8, 6]) {
  if (!rect) {
    return;
  }

  const topLeft = worldToCanvas({ x: rect.minX, y: rect.maxY });
  const bottomRight = worldToCanvas({ x: rect.maxX, y: rect.minY });

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash(lineDash);
  ctx.strokeRect(
    topLeft.x - state.pixelSize / 2,
    topLeft.y - state.pixelSize / 2,
    bottomRight.x - topLeft.x + state.pixelSize,
    bottomRight.y - topLeft.y + state.pixelSize,
  );
  ctx.restore();
}

function rasterizeLineDDA(start, end) {
  const points = [];
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) {
    return [clonePoint(start)];
  }

  const xIncrement = dx / steps;
  const yIncrement = dy / steps;
  let x = start.x;
  let y = start.y;

  for (let step = 0; step <= steps; step += 1) {
    points.push(sanitizeWorldPoint({ x, y }));
    x += xIncrement;
    y += yIncrement;
  }

  return dedupePoints(points);
}

function rasterizeLineBresenham(start, end) {
  const points = [];
  let x1 = start.x;
  let y1 = start.y;
  const x2 = end.x;
  const y2 = end.y;
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: x1, y: y1 });
    if (x1 === x2 && y1 === y2) {
      break;
    }

    const e2 = err * 2;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
  }

  return dedupePoints(points);
}

function rasterizeCircleBresenham(center, radius) {
  const points = [];
  let x = 0;
  let y = radius;
  let decision = 3 - 2 * radius;

  function plotSymmetric(circleX, circleY) {
    const symmetricPoints = [
      { x: center.x + circleX, y: center.y + circleY },
      { x: center.x - circleX, y: center.y + circleY },
      { x: center.x + circleX, y: center.y - circleY },
      { x: center.x - circleX, y: center.y - circleY },
      { x: center.x + circleY, y: center.y + circleX },
      { x: center.x - circleY, y: center.y + circleX },
      { x: center.x + circleY, y: center.y - circleX },
      { x: center.x - circleY, y: center.y - circleX },
    ];

    points.push(...symmetricPoints.map(sanitizeWorldPoint));
  }

  while (y >= x) {
    plotSymmetric(x, y);
    x += 1;

    if (decision > 0) {
      y -= 1;
      decision += 4 * (x - y) + 10;
    } else {
      decision += 4 * x + 6;
    }
  }

  return dedupePoints(points);
}

function dedupePoints(points) {
  const seen = new Set();
  const result = [];

  points.forEach((point) => {
    const key = `${point.x},${point.y}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(point);
    }
  });

  return result;
}

function getLinePixels(start, end, algorithm) {
  return algorithm === "dda"
    ? rasterizeLineDDA(start, end)
    : rasterizeLineBresenham(start, end);
}

function buildLineRasterTrace(start, end, algorithm) {
  if (algorithm === "dda") {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xIncrement = steps === 0 ? 0 : dx / steps;
    const yIncrement = steps === 0 ? 0 : dy / steps;
    const pixels = rasterizeLineDDA(start, end);
    const lines = [
      "Algoritmo: DDA",
      `Entrada: inicio=${formatPoint(start)} fim=${formatPoint(end)}`,
      `dx=${dx}, dy=${dy}, steps=${steps}`,
      `xIncrement=${xIncrement.toFixed(4)}, yIncrement=${yIncrement.toFixed(4)}`,
    ];

    let x = start.x;
    let y = start.y;
    const previewSteps = Math.min(8, steps + 1);
    for (let step = 0; step < previewSteps; step += 1) {
      lines.push(
        `passo ${step}: x=${x.toFixed(4)}, y=${y.toFixed(4)} -> pixel ${formatPoint(sanitizeWorldPoint({ x, y }))}`,
      );
      x += xIncrement;
      y += yIncrement;
    }

    if (steps + 1 > previewSteps) {
      lines.push(`... ${steps + 1 - previewSteps} passo(s) omitido(s)`);
    }
    lines.push(`Total de pixels rasterizados: ${pixels.length}`);
    return lines;
  }

  const dx = Math.abs(end.x - start.x);
  const dy = Math.abs(end.y - start.y);
  const sx = start.x < end.x ? 1 : -1;
  const sy = start.y < end.y ? 1 : -1;
  let err = dx - dy;
  let x = start.x;
  let y = start.y;
  const pixels = rasterizeLineBresenham(start, end);
  const lines = [
    "Algoritmo: Bresenham",
    `Entrada: inicio=${formatPoint(start)} fim=${formatPoint(end)}`,
    `dx=${dx}, dy=${dy}, sx=${sx}, sy=${sy}, erroInicial=${err}`,
  ];

  for (let step = 0; step < Math.min(12, pixels.length); step += 1) {
    const e2 = err * 2;
    lines.push(`passo ${step}: pixel=(${x}, ${y}), err=${err}, e2=${e2}`);
    if (x === end.x && y === end.y) {
      break;
    }
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  if (pixels.length > 12) {
    lines.push(`... ${pixels.length - 12} passo(s) omitido(s)`);
  }
  lines.push(`Total de pixels rasterizados: ${pixels.length}`);
  return lines;
}

function getShapePixels(shape) {
  switch (shape.type) {
    case "point":
      return [clonePoint(shape.position)];
    case "line":
      return getLinePixels(shape.start, shape.end, shape.algorithm);
    case "circle":
      return rasterizeCircleBresenham(shape.center, shape.radius);
    case "polygon": {
      const pixels = [];
      for (let index = 0; index < shape.vertices.length; index += 1) {
        const start = shape.vertices[index];
        const end = shape.vertices[(index + 1) % shape.vertices.length];
        pixels.push(...getLinePixels(start, end, shape.algorithm));
      }
      return dedupePoints(pixels);
    }
    default:
      return [];
  }
}

function getBoundingBox(points) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

function getShapeBounds(shape) {
  switch (shape.type) {
    case "point":
      return getBoundingBox([shape.position]);
    case "line":
      return getBoundingBox([shape.start, shape.end]);
    case "circle":
      return {
        minX: shape.center.x - shape.radius,
        maxX: shape.center.x + shape.radius,
        minY: shape.center.y - shape.radius,
        maxY: shape.center.y + shape.radius,
      };
    case "polygon":
      return getBoundingBox(shape.vertices);
    default:
      return null;
  }
}

function rectFromPoints(first, second) {
  return {
    minX: Math.min(first.x, second.x),
    maxX: Math.max(first.x, second.x),
    minY: Math.min(first.y, second.y),
    maxY: Math.max(first.y, second.y),
  };
}

function pointInsideRect(point, rect) {
  return point.x >= rect.minX && point.x <= rect.maxX && point.y >= rect.minY && point.y <= rect.maxY;
}

function boundsIntersect(a, b) {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

function isShapeInsideRect(shape, rect) {
  if (shape.type === "point") {
    return pointInsideRect(shape.position, rect);
  }

  if (shape.type === "line") {
    return lineIntersectsRect(shape.start, shape.end, rect);
  }

  if (shape.type === "circle") {
    const bounds = getShapeBounds(shape);
    return boundsIntersect(bounds, rect);
  }

  if (shape.type === "polygon") {
    return shape.vertices.some((vertex) => pointInsideRect(vertex, rect)) || boundsIntersect(getShapeBounds(shape), rect);
  }

  return false;
}

function lineIntersectsRect(start, end, rect) {
  if (pointInsideRect(start, rect) || pointInsideRect(end, rect)) {
    return true;
  }

  return clipLineCohenSutherland(start, end, rect) !== null;
}

function getOutCode(point, rect) {
  let code = 0;
  if (point.x < rect.minX) {
    code |= 1;
  }
  if (point.x > rect.maxX) {
    code |= 2;
  }
  if (point.y < rect.minY) {
    code |= 4;
  }
  if (point.y > rect.maxY) {
    code |= 8;
  }
  return code;
}

function clipLineCohenSutherland(start, end, rect) {
  let x1 = start.x;
  let y1 = start.y;
  let x2 = end.x;
  let y2 = end.y;
  let code1 = getOutCode({ x: x1, y: y1 }, rect);
  let code2 = getOutCode({ x: x2, y: y2 }, rect);

  while (true) {
    if (!(code1 | code2)) {
      return {
        start: sanitizeWorldPoint({ x: x1, y: y1 }),
        end: sanitizeWorldPoint({ x: x2, y: y2 }),
      };
    }

    if (code1 & code2) {
      return null;
    }

    const outsideCode = code1 || code2;
    let x = 0;
    let y = 0;

    if (outsideCode & 8) {
      x = x1 + ((x2 - x1) * (rect.maxY - y1)) / (y2 - y1);
      y = rect.maxY;
    } else if (outsideCode & 4) {
      x = x1 + ((x2 - x1) * (rect.minY - y1)) / (y2 - y1);
      y = rect.minY;
    } else if (outsideCode & 2) {
      y = y1 + ((y2 - y1) * (rect.maxX - x1)) / (x2 - x1);
      x = rect.maxX;
    } else {
      y = y1 + ((y2 - y1) * (rect.minX - x1)) / (x2 - x1);
      x = rect.minX;
    }

    if (outsideCode === code1) {
      x1 = x;
      y1 = y;
      code1 = getOutCode({ x: x1, y: y1 }, rect);
    } else {
      x2 = x;
      y2 = y;
      code2 = getOutCode({ x: x2, y: y2 }, rect);
    }
  }
}

function clipLineLiangBarsky(start, end, rect) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const p = [-dx, dx, -dy, dy];
  const q = [
    start.x - rect.minX,
    rect.maxX - start.x,
    start.y - rect.minY,
    rect.maxY - start.y,
  ];
  let u1 = 0;
  let u2 = 1;

  for (let index = 0; index < 4; index += 1) {
    if (p[index] === 0) {
      if (q[index] < 0) {
        return null;
      }
      continue;
    }

    const ratio = q[index] / p[index];
    if (p[index] < 0) {
      u1 = Math.max(u1, ratio);
    } else {
      u2 = Math.min(u2, ratio);
    }
  }

  if (u1 > u2) {
    return null;
  }

  return {
    start: sanitizeWorldPoint({ x: start.x + u1 * dx, y: start.y + u1 * dy }),
    end: sanitizeWorldPoint({ x: start.x + u2 * dx, y: start.y + u2 * dy }),
  };
}

function clipLineWithTrace(start, end, rect, algorithm) {
  return algorithm === "cohen"
    ? traceClipLineCohenSutherland(start, end, rect)
    : traceClipLineLiangBarsky(start, end, rect);
}

function clipPolygonEdges(shape, rect, algorithm) {
  const replacementShapes = [];
  const traceSections = [`Polígono ${shape.id}`, `Algoritmo de recorte: ${algorithm === "cohen" ? "Cohen-Sutherland" : "Liang-Barsky"}`];

  for (let index = 0; index < shape.vertices.length; index += 1) {
    const start = shape.vertices[index];
    const end = shape.vertices[(index + 1) % shape.vertices.length];
    const trace = clipLineWithTrace(start, end, rect, algorithm);
    traceSections.push("");
    traceSections.push(`Aresta ${index + 1}: ${formatPoint(start)} -> ${formatPoint(end)}`);
    traceSections.push(...trace.lines);

    if (trace.result) {
      replacementShapes.push({
        id: state.nextId++,
        type: "line",
        start: trace.result.start,
        end: trace.result.end,
        algorithm: shape.algorithm || "bresenham",
      });
    }
  }

  return {
    replacementShapes,
    traceLines: traceSections,
  };
}

function traceClipLineCohenSutherland(start, end, rect) {
  let x1 = start.x;
  let y1 = start.y;
  let x2 = end.x;
  let y2 = end.y;
  let code1 = getOutCode({ x: x1, y: y1 }, rect);
  let code2 = getOutCode({ x: x2, y: y2 }, rect);
  const lines = [
    "Algoritmo: Cohen-Sutherland",
    `Janela: min=(${rect.minX}, ${rect.minY}) max=(${rect.maxX}, ${rect.maxY})`,
    `Reta original: inicio=${formatPoint(start)} fim=${formatPoint(end)}`,
  ];

  for (let iteration = 1; iteration <= 16; iteration += 1) {
    lines.push(
      `iteracao ${iteration}: code1=${code1.toString(2).padStart(4, "0")} code2=${code2.toString(2).padStart(4, "0")}`,
    );

    if (!(code1 | code2)) {
      const result = {
        start: sanitizeWorldPoint({ x: x1, y: y1 }),
        end: sanitizeWorldPoint({ x: x2, y: y2 }),
      };
      lines.push(`aceita: segmento final ${formatPoint(result.start)} -> ${formatPoint(result.end)}`);
      return { result, lines };
    }

    if (code1 & code2) {
      lines.push("rejeitada: os codigos compartilham uma regiao externa.");
      return { result: null, lines };
    }

    const outsideCode = code1 || code2;
    let x = 0;
    let y = 0;
    let border = "esquerda";

    if (outsideCode & 8) {
      x = x1 + ((x2 - x1) * (rect.maxY - y1)) / (y2 - y1);
      y = rect.maxY;
      border = "topo";
    } else if (outsideCode & 4) {
      x = x1 + ((x2 - x1) * (rect.minY - y1)) / (y2 - y1);
      y = rect.minY;
      border = "base";
    } else if (outsideCode & 2) {
      y = y1 + ((y2 - y1) * (rect.maxX - x1)) / (x2 - x1);
      x = rect.maxX;
      border = "direita";
    } else {
      y = y1 + ((y2 - y1) * (rect.minX - x1)) / (x2 - x1);
      x = rect.minX;
      border = "esquerda";
    }

    lines.push(`interseccao na borda ${border}: ${formatPoint({ x, y })}`);

    if (outsideCode === code1) {
      x1 = x;
      y1 = y;
      code1 = getOutCode({ x: x1, y: y1 }, rect);
      lines.push(`atualiza ponto inicial -> ${formatPoint({ x: x1, y: y1 })}`);
    } else {
      x2 = x;
      y2 = y;
      code2 = getOutCode({ x: x2, y: y2 }, rect);
      lines.push(`atualiza ponto final -> ${formatPoint({ x: x2, y: y2 })}`);
    }
  }

  lines.push("interrompido: limite de iteracoes atingido.");
  return { result: null, lines };
}

function traceClipLineLiangBarsky(start, end, rect) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const p = [-dx, dx, -dy, dy];
  const q = [
    start.x - rect.minX,
    rect.maxX - start.x,
    start.y - rect.minY,
    rect.maxY - start.y,
  ];
  let u1 = 0;
  let u2 = 1;
  const borders = ["esquerda", "direita", "base", "topo"];
  const lines = [
    "Algoritmo: Liang-Barsky",
    `Janela: min=(${rect.minX}, ${rect.minY}) max=(${rect.maxX}, ${rect.maxY})`,
    `Reta original: inicio=${formatPoint(start)} fim=${formatPoint(end)}`,
    `dx=${dx}, dy=${dy}`,
  ];

  for (let index = 0; index < 4; index += 1) {
    if (p[index] === 0) {
      lines.push(`borda ${borders[index]}: p=0, q=${q[index]}`);
      if (q[index] < 0) {
        lines.push("rejeitada: reta paralela e fora da janela.");
        return { result: null, lines };
      }
      continue;
    }

    const ratio = q[index] / p[index];
    lines.push(`borda ${borders[index]}: p=${p[index]}, q=${q[index]}, r=${ratio.toFixed(4)}`);
    if (p[index] < 0) {
      u1 = Math.max(u1, ratio);
      lines.push(`atualiza u1 -> ${u1.toFixed(4)}`);
    } else {
      u2 = Math.min(u2, ratio);
      lines.push(`atualiza u2 -> ${u2.toFixed(4)}`);
    }
  }

  if (u1 > u2) {
    lines.push(`rejeitada: u1 (${u1.toFixed(4)}) > u2 (${u2.toFixed(4)}).`);
    return { result: null, lines };
  }

  const result = {
    start: sanitizeWorldPoint({ x: start.x + u1 * dx, y: start.y + u1 * dy }),
    end: sanitizeWorldPoint({ x: start.x + u2 * dx, y: start.y + u2 * dy }),
  };
  lines.push(`aceita: segmento final ${formatPoint(result.start)} -> ${formatPoint(result.end)}`);
  return { result, lines };
}

function getShapeReferencePoints(shape) {
  switch (shape.type) {
    case "point":
      return [shape.position];
    case "line":
      return [shape.start, shape.end];
    case "circle":
      return [shape.center];
    case "polygon":
      return shape.vertices;
    default:
      return [];
  }
}

function getSelectionPivot() {
  if (pivotModeSelect.value === "origin" || state.selectedIds.size === 0) {
    return { x: 0, y: 0 };
  }

  const points = state.shapes
    .filter((shape) => state.selectedIds.has(shape.id))
    .flatMap((shape) => getShapeReferencePoints(shape));

  const total = points.reduce(
    (accumulator, point) => ({
      x: accumulator.x + point.x,
      y: accumulator.y + point.y,
    }),
    { x: 0, y: 0 },
  );

  return sanitizeWorldPoint({
    x: total.x / points.length,
    y: total.y / points.length,
  });
}

function transformPoint(point, matrix, pivot) {
  const translatedX = point.x - pivot.x;
  const translatedY = point.y - pivot.y;
  const transformedX = matrix[0][0] * translatedX + matrix[0][1] * translatedY + pivot.x;
  const transformedY = matrix[1][0] * translatedX + matrix[1][1] * translatedY + pivot.y;
  return sanitizeWorldPoint({ x: transformedX, y: transformedY });
}

function getUniformScaleFromMatrix(matrix) {
  const axisScaleX = Math.hypot(matrix[0][0], matrix[1][0]);
  const axisScaleY = Math.hypot(matrix[0][1], matrix[1][1]);
  return (axisScaleX + axisScaleY) / 2 || 1;
}

function applyToSelectedShapes(transformer) {
  let touched = 0;

  state.shapes = state.shapes.map((shape) => {
    if (!state.selectedIds.has(shape.id)) {
      return shape;
    }

    touched += 1;
    return transformer(shape);
  });

  updateStats();
  refreshDataInspector();
  render();
  return touched;
}

function applyTranslation() {
  if (state.selectedIds.size === 0) {
    setStatus("Selecione ao menos um elemento antes de aplicar a translação.");
    return;
  }

  const tx = Number(translateXInput.value);
  const ty = Number(translateYInput.value);

  if (Number.isNaN(tx) || Number.isNaN(ty)) {
    setStatus("Informe valores numéricos válidos para a translação.");
    return;
  }

  const count = applyToSelectedShapes((shape) => {
    switch (shape.type) {
      case "point":
        return { ...shape, position: sanitizeWorldPoint({ x: shape.position.x + tx, y: shape.position.y + ty }) };
      case "line":
        return {
          ...shape,
          start: sanitizeWorldPoint({ x: shape.start.x + tx, y: shape.start.y + ty }),
          end: sanitizeWorldPoint({ x: shape.end.x + tx, y: shape.end.y + ty }),
        };
      case "circle":
        return { ...shape, center: sanitizeWorldPoint({ x: shape.center.x + tx, y: shape.center.y + ty }) };
      case "polygon":
        return {
          ...shape,
          vertices: shape.vertices.map((vertex) => sanitizeWorldPoint({ x: vertex.x + tx, y: vertex.y + ty })),
        };
      default:
        return shape;
    }
  });

  setStatus(`Translação aplicada em ${count} elemento(s): Δx=${tx}, Δy=${ty}.`);
}

function applyLinearTransform(matrix, label) {
  if (state.selectedIds.size === 0) {
    setStatus(`Selecione ao menos um elemento antes de aplicar ${label}.`);
    return;
  }

  const pivot = getSelectionPivot();
  const count = applyToSelectedShapes((shape) => {
    switch (shape.type) {
      case "point":
        return { ...shape, position: transformPoint(shape.position, matrix, pivot) };
      case "line":
        return {
          ...shape,
          start: transformPoint(shape.start, matrix, pivot),
          end: transformPoint(shape.end, matrix, pivot),
        };
      case "circle": {
        const center = transformPoint(shape.center, matrix, pivot);
        const averageScale = getUniformScaleFromMatrix(matrix);
        const radius = Math.max(1, Math.round(shape.radius * averageScale));
        return { ...shape, center, radius };
      }
      case "polygon":
        return {
          ...shape,
          vertices: shape.vertices.map((vertex) => transformPoint(vertex, matrix, pivot)),
        };
      default:
        return shape;
    }
  });

  setStatus(`${label} aplicada em ${count} elemento(s). Pivô: (${pivot.x}, ${pivot.y}).`);
}

function applyScale() {
  const sx = Number(scaleXInput.value);
  const sy = Number(scaleYInput.value);

  if (Number.isNaN(sx) || Number.isNaN(sy)) {
    setStatus("Informe valores numéricos válidos para a escala.");
    return;
  }

  applyLinearTransform(
    [
      [sx, 0],
      [0, sy],
    ],
    `Escala (Sx=${sx}, Sy=${sy})`,
  );
}

function applyRotation() {
  const angle = Number(rotationInput.value);

  if (Number.isNaN(angle)) {
    setStatus("Informe um ângulo numérico válido para a rotação.");
    return;
  }

  const radians = (angle * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  applyLinearTransform(
    [
      [cos, -sin],
      [sin, cos],
    ],
    `Rotação (${angle}°)`,
  );
}

function applyReflection(mode) {
  const matrixByMode = {
    x: [
      [1, 0],
      [0, -1],
    ],
    y: [
      [-1, 0],
      [0, 1],
    ],
    xy: [
      [-1, 0],
      [0, -1],
    ],
  };

  const labelByMode = {
    x: "Reflexão no eixo X",
    y: "Reflexão no eixo Y",
    xy: "Reflexão nos eixos X/Y",
  };

  applyLinearTransform(matrixByMode[mode], labelByMode[mode]);
}

function applyClip() {
  if (!state.clipWindow) {
    setStatus("Defina primeiro uma janela de recorte.");
    return;
  }

  if (state.selectedIds.size === 0) {
    setStatus("Selecione ao menos uma reta ou polígono antes de aplicar o recorte.");
    return;
  }

  const algorithm = clipAlgorithmSelect.value;
  let clipped = 0;
  let removed = 0;
  let ignored = 0;
  let generatedSegments = 0;
  const traceBlocks = [];

  state.shapes = state.shapes.flatMap((shape) => {
    if (!state.selectedIds.has(shape.id)) {
      return [shape];
    }

    if (shape.type === "line") {
      const trace = clipLineWithTrace(shape.start, shape.end, state.clipWindow, algorithm);
      traceBlocks.push(`Linha ${shape.id}\n${trace.lines.join("\n")}`);

      if (!trace.result) {
        removed += 1;
        state.selectedIds.delete(shape.id);
        return [];
      }

      clipped += 1;
      return [{ ...shape, start: trace.result.start, end: trace.result.end }];
    }

    if (shape.type === "polygon") {
      const { replacementShapes, traceLines } = clipPolygonEdges(shape, state.clipWindow, algorithm);
      traceBlocks.push(traceLines.join("\n"));
      state.selectedIds.delete(shape.id);

      if (replacementShapes.length === 0) {
        removed += 1;
        return [];
      }

      clipped += 1;
      generatedSegments += replacementShapes.length;
      replacementShapes.forEach((replacementShape) => state.selectedIds.add(replacementShape.id));
      return replacementShapes;
    }

    if (shape.type !== "line" && shape.type !== "polygon") {
      ignored += 1;
      return [shape];
    }
  });

  updateStats();
  refreshDataInspector();
  setAlgorithmTrace(
    `Recorte por ${algorithm === "cohen" ? "Cohen-Sutherland" : "Liang-Barsky"}`,
    traceBlocks.length > 0
      ? traceBlocks.join("\n\n----------------\n\n").split("\n")
      : ["Nenhuma reta ou polígono foi processado."],
  );
  render();
  setStatus(
    `Recorte ${algorithm === "cohen" ? "Cohen-Sutherland" : "Liang-Barsky"}: ${clipped} elemento(s) processado(s), ${generatedSegments} segmento(s) gerado(s), ${removed} removido(s), ${ignored} ignorado(s).`,
  );
}

function clearProject() {
  state.shapes = [];
  state.selectedIds.clear();
  state.pendingPoints = [];
  state.drag = null;
  state.clipWindow = null;
  updateStats();
  syncPendingButtons();
  refreshDataInspector();
  render();
  setStatus("Projeto limpo.");
}

function deleteSelected() {
  if (state.selectedIds.size === 0) {
    setStatus("Nenhum elemento selecionado para exclusão.");
    return;
  }

  const before = state.shapes.length;
  state.shapes = state.shapes.filter((shape) => !state.selectedIds.has(shape.id));
  const removed = before - state.shapes.length;
  state.selectedIds.clear();
  updateStats();
  refreshDataInspector();
  render();
  setStatus(`${removed} elemento(s) removido(s).`);
}

function finishPolygon() {
  if (state.pendingPoints.length < 3) {
    setStatus("Um polígono precisa de pelo menos três vértices.");
    return;
  }

  createShape({
    type: "polygon",
    vertices: state.pendingPoints.map(clonePoint),
    algorithm: polygonAlgorithmSelect.value,
  });
  state.pendingPoints = [];
  syncPendingButtons();
  refreshDataInspector();
  setStatus("Polígono criado.");
}

function cancelPending() {
  state.pendingPoints = [];
  state.drag = null;
  syncPendingButtons();
  refreshDataInspector();
  render();
  setStatus("Operação em andamento cancelada.");
}

function updateStats() {
  const totals = {
    point: 0,
    line: 0,
    circle: 0,
    polygon: 0,
  };

  state.shapes.forEach((shape) => {
    totals[shape.type] += 1;
  });

  stats.textContent =
    `Pontos: ${totals.point} | Retas: ${totals.line} | Circunferências: ${totals.circle} | Polígonos: ${totals.polygon}`;
  selectionSummary.textContent = `Selecionados: ${state.selectedIds.size}`;
  refreshDataInspector();
}

function renderGrid() {
  const logicalWidth = WORLD.width * state.pixelSize;
  const logicalHeight = WORLD.height * state.pixelSize;
  ctx.clearRect(0, 0, logicalWidth, logicalHeight);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  ctx.save();
  ctx.strokeStyle = "rgba(100, 96, 88, 0.12)";
  ctx.lineWidth = 1;

  for (let column = 0; column <= WORLD.width; column += 1) {
    const x = column * state.pixelSize;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, logicalHeight);
    ctx.stroke();
  }

  for (let row = 0; row <= WORLD.height; row += 1) {
    const y = row * state.pixelSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(logicalWidth, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(24, 57, 82, 0.35)";
  ctx.lineWidth = 2;
  const centerX = logicalWidth / 2;
  const centerY = logicalHeight / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, logicalHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(logicalWidth, centerY);
  ctx.stroke();
  ctx.restore();
}

function renderShapes() {
  state.shapes.forEach((shape) => {
    const isSelected = state.selectedIds.has(shape.id);
    const baseColor = isSelected ? COLORS.selected : COLORS[shape.type];
    getShapePixels(shape).forEach((point) => drawPixel(point, baseColor));

    if (isSelected) {
      getShapeReferencePoints(shape).forEach((point) => drawGuidePoint(point, "#1f2937", 4));
    }
  });
}

function renderPending() {
  if (state.pendingPoints.length === 0) {
    return;
  }

  state.pendingPoints.forEach((point) => drawGuidePoint(point, COLORS.pending, 4));

  if (state.tool === "line" && state.pendingPoints.length === 1) {
    drawGuidePoint(state.pendingPoints[0], COLORS.pending, 5);
    return;
  }

  if (state.tool === "circle" && state.pendingPoints.length === 1) {
    drawGuidePoint(state.pendingPoints[0], COLORS.pending, 5);
    return;
  }

  if (state.tool === "polygon") {
    for (let index = 0; index < state.pendingPoints.length - 1; index += 1) {
      const pixels = getLinePixels(state.pendingPoints[index], state.pendingPoints[index + 1], polygonAlgorithmSelect.value);
      pixels.forEach((point) => drawPixel(point, COLORS.pending));
    }
  }
}

function renderDragOverlay() {
  if (!state.drag) {
    return;
  }

  const rect = rectFromPoints(state.drag.start, state.drag.current);
  const color = state.tool === "clip-window" ? COLORS.clipWindow : COLORS.selection;
  drawRectangleGuide(rect, color);
}

function renderClipWindow() {
  if (state.clipWindow) {
    drawRectangleGuide(state.clipWindow, COLORS.clipWindow, [14, 6]);
  }
}

function render() {
  renderGrid();
  renderShapes();
  renderPending();
  renderClipWindow();
  renderDragOverlay();
}

function addPointAt(position) {
  createShape({
    type: "point",
    position,
  });
  setStatus(`Ponto criado em (${position.x}, ${position.y}).`);
}

function addLinePoint(position) {
  state.pendingPoints.push(position);
  syncPendingButtons();
  refreshDataInspector();

  if (state.pendingPoints.length < 2) {
    render();
    setStatus(`Ponto inicial da reta registrado em (${position.x}, ${position.y}).`);
    return;
  }

  const [start, end] = state.pendingPoints;
  createShape({
    type: "line",
    start,
    end,
    algorithm: lineAlgorithmSelect.value,
  });
  setAlgorithmTrace(
    `Rasterização de reta por ${lineAlgorithmSelect.value.toUpperCase()}`,
    buildLineRasterTrace(start, end, lineAlgorithmSelect.value),
  );
  state.pendingPoints = [];
  syncPendingButtons();
  setStatus(`Reta criada com ${lineAlgorithmSelect.value.toUpperCase()}.`);
}

function addCirclePoint(position) {
  state.pendingPoints.push(position);
  syncPendingButtons();
  refreshDataInspector();

  if (state.pendingPoints.length < 2) {
    render();
    setStatus(`Centro da circunferência registrado em (${position.x}, ${position.y}).`);
    return;
  }

  const [center, radiusPoint] = state.pendingPoints;
  const radius = Math.max(
    1,
    Math.round(Math.hypot(radiusPoint.x - center.x, radiusPoint.y - center.y)),
  );
  createShape({
    type: "circle",
    center,
    radius,
  });
  state.pendingPoints = [];
  syncPendingButtons();
  setStatus(`Circunferência criada com raio ${radius} pelo algoritmo de Bresenham.`);
}

function addPolygonVertex(position) {
  state.pendingPoints.push(position);
  syncPendingButtons();
  refreshDataInspector();
  render();
  setStatus(`Vértice ${state.pendingPoints.length} registrado em (${position.x}, ${position.y}).`);
}

function completeSelection(rect) {
  state.selectedIds = new Set(
    state.shapes.filter((shape) => isShapeInsideRect(shape, rect)).map((shape) => shape.id),
  );
  updateStats();
  refreshDataInspector();
  render();
  setStatus(`${state.selectedIds.size} elemento(s) selecionado(s).`);
}

function handleCanvasClick(position) {
  switch (state.tool) {
    case "point":
      addPointAt(position);
      break;
    case "line":
      addLinePoint(position);
      break;
    case "circle":
      addCirclePoint(position);
      break;
    case "polygon":
      addPolygonVertex(position);
      break;
    default:
      break;
  }
}

canvas.addEventListener("pointermove", (event) => {
  const position = canvasToWorld(event);
  cursorPosition.textContent = `Cursor: (${position.x}, ${position.y})`;

  if (state.drag) {
    state.drag.current = position;
    refreshDataInspector();
    render();
    syncPendingButtons();
  }
});

canvas.addEventListener("pointerdown", (event) => {
  if (state.tool !== "select" && state.tool !== "clip-window") {
    return;
  }

  const position = canvasToWorld(event);
  state.drag = {
    start: position,
    current: position,
  };
  syncPendingButtons();
  refreshDataInspector();
  render();
});

canvas.addEventListener("pointerup", (event) => {
  const position = canvasToWorld(event);

  if (state.drag && (state.tool === "select" || state.tool === "clip-window")) {
    const rect = rectFromPoints(state.drag.start, position);
    state.drag = null;
    syncPendingButtons();

    if (state.tool === "select") {
      completeSelection(rect);
    } else {
      state.clipWindow = rect;
      refreshDataInspector();
      render();
      setStatus(
        `Janela de recorte definida: [${rect.minX}, ${rect.minY}] até [${rect.maxX}, ${rect.maxY}].`,
      );
    }
    return;
  }

  handleCanvasClick(position);
});

toolButtons.forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

finishPolygonButton.addEventListener("click", finishPolygon);
cancelPendingButton.addEventListener("click", cancelPending);
translateButton.addEventListener("click", applyTranslation);
scaleButton.addEventListener("click", applyScale);
rotateButton.addEventListener("click", applyRotation);
reflectXButton.addEventListener("click", () => applyReflection("x"));
reflectYButton.addEventListener("click", () => applyReflection("y"));
reflectXYButton.addEventListener("click", () => applyReflection("xy"));
applyClipButton.addEventListener("click", applyClip);
clearClipButton.addEventListener("click", () => {
  state.clipWindow = null;
  refreshDataInspector();
  render();
  setStatus("Janela de recorte removida.");
});
deleteSelectedButton.addEventListener("click", deleteSelected);
clearCanvasButton.addEventListener("click", clearProject);
clearTraceButton.addEventListener("click", () => {
  setAlgorithmTrace("Console limpo", ["Aguardando a criação de uma reta ou a aplicação de um recorte."]);
});
themeToggleButton.addEventListener("click", () => {
  applyTheme(state.theme === "dark" ? "light" : "dark");
});
zoomOutButton.addEventListener("click", () => setZoom(state.zoomScale - 0.1));
zoomResetButton.addEventListener("click", () => setZoom(0.8));
zoomInButton.addEventListener("click", () => setZoom(state.zoomScale + 0.1));
zoomSlider.addEventListener("input", (event) => {
  setZoom(Number(event.target.value) / 100);
});
toggleDataViewButton.addEventListener("click", () => {
  state.dataViewMode = state.dataViewMode === "selected" ? "all" : "selected";
  refreshDataInspector();
});

workspaceSplitter.addEventListener("pointerdown", (event) => {
  if (!workspace.classList.contains("workspace--split")) {
    return;
  }

  event.preventDefault();
  workspaceSplitter.setPointerCapture(event.pointerId);
  document.body.style.userSelect = "none";

  const moveHandler = (moveEvent) => {
    const { totalAvailableWidth } = getCanvasSpaceMetrics();
    const workspaceRect = workspace.getBoundingClientRect();
    const pointerOffset = moveEvent.clientX - workspaceRect.left;
    const minInspectorWidth = 320;
    const splitterWidth = 12;
    const splitGap = 18;
    const maxCanvasWidth = totalAvailableWidth - minInspectorWidth - splitterWidth - splitGap;
    const desiredCanvasWidth = Math.max(240, Math.min(maxCanvasWidth, pointerOffset - 8));
    const nextScale = desiredCanvasWidth / totalAvailableWidth;
    setZoom(nextScale);
  };

  const stopHandler = () => {
    document.body.style.userSelect = "";
    window.removeEventListener("pointermove", moveHandler);
    window.removeEventListener("pointerup", stopHandler);
  };

  window.addEventListener("pointermove", moveHandler);
  window.addEventListener("pointerup", stopHandler, { once: true });
});

document.addEventListener("keydown", (event) => {
  if (shouldIgnoreShortcut(event)) {
    return;
  }

  const key = event.key.toLowerCase();

  if (key === "delete") {
    event.preventDefault();
    deleteSelected();
    return;
  }

  if (key === "enter") {
    if (state.tool === "polygon" && state.pendingPoints.length >= 3) {
      event.preventDefault();
      finishPolygon();
    }
    return;
  }

  if (key === "escape") {
    if (state.pendingPoints.length > 0 || state.drag) {
      event.preventDefault();
      cancelPending();
    }
    return;
  }

  const shortcutActions = {
    p: () => setTool("point"),
    r: () => setTool("line"),
    c: () => setTool("circle"),
    g: () => setTool("polygon"),
    s: () => setTool("select"),
    j: () => setTool("clip-window"),
    t: () => applyTranslation(),
    e: () => applyScale(),
    o: () => applyRotation(),
    x: () => applyReflection("x"),
    y: () => applyReflection("y"),
    b: () => applyReflection("xy"),
    k: () => applyClip(),
  };

  const action = shortcutActions[key];
  if (!action) {
    return;
  }

  event.preventDefault();
  action();
});

function configureCanvasResolution() {
  const { totalAvailableWidth } = getCanvasSpaceMetrics();
  const basePixelSize = Math.max(4, Math.floor(totalAvailableWidth / WORLD.width));
  state.pixelSize = Math.max(4, Math.round(basePixelSize * state.zoomScale));

  const logicalWidth = WORLD.width * state.pixelSize;
  const logicalHeight = WORLD.height * state.pixelSize;
  const inspectorWidth = 320;
  const splitterWidth = 12;
  const splitGap = 18;
  const canSplit =
    window.innerWidth >= 1360 &&
    totalAvailableWidth - logicalWidth >= inspectorWidth + splitterWidth + splitGap;
  workspace.classList.toggle("workspace--split", canSplit);

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(logicalWidth * devicePixelRatio);
  canvas.height = Math.round(logicalHeight * devicePixelRatio);
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.imageSmoothingEnabled = false;
  updateZoomLabel();
  render();
}

updateStats();
syncPendingButtons();
applyTheme("light");
configureCanvasResolution();
refreshDataInspector();
refreshAlgorithmTrace();

window.addEventListener("resize", configureCanvasResolution);

if (window.ResizeObserver) {
  const resizeObserver = new ResizeObserver(() => configureCanvasResolution());
  resizeObserver.observe(canvasFrame);
}
