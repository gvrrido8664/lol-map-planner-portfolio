// Spline logic matching Konva.Line with tension=0.4
function getControlPoints(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
) {
  const d01 = Math.hypot(x1 - x0, y1 - y0);
  const d12 = Math.hypot(x2 - x1, y2 - y1);
  const dSum = d01 + d12;
  if (dSum === 0) return [x1, y1, x1, y1];
  const fa = (t * d01) / dSum;
  const fb = (t * d12) / dSum;
  return [x1 - fa * (x2 - x0), y1 - fa * (y2 - y0), x1 + fb * (x2 - x0), y1 + fb * (y2 - y0)];
}

function expandPoints(p: number[], tension: number) {
  const len = p.length;
  const allPoints: number[] = [];
  for (let n = 2; n < len - 2; n += 2) {
    const cp = getControlPoints(p[n - 2], p[n - 1], p[n], p[n + 1], p[n + 2], p[n + 3], tension);
    if (isNaN(cp[0])) continue;
    allPoints.push(cp[0], cp[1], p[n], p[n + 1], cp[2], cp[3]);
  }
  return allPoints;
}

export function drawKonvaLine(ctx: CanvasRenderingContext2D, points: number[], tension = 0.4) {
  if (points.length < 4) {
    for (let i = 0; i < points.length; i += 2) {
      if (i === 0) ctx.moveTo(points[i], points[i + 1]);
      else ctx.lineTo(points[i], points[i + 1]);
    }
    return;
  }

  if (tension === 0) {
    for (let i = 0; i < points.length; i += 2) {
      if (i === 0) ctx.moveTo(points[i], points[i + 1]);
      else ctx.lineTo(points[i], points[i + 1]);
    }
    return;
  }

  const tp = expandPoints(points, tension);
  const len = tp.length;
  const length = points.length;

  let x0 = points[0];
  let y0 = points[1];
  ctx.moveTo(x0, y0);

  if (len >= 4) {
    ctx.quadraticCurveTo(tp[0], tp[1], tp[2], tp[3]);
    x0 = tp[2];
    y0 = tp[3];
  }

  let n = 4;
  while (n < len - 2) {
    const cp1x = tp[n++];
    const cp1y = tp[n++];
    const cp2x = tp[n++];
    const cp2y = tp[n++];
    const x = tp[n++];
    const y = tp[n++];
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    x0 = x;
    y0 = y;
  }

  if (len >= 2) {
    ctx.quadraticCurveTo(tp[len - 2], tp[len - 1], points[length - 2], points[length - 1]);
  } else {
    ctx.lineTo(points[length - 2], points[length - 1]);
  }
}
