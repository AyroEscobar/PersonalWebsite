/*
  The composition, shared by the scene, the poster tool and (by hand) the CSS room boxes.
  World metres, measured from the foot point O (his root on the ground line). The box holds the man and
  the disk over a whole push cycle and a slip, with a margin, so the poster and the live canvas frame the
  same picture. Measured with window.__measure() (src/scene/hooks.js); the CSS mirrors ASPECT, FOOT_X and
  FOOT_Y as --room-aspect, --foot-x and --foot-y (src/styles/tokens.css), and check-content holds them equal.
*/
export const SLOPE_DEG = 14
export const R = 1.0
export const X0 = -45
export const T_POSTER = 2.34 // the push-off peak: the rear leg straight, the frame of greatest stretch
// box: left, right, bottom, top in metres from O (world axes, the camera is a strict side view)
// R 1.0 (Sat Oct 17, 2026): rest l -0.81 r 2.64 b -0.14 t 2.46; the slip reaches l -1.17; his own box b -0.14 t 1.41
export const BOX = { l: -1.22, r: 2.7, b: -0.3, t: 2.58 }
export const ASPECT = (BOX.r - BOX.l) / (BOX.t - BOX.b)
export const FOOT_X = -BOX.l / (BOX.r - BOX.l)
export const FOOT_Y = BOX.t / (BOX.t - BOX.b)
