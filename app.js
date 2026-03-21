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

const toolButtons = [...document.querySelectorAll("[data-tool]")];
const toolLabel = document.getElementById("toolLabel");
const lineAlgorithmSelect = document.getElementById("lineAlgorithmSelect");
const polygonAlgorithmSelect = document.getElementById("polygonAlgorithmSelect");
const clipAlgorithmSelect = document.getElementById("clipAlgorithmSelect");
const finishPolygonButton = document.getElementById("finishPolygonButton");
const cancelPendingButton = document.getElementById("cancelPendingButton");
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

const state = {
  tool: "point",
  shapes: [],
  nextId: 1,
  selectedIds: new Set(),
  pendingPoints: [],
  drag: null,
  clipWindow: null,
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

function createShape(shape) {
  state.shapes.push({ ...shape, id: state.nextId++ });
  updateStats();
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
  render();
  setStatus(`Ferramenta ativa: ${toolNames[tool]}.`);
}

function syncPendingButtons() {
  finishPolygonButton.disabled = !(state.tool === "polygon" && state.pendingPoints.length >= 3);
  cancelPendingButton.disabled = state.pendingPoints.length === 0 && !state.drag;
}

function worldToCanvas(point) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  return {
    x: centerX + point.x * WORLD.pixelSize,
    y: centerY - point.y * WORLD.pixelSize,
  };
}

function canvasToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const canvasX = (event.clientX - rect.left) * scaleX;
  const canvasY = (event.clientY - rect.top) * scaleY;
  const worldX = (canvasX - canvas.width / 2) / WORLD.pixelSize;
  const worldY = (canvas.height / 2 - canvasY) / WORLD.pixelSize;
  return sanitizeWorldPoint({ x: worldX, y: worldY });
}

function drawPixel(point, color) {
  const canvasPoint = worldToCanvas(point);
  const size = WORLD.pixelSize;
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
    topLeft.x - WORLD.pixelSize / 2,
    topLeft.y - WORLD.pixelSize / 2,
    bottomRight.x - topLeft.x + WORLD.pixelSize,
    bottomRight.y - topLeft.y + WORLD.pixelSize,
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
    setStatus("Selecione ao menos uma reta antes de aplicar o recorte.");
    return;
  }

  const algorithm = clipAlgorithmSelect.value;
  let clipped = 0;
  let removed = 0;
  let ignored = 0;

  state.shapes = state.shapes.flatMap((shape) => {
    if (!state.selectedIds.has(shape.id)) {
      return [shape];
    }

    if (shape.type !== "line") {
      ignored += 1;
      return [shape];
    }

    const result = algorithm === "cohen"
      ? clipLineCohenSutherland(shape.start, shape.end, state.clipWindow)
      : clipLineLiangBarsky(shape.start, shape.end, state.clipWindow);

    if (!result) {
      removed += 1;
      state.selectedIds.delete(shape.id);
      return [];
    }

    clipped += 1;
    return [{ ...shape, start: result.start, end: result.end }];
  });

  updateStats();
  render();
  setStatus(
    `Recorte ${algorithm === "cohen" ? "Cohen-Sutherland" : "Liang-Barsky"}: ${clipped} reta(s) ajustada(s), ${removed} removida(s), ${ignored} elemento(s) ignorado(s).`,
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
  setStatus("Polígono criado.");
}

function cancelPending() {
  state.pendingPoints = [];
  state.drag = null;
  syncPendingButtons();
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
}

function renderGrid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fffdf8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.strokeStyle = "rgba(100, 96, 88, 0.12)";
  ctx.lineWidth = 1;

  for (let column = 0; column <= WORLD.width; column += 1) {
    const x = column * WORLD.pixelSize;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let row = 0; row <= WORLD.height; row += 1) {
    const y = row * WORLD.pixelSize;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(24, 57, 82, 0.35)";
  ctx.lineWidth = 2;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  ctx.beginPath();
  ctx.moveTo(centerX, 0);
  ctx.lineTo(centerX, canvas.height);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, centerY);
  ctx.lineTo(canvas.width, centerY);
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
  state.pendingPoints = [];
  syncPendingButtons();
  setStatus(`Reta criada com ${lineAlgorithmSelect.value.toUpperCase()}.`);
}

function addCirclePoint(position) {
  state.pendingPoints.push(position);
  syncPendingButtons();

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
  render();
  setStatus(`Vértice ${state.pendingPoints.length} registrado em (${position.x}, ${position.y}).`);
}

function completeSelection(rect) {
  state.selectedIds = new Set(
    state.shapes.filter((shape) => isShapeInsideRect(shape, rect)).map((shape) => shape.id),
  );
  updateStats();
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
document.getElementById("translateButton").addEventListener("click", applyTranslation);
document.getElementById("scaleButton").addEventListener("click", applyScale);
document.getElementById("rotateButton").addEventListener("click", applyRotation);
document.getElementById("reflectXButton").addEventListener("click", () => applyReflection("x"));
document.getElementById("reflectYButton").addEventListener("click", () => applyReflection("y"));
document.getElementById("reflectXYButton").addEventListener("click", () => applyReflection("xy"));
document.getElementById("applyClipButton").addEventListener("click", applyClip);
document.getElementById("clearClipButton").addEventListener("click", () => {
  state.clipWindow = null;
  render();
  setStatus("Janela de recorte removida.");
});
document.getElementById("deleteSelectedButton").addEventListener("click", deleteSelected);
document.getElementById("clearCanvasButton").addEventListener("click", clearProject);

canvas.width = WORLD.width * WORLD.pixelSize;
canvas.height = WORLD.height * WORLD.pixelSize;

updateStats();
syncPendingButtons();
render();
