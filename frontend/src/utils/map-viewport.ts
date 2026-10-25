export type MapRectangle = { left: number; top: number; right: number; bottom: number };

/** Rectángulo libre mayor entre paneles; se calcula al enfocar, nunca en cada frame. */
export function freeMapRectangle(
  width: number,
  height: number,
  overlays: MapRectangle[],
  margin = 24
): MapRectangle {
  const inset = Math.min(margin, width / 4, height / 4);
  let spaces: MapRectangle[] = [
    { left: inset, top: inset, right: width - inset, bottom: height - inset },
  ];
  for (const overlay of overlays) {
    spaces = spaces.flatMap((space) => {
      const left = Math.max(space.left, overlay.left - 12),
        right = Math.min(space.right, overlay.right + 12);
      const top = Math.max(space.top, overlay.top - 12),
        bottom = Math.min(space.bottom, overlay.bottom + 12);
      if (left >= right || top >= bottom) return [space];
      return [
        { ...space, right: left },
        { ...space, left: right },
        { ...space, bottom: top },
        { ...space, top: bottom },
      ].filter((candidate) => candidate.right > candidate.left && candidate.bottom > candidate.top);
    });
  }
  return (
    spaces.sort(
      (a, b) => (b.right - b.left) * (b.bottom - b.top) - (a.right - a.left) * (a.bottom - a.top)
    )[0] ?? { left: inset, top: inset, right: width - inset, bottom: height - inset }
  );
}
