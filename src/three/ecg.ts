/** CPU twin of the GLSL `ecg()` so geometry and shaders draw the same waveform */
const g = (x: number, c: number, w: number) => Math.exp(-Math.pow((x - c) / w, 2))
export function ecg(x: number) {
  x = x - Math.floor(x)
  return 0.12 * g(x, 0.16, 0.03) - 0.14 * g(x, 0.285, 0.008) + 1.0 * g(x, 0.3, 0.011) - 0.28 * g(x, 0.318, 0.01) + 0.28 * g(x, 0.5, 0.05)
}
