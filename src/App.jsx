import { useState, useEffect, useRef, useMemo } from "react";

// ─────────────────────────────────────────────
// THEME
// ─────────────────────────────────────────────
const T = {
  light: {
    bg: "#f2f2f4", card: "#fff", cardHover: "#fafafa",
    header: "#fff", headerBorder: "#e0e0e6",
    navBg: "#fff", navBorder: "#cc3333",
    border: "#e4e4ea", text: "#111", sub: "#555", muted: "#999",
    accent: "#cc3333", accentLight: "#fff0f0",
    lions: "#cc3333", club: "#1a56db",
    green: "#00a05a", amber: "#d97706", gray: "#777",
    pill: "#f0f0f5", shadow: "0 1px 8px rgba(0,0,0,0.07)",
    shadowHover: "0 4px 20px rgba(204,51,51,0.12)",
    logoFilter: "none", logoTextColor: "#2f2f33",
  },
  dark: {
    bg: "#0f0f0f", card: "#1c1c1c", cardHover: "#242424",
    header: "#cc3333", headerBorder: "#aa2222",
    navBg: "#161616", navBorder: "#cc3333",
    border: "#2a2a2a", text: "#f0f0f0", sub: "#aaa", muted: "#666",
    accent: "#ff4444", accentLight: "#2a1010",
    lions: "#ff4444", club: "#4d8cff",
    green: "#00d082", amber: "#f59e0b", gray: "#888",
    pill: "#222", shadow: "0 1px 8px rgba(0,0,0,0.4)",
    shadowHover: "0 4px 20px rgba(255,68,68,0.2)",
    logoFilter: "brightness(0) invert(1)", logoTextColor: "#fff",
  },
};

// ─────────────────────────────────────────────
// LIONS SVG LOGO (inline, so it works anywhere)
// ─────────────────────────────────────────────
const LionsSVG = ({ height = 32, dark }) => (
  <svg viewBox="0 0 2323.2 336" height={height} style={{ display: "block", filter: dark ? "brightness(0) invert(1)" : "none" }}>
    <defs>
      <linearGradient x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(1742.4,0,0,-1742.4,0,126)" id="lg1">
        <stop style={{ stopOpacity: 1, stopColor: dark ? "#fff" : "#fff" }} offset="0" />
        <stop style={{ stopOpacity: 1, stopColor: dark ? "#fff" : "#fff" }} offset="1" />
      </linearGradient>
      <linearGradient x1="0" y1="0" x2="1" y2="0" gradientUnits="userSpaceOnUse" gradientTransform="matrix(174.40471,0,0,-174.40471,255.68571,127.1192)" id="lg2">
        <stop style={{ stopOpacity: 1, stopColor: dark ? "#ff6666" : "#e96757" }} offset="0" />
        <stop style={{ stopOpacity: 1, stopColor: dark ? "#cc3333" : "#b8393b" }} offset="0.494" />
        <stop style={{ stopOpacity: 1, stopColor: dark ? "#991111" : "#8f2e33" }} offset="1" />
      </linearGradient>
    </defs>
    <g transform="matrix(1.3333333,0,0,-1.3333333,0,335.99999)">
      <g><path d="M 0,0 H 1742.4 V 252 H 0 Z" style={{ fill: "url(#lg1)" }} /></g>
      <g clipPath="url(#cp1)">
        <g transform="translate(524.0281,57.1919)"><path d="m 0,0 h 123.107 c 3.03,0 5.33,0.689 6.895,2.07 1.565,1.379 2.837,3.842 3.816,7.391 h 4.696 v -52.174 h -4.696 c -0.979,3.546 -2.251,6.009 -3.816,7.387 -1.565,1.382 -3.865,2.071 -6.895,2.071 H -53.117 v 4.729 c 3.522,0.985 5.966,2.265 7.336,3.845 1.37,1.573 2.055,3.889 2.055,6.944 v 170.716 c 0,3.055 -0.685,5.371 -2.055,6.947 -1.37,1.576 -3.814,2.857 -7.336,3.845 V 168.5 H 9.391 v -4.729 C 5.869,162.884 3.422,161.628 2.054,160.002 0.682,158.375 0,156.034 0,152.979 Z" style={{ fill: dark ? "#fff" : "#2f2f33" }} /></g>
        <g transform="translate(692.9161,39.4552)"><path d="m 0,0 v 170.863 c 0,2.958 -0.686,5.223 -2.055,6.8 -1.37,1.576 -3.814,2.857 -7.336,3.845 v 4.729 h 62.508 v -4.729 c -3.522,-0.888 -5.969,-2.143 -7.338,-3.77 -1.371,-1.627 -2.053,-3.917 -2.053,-6.875 L 43.726,0 c 0,-3.055 0.707,-5.393 2.127,-7.02 1.416,-1.627 3.837,-2.882 7.264,-3.769 v -4.729 H -9.391 v 4.729 c 3.522,0.985 5.966,2.265 7.336,3.845 C -0.686,-5.371 0,-3.055 0,0" style={{ fill: dark ? "#fff" : "#2f2f33" }} /></g>
        <g transform="translate(892.2481,194.9479)"><path d="m 0,0 c -19.095,0 -35.009,-5.708 -47.738,-17.126 -15.081,-13.489 -22.619,-31.157 -22.619,-53.009 0,-21.852 7.538,-39.52 22.619,-53.006 12.729,-11.418 28.742,-17.126 48.032,-17.126 19.291,0 35.253,5.708 47.884,17.126 7.539,6.794 13.316,15.11 17.333,24.955 3.523,8.76 5.287,17.816 5.287,27.167 0,22.834 -7.541,40.8 -22.62,53.893 C 35.348,-5.906 19.291,-0.198 0,0 m -0.147,34.29 c 34.944,0 62.644,-9.508 83.103,-28.526 21.631,-19.904 32.445,-45.624 32.445,-77.154 0,-19.314 -5.185,-37.346 -15.562,-54.098 -20.261,-32.714 -53.493,-49.069 -99.692,-49.069 -34.652,0 -62.205,9.505 -82.661,28.526 -10.964,10.147 -19.284,22.318 -24.961,36.508 -4.993,12.511 -7.489,25.666 -7.489,39.464 0,20.197 5.138,38.673 15.417,55.428 19.674,32.022 52.807,48.33 99.4,48.921" style={{ fill: dark ? "#fff" : "#2f2f33" }} /></g>
        <g transform="translate(1088.5002,162.1364)"><path d="m 0,0 v -122.681 c 0,-3.055 0.684,-5.371 2.055,-6.944 1.368,-1.58 3.814,-2.861 7.338,-3.845 v -4.73 h -58.839 v 4.73 c 3.52,0.984 5.966,2.265 7.337,3.845 1.368,1.573 2.052,3.889 2.052,6.944 V 48.182 c 0,2.958 -0.684,5.223 -2.052,6.8 -1.371,1.576 -3.817,2.857 -7.337,3.845 v 4.729 h 68.081 v -4.729 c -4.207,-1.086 -6.309,-3.351 -6.309,-6.8 0,-2.366 1.371,-4.978 4.11,-7.835 l 110.488,-115.73 v 119.72 c 0,2.958 -0.687,5.223 -2.055,6.8 -1.371,1.576 -3.814,2.857 -7.338,3.845 v 4.729 h 58.84 v -4.729 c -3.521,-0.988 -5.966,-2.269 -7.335,-3.845 -1.371,-1.577 -2.055,-3.842 -2.055,-6.8 v -170.863 c 0,-3.055 0.684,-5.371 2.055,-6.944 1.369,-1.58 3.814,-2.861 7.335,-3.845 v -4.73 h -63.094 v 4.73 c 4.108,0.887 6.163,3.004 6.163,6.355 0,1.97 -2.399,5.419 -7.191,10.346 z" style={{ fill: dark ? "#fff" : "#2f2f33" }} /></g>
        <g transform="translate(1487.3143,208.6036)"><path d="m 0,0 -23.917,-47.502 -4.108,2.363 c 0.097,0.984 0.147,1.774 0.147,2.366 0,3.348 -2.839,6.947 -8.512,10.789 -17.411,12.218 -37.855,18.328 -61.332,18.328 -10.37,0 -19.516,-1.28 -27.44,-3.838 -5.773,-1.97 -10.443,-4.925 -14.013,-8.858 -3.57,-3.939 -5.354,-8.221 -5.354,-12.847 0,-7.58 4.548,-12.746 13.644,-15.503 4.698,-1.378 14.772,-2.853 30.227,-4.43 l 23.037,-2.363 c 13.694,-1.475 24.773,-3.495 33.235,-6.054 8.462,-2.561 15.968,-6.154 22.524,-10.783 6.65,-4.823 11.907,-11.176 15.774,-19.051 3.861,-7.876 5.794,-16.296 5.794,-25.257 0,-14.178 -4.548,-26.783 -13.644,-37.808 -8.218,-10.044 -20.984,-17.476 -38.298,-22.303 -12.913,-3.64 -26.757,-5.462 -41.525,-5.462 -26.51,0 -52.676,6.403 -78.499,19.213 -5.482,2.561 -8.758,3.845 -9.833,3.845 -1.271,0 -3.277,-1.086 -6.016,-3.254 l -4.254,2.218 21.715,49.513 4.257,-2.067 v -1.922 c 0,-4.434 2.103,-8.524 6.307,-12.269 6.36,-5.714 16.189,-10.641 29.493,-14.779 13.303,-4.14 25.923,-6.208 37.858,-6.208 13.009,0 24.111,2.212 33.307,6.636 5.085,2.458 9.145,5.73 12.178,9.811 3.034,4.081 4.548,8.335 4.548,12.762 0,6.686 -3.57,11.457 -10.71,14.31 -4.989,1.967 -15.065,3.786 -30.227,5.456 l -22.596,2.363 c -15.162,1.577 -25.873,3.081 -32.133,4.509 -6.263,1.429 -12.522,3.723 -18.782,6.882 -8.902,4.436 -15.896,11.091 -20.981,19.967 -4.601,7.986 -6.897,17.161 -6.897,27.516 0,17.057 5.819,31.16 17.461,42.305 15.259,14.694 38.148,22.041 68.669,22.041 12.813,0 24.748,-1.312 35.802,-3.933 11.052,-2.625 24.846,-7.448 41.379,-14.474 5.672,-2.275 9.146,-3.414 10.417,-3.414 2.055,0 4.451,1.139 7.19,3.414 z" style={{ fill: dark ? "#fff" : "#2f2f33" }} /></g>
      </g>
      <g>
        <path d="m 320.87,234.744 c -4.115,-0.045 -8.003,-1.068 -11.751,-2.71 v 0 c -2.76,-1.208 -5.239,-2.877 -7.657,-4.666 v 0 c 2.498,0.516 5.01,0.83 7.544,0.886 v 0 c 4.102,0.093 8.073,-0.56 11.84,-2.252 v 0 c 1.615,-0.914 3.211,-1.85 4.418,-3.567 v 0 c -1.043,0.321 -1.92,0.592 -2.797,0.862 v 0 c -2.692,1.023 -5.464,1.696 -8.34,1.915 v 0 c -2.98,0.344 -5.924,0.153 -8.832,-0.587 v 0 c -2.666,-0.504 -5.146,-1.507 -7.527,-2.78 v 0 c -1.633,-0.742 -3.122,-1.727 -4.593,-2.737 v 0 c -4.508,-3.094 -8.164,-7.1 -11.829,-11.094 v 0 c -0.04,-0.044 -0.023,-0.141 -0.03,-0.193 v 0 c 4.99,0.186 9.892,0.035 14.284,-2.778 v 0 c -0.879,-0.064 -1.739,0.011 -2.601,0.061 v 0 c -2.695,0.154 -5.385,0.15 -8.064,-0.225 v 0 c -2.222,-0.125 -4.413,-0.45 -6.577,-0.965 v 0 c -4.824,-0.905 -9.245,-2.729 -13.088,-5.823 v 0 c -1.163,-0.938 -1.922,-2.215 -1.952,-3.726 v 0 c -0.053,-2.746 -0.145,-5.496 0.25,-8.237 v 0 c 1.344,-9.342 6.759,-15.659 14.792,-20.056 v 0 c 0.533,-0.306 1.067,-0.611 1.66,-0.952 v 0 c -0.435,-0.07 -0.836,-0.017 -1.223,0.036 v 0 c -0.311,0.043 -0.613,0.086 -0.918,0.066 v 0 c -0.288,0.058 -0.575,0.125 -0.864,0.173 v 0 c -4.805,0.799 -8.881,2.932 -12.129,6.599 v 0 c -1.047,1.183 -1.929,2.483 -2.818,3.873 v 0 c -0.256,-0.522 -0.487,-0.97 -0.699,-1.427 v 0 c -0.56,-1.213 -1.036,-2.459 -1.459,-3.725 v 0 c -2.668,-7.996 -3.728,-16.272 -4.114,-24.641 v 0 c -0.319,-6.925 0.065,-13.828 1.033,-20.702 v 0 c 1.312,-9.301 3.764,-18.278 7.4,-26.934 v 0 c 0.667,-1.587 1.422,-3.137 2.136,-4.705 v 0 c 0.106,0.224 0.106,0.407 0.07,0.582 v 0 c -1.224,5.913 -2.149,11.866 -2.56,17.899 v 0 c -0.54,7.914 -0.081,15.745 1.82,23.465 v 0 c 0.412,1.676 0.85,3.346 1.484,5.023 v 0 c 0.267,-0.537 0.275,-0.537 0.273,-0.959 v 0 c -0.042,-10.841 0.811,-21.613 2.38,-32.335 v 0 c 1.276,-8.72 2.9,-17.369 5.203,-25.88 v 0 c 0.78,-2.878 1.574,-5.757 2.657,-8.542 v 0 c 0.612,-2.154 1.441,-4.231 2.278,-6.301 v 0 c 1.367,-3.38 2.779,-6.741 4.605,-9.908 v 0 c 0.976,-1.963 2.099,-3.836 3.401,-5.601 v 0 c 0.193,-0.354 0.409,-0.69 0.645,-1.013 v 0 c 0.235,-0.323 0.49,-0.632 0.758,-0.931 v 0 c 0.402,-0.542 0.812,-1.074 1.234,-1.594 v 0 c 0.841,-1.04 1.724,-2.034 2.66,-2.973 v 0 c 2.341,-2.344 5.017,-4.337 8.224,-5.813 v 0 c -4.906,14.295 -7.678,28.732 -6.526,43.749 v 0 c 0.227,-1.278 0.377,-2.568 0.551,-3.855 v 0 c 0.459,-3.385 0.987,-6.759 1.797,-10.081 v 0 c 0.775,-3.735 1.827,-7.391 3.103,-10.982 v 0 c 0.801,-2.258 1.65,-4.498 2.66,-6.668 v 0 c 0.337,-0.724 0.691,-1.44 1.068,-2.147 v 0 c 0.417,-0.893 0.854,-1.774 1.314,-2.64 v 0 c 1.377,-2.602 2.955,-5.083 4.762,-7.425 v 0 c 3.248,-4.571 7.259,-8.375 11.733,-11.716 v 0 c 0.026,-0.064 0.059,-0.143 0.137,-0.08 v 0 c 0.024,0.02 -0.018,0.12 -0.029,0.184 v 0 c -0.114,0.327 -0.221,0.656 -0.341,0.98 v 0 c -2.048,5.494 -3.992,11.022 -5.289,16.754 v 0 c -0.99,4.375 -1.568,8.8 -1.614,13.37 v 0 c 0.318,-0.309 0.328,-0.673 0.418,-0.989 v 0 c 1.102,-3.858 2.211,-7.713 3.54,-11.5 v 0 c 1.048,-2.988 2.156,-5.956 3.679,-8.748 v 0 c 0.003,-0.026 -0.002,-0.055 0.009,-0.079 v 0 c 2.153,-4.528 5.096,-8.497 8.563,-12.095 v 0 c 0.055,-0.057 0.11,-0.115 0.172,-0.164 v 0 c 0.094,-0.073 0.196,-0.074 0.29,-0.001 v 0 c 0.094,0.071 0.131,0.17 0.087,0.279 v 0 c -0.079,0.197 -0.169,0.391 -0.252,0.587 v 0 c -1.052,2.449 -2.132,4.889 -2.693,7.512 v 0 c -0.262,1.225 -0.503,2.459 -0.351,3.866 v 0 c 1.15,-2.004 2.222,-3.871 3.294,-5.738 v 0 c 0.95,-1.877 1.918,-3.754 3.132,-5.468 v 0 c 1.214,-1.715 2.58,-3.331 4.431,-4.434 v 0 c 0.998,-0.76 2.246,-1.097 3.213,-1.908 v 0 h 0.802 c 0.829,0.327 1.628,0.701 2.374,1.208 v 0 c 4.376,2.971 7.246,7.07 9.417,11.695 v 0 c 0.31,0.661 0.606,1.332 0.89,2.013 v 0 c 0.442,0.872 0.885,1.743 1.414,2.786 v 0 c 0.105,-2.269 -0.263,-4.258 -0.812,-6.218 v 0 c -0.549,-1.959 -1.389,-3.817 -2.128,-5.785 v 0 c 0.178,0.041 0.241,0.038 0.279,0.068 v 0 c 0.167,0.131 0.33,0.269 0.489,0.411 v 0 c 2.716,2.428 4.876,5.299 6.638,8.47 v 0 c 1.382,2.487 2.409,5.136 3.497,7.764 v 0 c 1.874,4.53 3.329,9.201 4.87,13.844 v 0 c 0.182,0.453 0.364,0.907 0.622,1.551 v 0 c 0.155,-2.671 -0.15,-5.097 -0.523,-7.514 v 0 c -0.869,-5.641 -2.549,-11.064 -4.485,-16.414 v 0 c -0.725,-2.002 -1.46,-4.001 -2.191,-6.001 v 0 c -0.031,-0.027 -0.093,-0.078 -0.091,-0.081 v 0 c 0.063,-0.083 0.114,-0.065 0.149,0.027 v 0 c 0.898,0.151 1.477,0.823 2.132,1.347 v 0 c 6.15,4.917 10.919,10.976 14.657,17.871 v 0 c 3.554,6.552 5.998,13.518 7.675,20.765 v 0 c 0.128,0.235 0.117,0.512 0.165,0.758 v 0 c 0.317,1.616 0.699,3.218 0.868,4.867 v 0 c 0.101,0.978 0.176,1.972 0.346,2.935 v 0 c 0.224,1.261 0.293,2.533 0.436,3.797 v 0 c 0.138,1.214 0.239,2.446 0.374,3.659 v 0 c 0.065,0.585 -0.121,1.364 0.509,1.891 v 0 c 0.024,-0.13 0.053,-0.227 0.06,-0.326 v 0 c 0.503,-6.915 0.445,-13.82 -0.269,-20.721 v 0 c -0.658,-6.358 -1.844,-12.603 -3.728,-18.716 v 0 c -0.488,-1.583 -1.092,-3.123 -1.676,-4.67 v 0 c -0.195,-0.515 -0.387,-1.029 -0.571,-1.547 v 0 c 0.197,-0.12 0.331,0.05 0.474,0.127 v 0 c 6.706,3.569 11.398,9.089 15.083,15.583 v 0 c 1.723,2.768 3.097,5.713 4.402,8.689 v 0 c 2.412,5.501 4.375,11.159 5.83,16.989 v 0 c 0.294,0.963 0.468,1.956 0.713,2.931 v 0 c 0.649,2.578 1.214,5.178 1.766,7.78 v 0 c 0.692,3.266 1.394,6.53 1.99,9.812 v 0 c 1.045,5.756 1.849,11.548 2.428,17.369 v 0 c 0.703,7.08 1.082,14.177 0.993,21.294 v 0 c -0.005,0.426 0.062,0.831 0.214,1.235 v 0 c 0.045,-0.048 0.094,-0.079 0.112,-0.123 v 0 c 0.069,-0.173 0.129,-0.35 0.19,-0.526 v 0 c 2.022,-5.8 2.915,-11.802 3.158,-17.913 v 0 c 0.349,-8.778 -0.57,-17.446 -2.329,-26.037 v 0 c -0.101,-0.497 -0.197,-0.995 -0.294,-1.492 v 0 c -0.09,-0.462 -0.178,-0.925 -0.267,-1.388 v 0 c 0.196,0.083 0.263,0.195 0.32,0.311 v 0 c 6.246,12.811 9.577,26.373 10.472,40.569 v 0 c 0.066,1.042 -0.051,2.111 0.291,3.129 v 0 1.123 6.257 0.963 c -0.203,0.079 -0.144,0.262 -0.148,0.409 v 0 c -0.101,3.152 -0.382,6.288 -0.816,9.411 v 0 c -0.763,5.501 -1.834,10.933 -3.758,16.165 v 0 c -0.508,1.382 -1.023,2.761 -1.559,4.21 v 0 c -0.736,-0.997 -1.392,-1.904 -2.069,-2.796 v 0 c -2.102,-2.767 -4.603,-5.049 -7.894,-6.325 v 0 c -1.303,-0.505 -2.641,-0.92 -3.964,-1.375 v 0 c -1.349,-0.235 -2.682,-0.646 -4.257,-0.43 v 0 c 1.648,0.942 3.207,1.671 4.574,2.716 v 0 c 2.96,1.841 5.454,4.184 7.48,7.014 v 0 c 4.198,5.866 5.155,12.5 4.636,19.499 v 0 c -0.127,1.704 -0.89,2.956 -2.187,3.996 v 0 c -2.941,2.355 -6.249,3.944 -9.887,4.875 v 0 c -3.369,0.979 -6.803,1.577 -10.304,1.794 v 0 c -3.222,0.36 -6.45,0.12 -9.683,0.046 v 0 c 2.076,1.379 4.364,2.109 6.756,2.517 v 0 c 2.387,0.407 4.799,0.416 7.247,0.178 v 0 c -0.095,0.451 -0.338,0.67 -0.54,0.909 v 0 c -1.45,1.716 -2.955,3.382 -4.58,4.934 v 0 c -2.409,2.304 -4.966,4.412 -7.771,6.242 v 0 c -2.652,1.73 -5.4,3.199 -8.43,4.124 v 0 c -3.013,1.056 -6.117,1.503 -9.304,1.396 v 0 c -3.898,-0.033 -7.601,-1.001 -11.228,-2.339 v 0 c -0.596,0.007 -1.103,-0.349 -1.682,-0.409 v 0 c -0.066,-0.011 -0.176,-0.047 -0.187,-0.027 v 0 c -0.054,0.095 0.037,0.099 0.099,0.115 v 0 c 0.602,0.768 1.468,1.228 2.177,1.874 v 0 c 1.072,0.641 2.132,1.306 3.283,1.81 v 0 c 4.539,1.984 9.264,2.057 14.059,1.367 v 0 c 1.403,-0.202 2.797,-0.472 4.223,-0.716 v 0 c -0.025,0.125 -0.018,0.191 -0.046,0.223 v 0 c -0.107,0.117 -0.218,0.233 -0.343,0.331 v 0 c -3.979,3.116 -8.388,5.362 -13.339,6.456 v 0 c -2.661,0.588 -5.357,0.915 -8.093,0.714 v 0 c -2.011,0.053 -3.99,-0.229 -5.956,-0.595 v 0 c -4.35,-0.811 -8.466,-2.326 -12.45,-4.219 v 0 c -0.705,-0.335 -1.405,-0.493 -2.156,-0.203 v 0 c -0.839,0.325 -1.675,0.653 -2.513,0.979 v 0 c -2.409,1.206 -4.946,2.058 -7.55,2.721 v 0 c -1.257,0.465 -2.575,0.683 -3.888,0.889 v 0 c -1.793,0.28 -3.593,0.513 -5.407,0.513 v 0 c -0.587,0 -1.175,-0.024 -1.765,-0.08" style={{ fill: "url(#lg2)" }} />
      </g>
    </g>
  </svg>
);

// ─────────────────────────────────────────────
// LOGOS
// ─────────────────────────────────────────────
const LOGOS = {
  // 🇨🇱 CHILE
  audax: "/logos/chile/audax-italiano.svg",
  cobresal: "/logos/chile/cobresal.svg",
  colocolo: "/logos/chile/colo-colo.svg",
  coquimbo: "/logos/chile/coquimbo-unido.svg",
  dconcepcion: "/logos/chile/deportes-concepcion.svg",
  diquique: "/logos/chile/deportes-iquique.svg",
  limache: "/logos/chile/deportes-limache.svg",
  everton: "/logos/chile/everton.svg",
  laserena: "/logos/chile/la-serena.svg",
  nublense: "/logos/chile/nublense.svg",
  ohiggins: "/logos/chile/ohiggins.svg",
  palestino: "/logos/chile/palestino.svg",
  uespanola: "/logos/chile/union-espanola.svg",
  ulacalera: "/logos/chile/union-la-calera.svg",
  ucatolica: "/logos/chile/universidad-catolica.svg",
  udechile: "/logos/chile/universidad-de-chile.svg",
  uconcepcion: "/logos/chile/universidad-de-concepcion.svg",

  // 🇪🇨 ECUADOR
  aucas: "/logos/ecuador/aucas.svg",
  barcelona: "/logos/ecuador/barcelona.svg",
  delfin: "/logos/ecuador/delfin.svg",
  cuenca: "/logos/ecuador/deportivo-cuenca.svg",
  emelec: "/logos/ecuador/emelec.svg",
  independiente: "/logos/ecuador/independiente-del-valle.svg",
  ldu: "/logos/ecuador/ldu-quito.svg",
  libertad: "/logos/ecuador/libertad.svg",
  macara: "/logos/ecuador/macara.svg",
  manta: "/logos/ecuador/manta.svg",
  mushuc: "/logos/ecuador/mushuc-runa.svg",
  nacional: "/logos/ecuador/nacional.svg",
  orense: "/logos/ecuador/orense.svg",
  tuniversitario: "/logos/ecuador/tecnico-universitario.svg",
  ucatolica_ec: "/logos/ecuador/universidad-catolica.svg",
  vinotinto: "/logos/ecuador/vinotinto.svg",

  // 🇵🇪 PERÚ
  adt: "/logos/peru/adt.svg",
  alianzaatletico: "/logos/peru/alianza-atletico.svg",
  alianzalima: "/logos/peru/alianza-lima.svg",
  alianzau: "/logos/peru/alianza-universidad.svg",
  grau: "/logos/peru/atletico-grau.svg",
  ayacucho: "/logos/peru/ayacucho.svg",
  cienciano: "/logos/peru/cienciano-del-cusco.svg",
  comerciantes: "/logos/peru/comerciantes-unidos.svg",
  cusco: "/logos/peru/cusco.svg",
  garcilaso: "/logos/peru/deportivo-garcilaso.svg",
  moquegua: "/logos/peru/deportivo-moquegua.svg",
  cajamarca: "/logos/peru/fc-cajamarca.svg",
  juanpablo: "/logos/peru/juan-pablo-ii.svg",
  chankas: "/logos/peru/los-chankas.svg",
  melgar: "/logos/peru/melgar.svg",
  sportboys: "/logos/peru/sport-boys.svg",
  huancayo: "/logos/peru/sport-huancayo.svg",
  cristal: "/logos/peru/sporting-cristal.svg",
  universitario: "/logos/peru/universitario.svg",
  utc: "/logos/peru/utc.svg",
};

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────
const PAISES = [
  {
    id: "chile", nombre: "Chile", bandera: "🇨🇱", activo: true,
    equipos: [
      { id: "audax", nombre: "Audax Italiano", logo: LOGOS.audax, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "Abastible", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "Meds", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "PF", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "IVECO", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "MACRON", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Escuela de Fútbol Audax", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Apuestas Royal", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "TODOS X THOMAS", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "Corporativo Audax", minutos: 0, bonificados: 0 },{ categoria: "CLUB", nombre: "Sixtus", minutos: 1, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 12, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 3 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 3 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 4 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 0 }] },
      { id: "ulacalera", nombre: "Unión La Calera", logo: LOGOS.ulacalera, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "Apuestas Royal", minutos: 7.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Zapping", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "GWM/SUZUVAL", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Sport", minutos: 2.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Electrolit", minutos: 3.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Olymphus", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Orthomax", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Melón", minutos: 2.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Open", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Givova", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Sixtus", minutos: 1.5, bonificados: 1 },{ categoria: "CLUB", nombre: "Ticketmaster", minutos: 1.5, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 12, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 1 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 1 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 1 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 3 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 2 }] },
      { id: "palestino", nombre: "Palestino", logo: LOGOS.palestino, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "BOP", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "SAN JORGE", minutos: 8, bonificados: 0 },{ categoria: "CLUB", nombre: "KAYSER", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "CAPELLI", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "MARLEY", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "AP ROYAL", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "JORGE ZAMORANO", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "KRYSPO", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "MEDS", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "Ironside", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Belen 2000", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Wonder", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Tienda Palestino", minutos: 2, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 12, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 2 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 3 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 2 }] },
      { id: "ohiggins", nombre: "O'Higgins", logo: LOGOS.ohiggins, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | ❌ SIN Gol Epicbet", clientes: [{ categoria: "CLUB", nombre: "BC GAME", minutos: 10, bonificados: 0 },{ categoria: "CLUB", nombre: "DOERS", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "DIFOR USADOS", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "DIFOR MG", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "JOMA", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "MEDS", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "MALL PATIO", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "SODIMAC", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "UOH", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "GATORADE", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 10, bonificados: 5 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 10, bonificados: 4 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 5, bonificados: 0 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 1 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 1 }] },
      { id: "huachipato", nombre: "Huachipato", logo: LOGOS.huachipato, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido | APUESTAS ROYAL: 15' CLUB + 12' LIONS | Ciudad del Niño / Fundación Las Rosas / Coaniquem: solo entretiempo", clientes: [{ categoria: "CLUB", nombre: "APUESTAS ROYAL", minutos: 15, bonificados: 0 },{ categoria: "CLUB", nombre: "PF", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "POLPAICO", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "SUEROX", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "PASSLINE", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "COCA COLA CLUB", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "CLINICA ANDES SALUD", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "QUILMES", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "KRYZPO", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "RESONANCIA TALCAHUANO", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "ZAPPING", minutos: 2, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "APUESTAS ROYAL", minutos: 12, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 1 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 2 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 1 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 4, bonificados: 0 },{ categoria: "LIONS", nombre: "LIONS", minutos: 2, bonificados: 0 }] },
      { id: "cobresal", nombre: "Cobresal", logo: LOGOS.cobresal, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "TecRapol", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Rodastock", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Apuestas Royal", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "KS7", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Anakena", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Codelco", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Bailac", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Kwaskar", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Shimin", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "R&R Mining", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Pullman Bus", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Casino Cobres", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Kryzpo", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Unimarc", minutos: 1, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 14, bonificados: 2 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 2 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 4 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 3 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 3 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 2 }] },
      { id: "dconcepcion", nombre: "Dep. Concepción", logo: LOGOS.dconcepcion, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "AP ROYAL", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "KELME", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "EVM", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "KAIYI", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "PASSLINE", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "SANATORIO", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "CMPC", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "CBM", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "SODIMAC", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Epic Bet", minutos: 0, bonificados: 0 },{ categoria: "CLUB", nombre: "Cygnus", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Redbull", minutos: 0, bonificados: 0 },{ categoria: "CLUB", nombre: "EL CONCE", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "CHILE PASTO", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 14, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 0 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 0 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 0 }] },
      { id: "limache", nombre: "Dep. Limache", logo: LOGOS.limache, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "Apuestas Royal", minutos: 3, bonificados: 0.5 },{ categoria: "CLUB", nombre: "Claus 7", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "CVU", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Meds", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Síguenos Instagram", minutos: 1.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Provimarket", minutos: 1.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Rockstar", minutos: 1.5, bonificados: 0.5 },{ categoria: "CLUB", nombre: "Electrolit", minutos: 1.5, bonificados: 0.5 },{ categoria: "CLUB", nombre: "Municipalidad Limache", minutos: 1, bonificados: 0.5 },{ categoria: "CLUB", nombre: "Rivercar", minutos: 1, bonificados: 0.5 },{ categoria: "CLUB", nombre: "BeFood", minutos: 1, bonificados: 0.5 },{ categoria: "CLUB", nombre: "Fuso", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "deporteslimache.cl", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "DJI", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "PF", minutos: 0.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Biozen", minutos: 0.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Aseos Cordillera", minutos: 0.5, bonificados: 0 },{ categoria: "CLUB", nombre: "BienMesabe", minutos: 0.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Tecnofast", minutos: 0.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Carolina Joyas", minutos: 0.5, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 6 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 14, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 4 },{ categoria: "LIONS", nombre: "LIONS", minutos: 0, bonificados: 2 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 2, bonificados: 1 }] },
      { id: "everton", nombre: "Everton", logo: LOGOS.everton, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido | SKECHERS aparece en CLUB y LIONS", clientes: [{ categoria: "CLUB", nombre: "TerraWind", minutos: 8, bonificados: 0 },{ categoria: "CLUB", nombre: "ROYAL", minutos: 7, bonificados: 0 },{ categoria: "CLUB", nombre: "CLARO", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "MALL MARINA", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "SKECHERS", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "Sport Medicina", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "MUNICIPALIDAD", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "MIRO", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "RED BULL", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "COCACOLA", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "AGENCIA TURISMO", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Podemos Verte", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Org. Mundial de la Paz", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "WONDER", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Bidon de agua", minutos: 1, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 12, bonificados: 2 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "Latamwin", minutos: 3, bonificados: 1 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "Epicbet", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "Marathon", minutos: 0, bonificados: 1 }] },
      { id: "uconcepcion", nombre: "U. de Concepción", logo: LOGOS.uconcepcion, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido | COOLBET bonif -2 (ajuste)", clientes: [{ categoria: "CLUB", nombre: "Royal", minutos: 15, bonificados: 0 },{ categoria: "CLUB", nombre: "Zapping", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "PF", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Ticketmaster", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "Meds", minutos: 3, bonificados: -0.5 },{ categoria: "CLUB", nombre: "Coca-Cola", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "Powerade", minutos: 2.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Sabes Deportes", minutos: 2.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Lomo Alemán", minutos: 2.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Termas de Catillo", minutos: 2.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Clínica del Sur", minutos: 2.5, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 2 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 8, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 8, bonificados: -2 },{ categoria: "LIONS", nombre: "Jugabet", minutos: 10, bonificados: 0 },{ categoria: "LIONS", nombre: "1XBET", minutos: 8, bonificados: 0 },{ categoria: "LIONS", nombre: "Epicbet", minutos: 2, bonificados: 0 },{ categoria: "LIONS", nombre: "LatamWin", minutos: 4, bonificados: 0 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 0 },{ categoria: "LIONS", nombre: "Skechers", minutos: 4, bonificados: 0 }] },
      { id: "laserena", nombre: "La Serena", logo: LOGOS.laserena, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido", clientes: [{ categoria: "CLUB", nombre: "Red Salud", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Agua Río Cristal", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Diario El Día", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "FIUME", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Recargo", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Municipalidad LS", minutos: 1.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Apuesta Royal", minutos: 8, bonificados: 0 },{ categoria: "CLUB", nombre: "Tienda Granate", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Escuela", minutos: 4, bonificados: 0 },{ categoria: "CLUB", nombre: "Abonados", minutos: 0, bonificados: 0 },{ categoria: "CLUB", nombre: "Celta", minutos: 1.5, bonificados: 0 },{ categoria: "CLUB", nombre: "Suerox", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Comicon Chile", minutos: 0, bonificados: 0 },{ categoria: "CLUB", nombre: "Newkar", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "AP ROYAL", minutos: 14, bonificados: 2 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 2 },{ categoria: "LIONS", nombre: "Lions", minutos: 0, bonificados: 2 },{ categoria: "LIONS", nombre: "Betchile", minutos: 0, bonificados: 4 },{ categoria: "LIONS", nombre: "Epicbet", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "Marathon", minutos: 0, bonificados: 2 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 2 }] },
      { id: "nublense", nombre: "Ñublense", logo: LOGOS.nublense, estado: "activo", notas: "Kick Off 1T y 2T: COOLBET | Min 45–47 reservados: BETANO | Gol Epicbet incluido | APUESTAS ROYAL: 8' CLUB + 14' LIONS", clientes: [{ categoria: "LIONS", nombre: "BETANO", minutos: 12, bonificados: 4 },{ categoria: "LIONS", nombre: "APUESTAS ROYAL", minutos: 14, bonificados: 0 },{ categoria: "LIONS", nombre: "COOLBET", minutos: 6, bonificados: 3 },{ categoria: "LIONS", nombre: "1XBET", minutos: 6, bonificados: 3 },{ categoria: "LIONS", nombre: "NOVIBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "EPICBET", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "MARATHON", minutos: 0, bonificados: 1 },{ categoria: "LIONS", nombre: "BETCHILE", minutos: 0, bonificados: 4 },{ categoria: "CLUB", nombre: "APUESTAS ROYAL", minutos: 8, bonificados: 0 },{ categoria: "CLUB", nombre: "Andes Salud", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Club Kids", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Coca Cola Club", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Copelec", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Curimapu", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Iansa", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Junreinrich", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Maritano - Toyota", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Marley", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Meds", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Passline", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "PF", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Radio Sabrosona", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Sixtus", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Estafeta", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Sodimac", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Telecom", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Macron", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "Magin", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "TPL", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Mall Vivo", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "PALTAMANÍA", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "Life Fitnes", minutos: 1, bonificados: 0 }] },
      { id: "coquimbo", nombre: "Coquimbo Unido", logo: LOGOS.coquimbo, estado: "futuro", notas: "Futuro cliente", clientes: [] },
      { id: "udechile", nombre: "U. de Chile", logo: LOGOS.udechile, estado: "futuro", notas: "Futuro cliente", clientes: [] },
      { id: "ucatolica", nombre: "U. Católica", logo: LOGOS.ucatolica, estado: "futuro", notas: "Futuro cliente", clientes: [] },
      { id: "colocolo", nombre: "Colo-Colo", logo: LOGOS.colocolo, estado: "futuro", notas: "Futuro cliente", clientes: [] },
    ]
  },
  {
    id: "ecuador", nombre: "Ecuador", bandera: "🇪🇨", activo: true,
    equipos: [
      { id: "leonesdelnorte", nombre: "Leones del Norte", logo: LOGOS.leonesdelnorte, estado: "activo", notas: "", clientes: [{ categoria: "CLUB", nombre: "Betgaliano", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "ISUZU", minutos: 2.5, bonificados: 2 },{ categoria: "CLUB", nombre: "Netlife", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "Farmacias Ecuador", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "Plus Internet", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "San Felipe", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "Seguros Unidos", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "SanFra", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "Cordus", minutos: 1, bonificados: 3 },{ categoria: "CLUB", nombre: "Café Granfé", minutos: 1, bonificados: 3 },{ categoria: "CLUB", nombre: "Computec 1", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "Gustapollo", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "Aseguradora", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "Leones FC", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "ECUABET", minutos: 6, bonificados: 6 },{ categoria: "LIONS", nombre: "1XBET", minutos: 8, bonificados: 9 },{ categoria: "LIONS", nombre: "LIONS", minutos: 4, bonificados: 2 }] },
      { id: "tuniversitario", nombre: "T. Universitario", logo: LOGOS.tuniversitario, estado: "activo", notas: "", clientes: [{ categoria: "CLUB", nombre: "SANFRA", minutos: 2.5, bonificados: 1 },{ categoria: "CLUB", nombre: "SANFRA WOLFITO", minutos: 1.25, bonificados: 2 },{ categoria: "CLUB", nombre: "FORBET", minutos: 2.5, bonificados: 1 },{ categoria: "CLUB", nombre: "BOMAN", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "PLASTIVILL", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "AVIPAZ", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "MATRIX", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "OPTICA INT", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "IMPOEXITO", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "MIRACLE", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "AURUM", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "HOTEL EMPERADOR", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "EXTREME", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "PUERTA COLOR", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "GUTMAN", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "MARTINIZING", minutos: 2, bonificados: 2 },{ categoria: "CLUB", nombre: "FISIO", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "AMA", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "NAMING", minutos: 1.5, bonificados: 2 },{ categoria: "CLUB", nombre: "PATATE LODGE", minutos: 2, bonificados: 2 },{ categoria: "LIONS", nombre: "ECUABET", minutos: 5, bonificados: 4 },{ categoria: "LIONS", nombre: "1XBET", minutos: 8, bonificados: 8 },{ categoria: "LIONS", nombre: "LIONS", minutos: 4, bonificados: 1 }] },
      { id: "emelec", nombre: "Emelec", logo: LOGOS.emelec, estado: "activo", notas: "Cruz Azul: SALIDA DEL EQUIPO (pendiente actualización) | UBE: 0.4 min", clientes: [{ categoria: "CLUB", nombre: "Adidas", minutos: 8, bonificados: 2 },{ categoria: "CLUB", nombre: "Almacenes España", minutos: 1, bonificados: 1 },{ categoria: "CLUB", nombre: "Santa Priscila", minutos: 3, bonificados: 1 },{ categoria: "CLUB", nombre: "Rival", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Pilsener", minutos: 6, bonificados: 1 },{ categoria: "CLUB", nombre: "Pharmacys", minutos: 1, bonificados: 1 },{ categoria: "CLUB", nombre: "Cruz Azul ⚠️", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Telconet", minutos: 1, bonificados: 1 },{ categoria: "CLUB", nombre: "Yiga 5", minutos: 1, bonificados: 1 },{ categoria: "CLUB", nombre: "Rubasa", minutos: 1, bonificados: 1 },{ categoria: "CLUB", nombre: "UBE", minutos: 0.4, bonificados: 1 },{ categoria: "CLUB", nombre: "Ferjem", minutos: 1, bonificados: 1 },{ categoria: "CLUB", nombre: "Hospital de Especialidades", minutos: 2, bonificados: 1 },{ categoria: "CLUB", nombre: "Claro", minutos: 3, bonificados: 1 },{ categoria: "CLUB", nombre: "Electrolit", minutos: 2, bonificados: 1 },{ categoria: "LIONS", nombre: "ECUABET", minutos: 5, bonificados: 4 },{ categoria: "LIONS", nombre: "Banco Pichincha", minutos: 3, bonificados: 1 },{ categoria: "LIONS", nombre: "SPORTBET", minutos: 5, bonificados: 4 },{ categoria: "LIONS", nombre: "1XBET", minutos: 8, bonificados: 6 },{ categoria: "LIONS", nombre: "LIONS", minutos: 4, bonificados: 0 }] },
    ]
  },
  {
    id: "peru", nombre: "Perú", bandera: "🇵🇪", activo: true,
    equipos: [
      { id: "universitario", nombre: "Universitario", logo: LOGOS.universitario, estado: "activo", notas: "APUESTA TOTAL: 3' CLUB + 34' LIONS", clientes: [{ categoria: "CLUB", nombre: "JETOUR", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "MARATHON", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "BITEL", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "MOVISUN", minutos: 3, bonificados: 0 },{ categoria: "CLUB", nombre: "OPALUX", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "ALTOS", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "ELECTROLIGHT", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "KLAR", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "SKY CLUB", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "MODA", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "BACKUS", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "ESAN", minutos: 1, bonificados: 0 },{ categoria: "CLUB", nombre: "APUESTA TOTAL", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "APUESTA TOTAL", minutos: 34, bonificados: 0 },{ categoria: "LIONS", nombre: "PROSEGUR", minutos: 5, bonificados: 2 },{ categoria: "LIONS", nombre: "JETSMART", minutos: 5, bonificados: 2 },{ categoria: "LIONS", nombre: "IPESA", minutos: 4, bonificados: 2 },{ categoria: "LIONS", nombre: "FRIDAYS", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "SKY", minutos: 5, bonificados: 0 },{ categoria: "LIONS", nombre: "CHEMA", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "LIONS", minutos: 3, bonificados: 0 },{ categoria: "LIONS", nombre: "ICOCERT", minutos: 1.5, bonificados: 0 }] },
      { id: "alianzasullana", nombre: "Alianza Atlético Sullana", logo: LOGOS.alianzasullana, estado: "activo", notas: "", clientes: [{ categoria: "CLUB", nombre: "SPORADE", minutos: 2, bonificados: 0 },{ categoria: "CLUB", nombre: "NOBAVISION", minutos: 5, bonificados: 0 },{ categoria: "CLUB", nombre: "WALON", minutos: 6, bonificados: 0 },{ categoria: "CLUB", nombre: "MANITSA", minutos: 7, bonificados: 0 },{ categoria: "LIONS", nombre: "BETANO", minutos: 27, bonificados: 0 },{ categoria: "LIONS", nombre: "FRIDAYS", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "IPESA", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "PROSEGUR", minutos: 6, bonificados: 0 },{ categoria: "LIONS", nombre: "LIONS", minutos: 8, bonificados: 0 },{ categoria: "LIONS", nombre: "SMART GOAL", minutos: 8, bonificados: 0 },{ categoria: "LIONS", nombre: "JETSMART", minutos: 7, bonificados: 0 },{ categoria: "LIONS", nombre: "SKY", minutos: 6, bonificados: 0 }] },
      { id: "fccajamarca", nombre: "FC Cajamarca", logo: LOGOS.fccajamarca, estado: "vallasfijas", notas: "Solo vallas fijas por ahora", clientes: [] },
      { id: "juanpablo2", nombre: "Juan Pablo II", logo: "", estado: "vallasfijas", notas: "Solo vallas fijas por ahora", clientes: [] },
    ]
  },
  { id: "argentina", nombre: "Argentina", bandera: "🇦🇷", activo: false, equipos: [] },
  { id: "paraguay", nombre: "Paraguay", bandera: "🇵🇾", activo: false, equipos: [] },
  { id: "uruguay", nombre: "Uruguay", bandera: "🇺🇾", activo: false, equipos: [] },
  { id: "mexico", nombre: "México", bandera: "🇲🇽", activo: false, equipos: [] },
  { id: "bolivia", nombre: "Bolivia", bandera: "🇧🇴", activo: false, equipos: [] },
  { id: "colombia", nombre: "Colombia", bandera: "🇨🇴", activo: false, equipos: [] },
  { id: "venezuela", nombre: "Venezuela", bandera: "🇻🇪", activo: false, equipos: [] },
  { id: "brasil", nombre: "Brasil", bandera: "🇧🇷", activo: false, equipos: [] },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function calcStats(clientes) {
  const totalLions = clientes.filter(c => c.categoria === "LIONS").reduce((s, c) => s + c.minutos, 0);
  const totalClub = clientes.filter(c => c.categoria === "CLUB").reduce((s, c) => s + c.minutos, 0);
  const totalOtros = clientes.filter(c => c.categoria === "OTROS").reduce((s, c) => s + c.minutos, 0);
  const totalBonificados = clientes.reduce((s, c) => s + Math.max(0, c.bonificados), 0);
  const totalReal = totalLions + totalClub + totalOtros;
  const disponibles = Math.max(0, 90 - totalReal);
  return { totalLions, totalClub, totalOtros, totalBonificados, totalReal, disponibles };
}

function getStatus(equipo) {
  if (equipo.estado === "futuro") return "futuro";
  if (equipo.estado === "vallasfijas") return "vallas";
  if (equipo.estado === "pendiente") return "pendiente";
  const { totalReal } = calcStats(equipo.clientes);
  if (totalReal > 90) return "over";
  if (totalReal >= 90) return "full";
  if (totalReal >= 75) return "almost";
  return "available";
}

function statusColor(status, t) {
  return { futuro: t.muted, vallas: t.club, pendiente: t.muted, over: t.gray, full: t.amber, almost: t.amber, available: t.green }[status] || t.muted;
}

function statusLabel(status, disponibles) {
  return { futuro: "Futuro cliente", vallas: "Vallas fijas", pendiente: "Pendiente", over: "Sobrevendido", full: "Completo", almost: `${fmt(disponibles)}' disponibles`, available: `${fmt(disponibles)}' disponibles` }[status] || "";
}

function fmt(n) {
  if (n === undefined || n === null) return "0";
  return n % 1 === 0 ? `${n}` : `${parseFloat(n.toFixed(1))}`;
}

const FONT = "'Montserrat', sans-serif";
const PASSWORD = "lions2026";

// ─────────────────────────────────────────────
// ANIMATED BAR
// ─────────────────────────────────────────────
function AnimatedBar({ pct, color, height = 6, delay = 0 }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 100 + delay); return () => clearTimeout(t); }, [pct, delay]);
  return (
    <div style={{ height, borderRadius: height / 2, background: "#00000015", overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${w}%`, background: color, borderRadius: height / 2, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// STACKED BAR
// ─────────────────────────────────────────────
function StackedBar({ lions, club, total = 90, t }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const ti = setTimeout(() => setMounted(true), 150); return () => clearTimeout(ti); }, []);
  const pLions = Math.min(100, (lions / total) * 100);
  const pClub = Math.min(100 - pLions, (club / total) * 100);
  return (
    <div style={{ height: 8, borderRadius: 4, background: "#00000012", overflow: "hidden", display: "flex" }}>
      <div style={{ width: mounted ? `${pLions}%` : "0%", background: t.lions, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1)" }} />
      <div style={{ width: mounted ? `${pClub}%` : "0%", background: t.club, transition: "width 0.7s cubic-bezier(0.4,0,0.2,1) 0.1s" }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
function Login({ onLogin, t, dark }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(false); const [shake, setShake] = useState(false);
  const handle = () => {
    if (pw === PASSWORD) onLogin();
    else { setErr(true); setShake(true); setTimeout(() => setShake(false), 500); }
  };
  return (
    <div style={{ minHeight: "100vh", background: t.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;0,800;0,900;1,400&display=swap" rel="stylesheet" />
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 20, padding: "48px 40px", width: 320, textAlign: "center", boxShadow: t.shadow }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <LionsSVG height={36} dark={dark} />
        </div>
        <div style={{ fontSize: 10, color: t.muted, marginBottom: 36, fontWeight: 600, letterSpacing: 4 }}>DASHBOARD · 2026</div>
        <input type="password" placeholder="Contraseña de acceso" value={pw}
          onChange={e => { setPw(e.target.value); setErr(false); }}
          onKeyDown={e => e.key === "Enter" && handle()}
          style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `2px solid ${err ? t.accent : t.border}`, background: t.bg, color: t.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: FONT, animation: shake ? "shake 0.4s" : "none" }} />
        {err && <div style={{ color: t.accent, fontSize: 11, marginTop: 6, fontWeight: 600 }}>Contraseña incorrecta</div>}
        <button onClick={handle} style={{ marginTop: 14, width: "100%", padding: "13px", borderRadius: 10, border: "none", background: t.accent, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", fontFamily: FONT, letterSpacing: 1 }}>INGRESAR</button>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// TEAM CARD (expandable)
// ─────────────────────────────────────────────
function TeamCard({ equipo, t, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const status = getStatus(equipo);
  const stats = calcStats(equipo.clientes);
  const sc = statusColor(status, t);
  const sl = statusLabel(status, stats.disponibles);
  const disabled = status === "futuro";
  const isSpecial = status === "vallas" || status === "pendiente";
  const top3Lions = [...equipo.clientes].filter(c => c.categoria === "LIONS" && c.minutos > 0).sort((a, b) => b.minutos - a.minutos).slice(0, 3);
  const maxLions = top3Lions[0]?.minutos || 1;

  return (
    <div style={{ background: t.card, border: `1.5px solid ${expanded ? sc : t.border}`, borderRadius: 14, overflow: "hidden", opacity: disabled ? 0.3 : 1, transition: "border-color 0.2s, box-shadow 0.2s", boxShadow: expanded ? `0 4px 20px ${sc}20` : t.shadow, fontFamily: FONT }}>
      {/* Card header */}
      <div style={{ padding: "14px 14px 10px", cursor: disabled ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10 }}
        onClick={() => !disabled && !isSpecial && onOpen()}>
        {/* Logo */}
        <div style={{ width: 40, height: 40, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {equipo.logo
            ? <img src={equipo.logo} alt="" style={{ width: 38, height: 38, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
            : <div style={{ width: 38, height: 38, borderRadius: "50%", background: t.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚽</div>
          }
        </div>
        {/* Name + status */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: t.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{equipo.nombre}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: sc, letterSpacing: 0.5, marginTop: 1 }}>{sl}</div>
        </div>
        {/* Quick stats */}
        {!disabled && !isSpecial && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: t.muted, fontWeight: 700 }}>LIONS</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: t.lions }}>{fmt(stats.totalLions)}'</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 9, color: t.muted, fontWeight: 700 }}>CLUB</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: t.club }}>{fmt(stats.totalClub)}'</div>
            </div>
          </div>
        )}
        {isSpecial && <div style={{ fontSize: 11, color: sc, fontWeight: 700 }}>{status === "vallas" ? "📍" : "⏳"}</div>}
      </div>

      {/* Stacked bar */}
      {!disabled && !isSpecial && (
        <div style={{ padding: "0 14px 10px" }}>
          <StackedBar lions={stats.totalLions} club={stats.totalClub} t={t} />
          {/* Top 3 LIONS preview */}
          {top3Lions.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {top3Lions.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <div style={{ fontSize: 9, color: t.muted, fontWeight: 600, width: 14, textAlign: "right" }}>{fmt(c.minutos)}'</div>
                  <div style={{ flex: 1 }}>
                    <AnimatedBar pct={(c.minutos / maxLions) * 100} color={t.lions} height={3} delay={i * 80} />
                  </div>
                  <div style={{ fontSize: 9, color: t.sub, fontWeight: 600, width: 70, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{c.nombre}</div>
                </div>
              ))}
            </div>
          )}
          {/* Expand / Open buttons */}
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => setExpanded(!expanded)} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent", color: t.muted, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT, letterSpacing: 0.5 }}>
              {expanded ? "▲ MENOS" : "▼ DETALLE"}
            </button>
            <button onClick={onOpen} style={{ flex: 1, padding: "5px 0", borderRadius: 7, border: `1px solid ${t.accent}`, background: `${t.accent}10`, color: t.accent, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT, letterSpacing: 0.5 }}>
              VER COMPLETO →
            </button>
          </div>
        </div>
      )}

      {/* Expanded panel */}
      {expanded && !disabled && !isSpecial && (
        <div style={{ borderTop: `1px solid ${t.border}`, padding: "10px 14px 14px", background: t.bg }}>
          {["LIONS", "CLUB"].map(cat => {
            const items = equipo.clientes.filter(c => c.categoria === cat && c.minutos > 0).sort((a, b) => b.minutos - a.minutos);
            const maxM = items[0]?.minutos || 1;
            const color = cat === "LIONS" ? t.lions : t.club;
            return items.length > 0 ? (
              <div key={cat} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, fontWeight: 800, color, letterSpacing: 2, marginBottom: 5 }}>{cat}</div>
                {items.map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <div style={{ fontSize: 10, color, fontWeight: 800, width: 26, textAlign: "right" }}>{fmt(c.minutos)}'</div>
                    <div style={{ flex: 1 }}><AnimatedBar pct={(c.minutos / maxM) * 100} color={color} height={4} delay={i * 40} /></div>
                    <div style={{ fontSize: 10, color: t.sub, width: 90, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{c.nombre}</div>
                    {c.bonificados > 0 && <div style={{ fontSize: 9, color: t.accent, background: `${t.accent}15`, padding: "1px 5px", borderRadius: 3, fontWeight: 700, whiteSpace: "nowrap" }}>+{fmt(c.bonificados)}'</div>}
                  </div>
                ))}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// TEAM DETAIL (full view)
// ─────────────────────────────────────────────
function TeamDetail({ equipo, t, onBack }) {
  const [tab, setTab] = useState("LIONS");
  const stats = calcStats(equipo.clientes);
  const status = getStatus(equipo);
  const sc = statusColor(status, t);
  const sl = statusLabel(status, stats.disponibles);
  const tabColors = { LIONS: t.lions, CLUB: t.club, OTROS: t.muted };
  const tabItems = tab === "LIONS" ? equipo.clientes.filter(c => c.categoria === "LIONS") : tab === "CLUB" ? equipo.clientes.filter(c => c.categoria === "CLUB") : equipo.clientes.filter(c => c.categoria === "OTROS");
  const sortedItems = [...tabItems].sort((a, b) => b.minutos - a.minutos);
  const maxM = sortedItems[0]?.minutos || 1;
  const pLions = Math.min(100, (stats.totalLions / 90) * 100);
  const pClub = Math.min(100 - pLions, (stats.totalClub / 90) * 100);

  return (
    <div style={{ animation: "fadeIn 0.25s", fontFamily: FONT }}>
      <button onClick={onBack} style={{ background: "none", border: `1px solid ${t.border}`, color: t.muted, borderRadius: 8, padding: "6px 14px", cursor: "pointer", marginBottom: 16, fontSize: 11, fontFamily: FONT, fontWeight: 700, letterSpacing: 1 }}>← VOLVER</button>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        {equipo.logo ? <img src={equipo.logo} alt="" style={{ width: 56, height: 56, objectFit: "contain" }} onError={e => e.target.style.display = "none"} /> : <div style={{ width: 56, height: 56, borderRadius: "50%", background: t.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚽</div>}
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, color: t.text, lineHeight: 1.1 }}>{equipo.nombre}</div>
          <div style={{ fontSize: 11, color: sc, fontWeight: 800, letterSpacing: 2, marginTop: 3 }}>{sl.toUpperCase()}</div>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        {[
          { label: "LIONS", val: `${fmt(stats.totalLions)}'`, color: t.lions },
          { label: "CLUB", val: `${fmt(stats.totalClub)}'`, color: t.club },
          { label: "MIN. DISPONIBLES", val: `${fmt(stats.disponibles)}'`, color: t.green },
          { label: "BONIFICADOS", val: `${fmt(stats.totalBonificados)}'`, color: t.accent },
          { label: "TOTAL REAL", val: `${fmt(stats.totalReal)}'`, color: sc },
          { label: "MARGEN", val: stats.totalReal <= 90 ? `${fmt(90 - stats.totalReal)}'` : `+${fmt(stats.totalReal - 90)}'`, color: stats.totalReal <= 90 ? t.green : t.gray },
        ].map((k, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1.5, marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Occupation bar */}
      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 14, boxShadow: t.shadow }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: t.muted, fontWeight: 800, letterSpacing: 1, marginBottom: 8 }}>
          <span>OCUPACIÓN 90'</span><span style={{ color: sc }}>{fmt(stats.totalReal)}' / 90'</span>
        </div>
        <div style={{ height: 10, borderRadius: 5, background: t.border, overflow: "hidden", display: "flex" }}>
          <div style={{ width: `${pLions}%`, background: t.lions, transition: "width 0.7s" }} />
          <div style={{ width: `${pClub}%`, background: t.club, transition: "width 0.7s 0.1s" }} />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 10, fontWeight: 700 }}>
          <span style={{ color: t.lions }}>■ Lions {fmt(stats.totalLions)}'</span>
          <span style={{ color: t.club }}>■ Club {fmt(stats.totalClub)}'</span>
          <span style={{ color: t.green }}>■ Libre {fmt(stats.disponibles)}'</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["LIONS", "CLUB", "OTROS"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ padding: "7px 16px", borderRadius: 8, border: `2px solid ${tab === tb ? tabColors[tb] : t.border}`, background: tab === tb ? `${tabColors[tb]}15` : "transparent", color: tab === tb ? tabColors[tb] : t.muted, cursor: "pointer", fontWeight: 800, fontSize: 11, letterSpacing: 1, fontFamily: FONT, transition: "all 0.15s" }}>
            {tb} <span style={{ fontWeight: 400, opacity: 0.7 }}>{fmt(tab === "LIONS" ? stats.totalLions : tab === "CLUB" ? stats.totalClub : stats.totalOtros)}'</span>
          </button>
        ))}
      </div>

      {/* Client list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sortedItems.length === 0 && <div style={{ color: t.muted, textAlign: "center", padding: 24, fontSize: 13 }}>Sin clientes en esta categoría</div>}
        {sortedItems.map((c, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 10, padding: "10px 13px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
              <div style={{ fontWeight: 700, color: t.text, fontSize: 13 }}>{c.nombre}</div>
              <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                {c.bonificados !== 0 && <span style={{ fontSize: 10, fontWeight: 700, color: c.bonificados > 0 ? t.accent : t.gray, background: c.bonificados > 0 ? `${t.accent}15` : `${t.gray}15`, padding: "2px 7px", borderRadius: 4 }}>{c.bonificados > 0 ? "+" : ""}{fmt(c.bonificados)}' bonif.</span>}
                <span style={{ fontWeight: 900, color: tabColors[tab], fontSize: 16 }}>{fmt(c.minutos)}'</span>
              </div>
            </div>
            <AnimatedBar pct={(c.minutos / maxM) * 100} color={tabColors[tab]} height={4} delay={i * 30} />
          </div>
        ))}
      </div>

      {equipo.notas && <div style={{ marginTop: 14, background: `${t.accent}0c`, border: `1px solid ${t.accent}30`, borderRadius: 10, padding: "10px 13px", fontSize: 12, color: t.sub, fontWeight: 600, lineHeight: 1.7 }}>✅ {equipo.notas}</div>}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// INVESTORS VIEW
// ─────────────────────────────────────────────
function InvestorsView({ pais, t }) {
  const [sortBy, setSortBy] = useState("total");
  const investorMap = {};
  pais.equipos.forEach(eq => {
    eq.clientes.filter(c => c.categoria === "LIONS" && c.minutos > 0).forEach(c => {
      const key = c.nombre.toUpperCase().trim();
      if (!investorMap[key]) investorMap[key] = { nombre: c.nombre, equipos: [], total: 0 };
      investorMap[key].equipos.push({ equipo: eq.nombre, minutos: c.minutos, bonificados: c.bonificados });
      investorMap[key].total += c.minutos;
    });
  });
  const investors = Object.values(investorMap).filter(i => i.nombre.toUpperCase() !== "LIONS").sort((a, b) => sortBy === "total" ? b.total - a.total : b.equipos.length - a.equipos.length);
  const maxTotal = investors[0]?.total || 1;

  return (
    <div style={{ animation: "fadeIn 0.25s", fontFamily: FONT }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, color: t.text }}>📊 Inversores LIONS</div>
          <div style={{ fontSize: 11, color: t.muted, fontWeight: 400, marginTop: 2 }}>Clientes gestionados por Lions · {pais.bandera} {pais.nombre}</div>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {[["total", "Por minutos"], ["equipos", "Por equipos"]].map(([key, label]) => (
            <button key={key} onClick={() => setSortBy(key)} style={{ padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${sortBy === key ? t.accent : t.border}`, background: sortBy === key ? `${t.accent}12` : "transparent", color: sortBy === key ? t.accent : t.muted, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: FONT }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {investors.map((inv, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: "12px 14px", boxShadow: t.shadow }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: t.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff" }}>{i + 1}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: t.text }}>{inv.nombre}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: t.lions }}>{fmt(inv.total)}'</div>
                <div style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>{inv.equipos.length} equipo{inv.equipos.length !== 1 ? "s" : ""}</div>
              </div>
            </div>
            <AnimatedBar pct={(inv.total / maxTotal) * 100} color={t.lions} height={5} delay={i * 50} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8 }}>
              {inv.equipos.map((e, j) => (
                <span key={j} style={{ fontSize: 10, color: t.sub, background: t.pill, padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>
                  {e.equipo} <span style={{ fontWeight: 800, color: t.lions }}>{fmt(e.minutos)}'</span>
                </span>
              ))}
            </div>
          </div>
        ))}
        {investors.length === 0 && <div style={{ color: t.muted, textAlign: "center", padding: 40, fontSize: 13 }}>Sin datos de inversores para este país</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COUNTRY VIEW
// ─────────────────────────────────────────────
function CountryView({ pais, t, onSelectTeam }) {
  const [sort, setSort] = useState("default");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState("equipos"); // equipos | inversores

  const equiposActivos = pais.equipos.filter(e => e.estado === "activo");
  const sortedEquipos = useMemo(() => {
    let list = [...pais.equipos];
    if (filter === "available") list = list.filter(e => { const s = getStatus(e); return s === "available" || s === "almost"; });
    if (filter === "full") list = list.filter(e => getStatus(e) === "full");
    if (filter === "over") list = list.filter(e => getStatus(e) === "over");
    if (sort === "disponibles") list.sort((a, b) => calcStats(b.clientes).disponibles - calcStats(a.clientes).disponibles);
    if (sort === "lions") list.sort((a, b) => calcStats(b.clientes).totalLions - calcStats(a.clientes).totalLions);
    if (sort === "total") list.sort((a, b) => calcStats(b.clientes).totalReal - calcStats(a.clientes).totalReal);
    return list;
  }, [pais, sort, filter]);

  const totalLions = equiposActivos.reduce((s, e) => s + calcStats(e.clientes).totalLions, 0);
  const totalClub = equiposActivos.reduce((s, e) => s + calcStats(e.clientes).totalClub, 0);
  const totalDisp = equiposActivos.reduce((s, e) => s + calcStats(e.clientes).disponibles, 0);

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Country summary */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: t.text }}>{pais.bandera} {pais.nombre}</div>
          <div style={{ fontSize: 11, color: t.muted, marginTop: 2, fontWeight: 400 }}>{equiposActivos.length} equipos activos · Temporada 2026</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "center", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1 }}>TOTAL LIONS</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.lions }}>{fmt(totalLions)}'</div>
          </div>
          <div style={{ textAlign: "center", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1 }}>TOTAL CLUB</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.club }}>{fmt(totalClub)}'</div>
          </div>
          <div style={{ textAlign: "center", background: t.card, border: `1px solid ${t.border}`, borderRadius: 8, padding: "6px 12px", boxShadow: t.shadow }}>
            <div style={{ fontSize: 8, color: t.muted, fontWeight: 800, letterSpacing: 1 }}>DISPONIBLES</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: t.green }}>{fmt(totalDisp)}'</div>
          </div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {[["equipos", "🏟️ Equipos"], ["inversores", "📊 Inversores LIONS"]].map(([key, label]) => (
          <button key={key} onClick={() => setView(key)} style={{ padding: "7px 14px", borderRadius: 8, border: `1.5px solid ${view === key ? t.accent : t.border}`, background: view === key ? `${t.accent}12` : "transparent", color: view === key ? t.accent : t.muted, cursor: "pointer", fontSize: 11, fontWeight: 800, fontFamily: FONT, letterSpacing: 0.5 }}>
            {label}
          </button>
        ))}
      </div>

      {view === "inversores" ? <InvestorsView pais={pais} t={t} /> : (
        <>
          {/* Filters & sort */}
          <div style={{ display: "flex", gap: 5, marginBottom: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[["all", "Todos"], ["available", "Disponibles"], ["full", "Completos"], ["over", "Sobrevendidos"]].map(([key, label]) => (
                <button key={key} onClick={() => setFilter(key)} style={{ padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${filter === key ? t.accent : t.border}`, background: filter === key ? `${t.accent}12` : "transparent", color: filter === key ? t.accent : t.muted, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: FONT }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: t.muted, fontWeight: 600 }}>Ordenar:</span>
              {[["default", "Default"], ["disponibles", "Disponibles ↓"], ["lions", "Lions ↓"], ["total", "Total ↓"]].map(([key, label]) => (
                <button key={key} onClick={() => setSort(key)} style={{ padding: "5px 10px", borderRadius: 7, border: `1.5px solid ${sort === key ? t.accent : t.border}`, background: sort === key ? `${t.accent}12` : "transparent", color: sort === key ? t.accent : t.muted, cursor: "pointer", fontSize: 10, fontWeight: 700, fontFamily: FONT }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {sortedEquipos.map(eq => <TeamCard key={eq.id} equipo={eq} t={t} onOpen={() => onSelectTeam(eq.id)} />)}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(false);
  const [logged, setLogged] = useState(false);
  const [paisId, setPaisId] = useState("chile");
  const [equipoId, setEquipoId] = useState(null);

  const t = dark ? T.dark : T.light;
  const pais = PAISES.find(p => p.id === paisId);
  const equipo = pais?.equipos.find(e => e.id === equipoId);

  if (!logged) return <Login onLogin={() => setLogged(true)} t={t} dark={dark} />;

  return (
    <div style={{ minHeight: "100vh", background: t.bg, color: t.text, fontFamily: FONT }}>
      <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;0,800;0,900;1,400&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <div style={{ background: t.header, borderBottom: `1px solid ${t.headerBorder}`, padding: "0 16px", position: "sticky", top: 0, zIndex: 100, boxShadow: dark ? "none" : t.shadow }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <LionsSVG height={28} dark={dark} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: dark ? "rgba(255,255,255,0.5)" : t.muted, letterSpacing: 3 }}>DASHBOARD 2026</div>
            <div style={{ width: 1, height: 20, background: dark ? "rgba(255,255,255,0.2)" : t.border }} />
            <button onClick={() => setDark(!dark)} style={{ background: dark ? "rgba(255,255,255,0.1)" : t.bg, border: `1px solid ${dark ? "rgba(255,255,255,0.2)" : t.border}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: dark ? "#fff" : t.text, fontSize: 11, fontFamily: FONT, fontWeight: 700 }}>
              {dark ? "☀️" : "🌙"}
            </button>
          </div>
        </div>
      </div>

      {/* COUNTRY NAV */}
      <div style={{ background: t.navBg, borderBottom: `2px solid ${t.navBorder}`, overflowX: "auto" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", padding: "0 16px" }}>
          {PAISES.map(p => (
            <button key={p.id} onClick={() => { if (p.activo) { setPaisId(p.id); setEquipoId(null); } }}
              style={{ padding: "10px 14px", border: "none", borderBottom: `3px solid ${p.id === paisId && p.activo ? t.accent : "transparent"}`, background: "transparent", color: p.activo ? (p.id === paisId ? t.accent : t.text) : t.muted, cursor: p.activo ? "pointer" : "not-allowed", opacity: p.activo ? 1 : 0.3, fontWeight: p.id === paisId ? 800 : 500, fontSize: 12, whiteSpace: "nowrap", fontFamily: FONT, transition: "all 0.15s", marginBottom: -2 }}>
              {p.bandera} {p.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px" }}>
        {equipo
          ? <TeamDetail equipo={equipo} t={t} onBack={() => setEquipoId(null)} />
          : <CountryView pais={pais} t={t} onSelectTeam={id => setEquipoId(id)} />
        }
      </div>
    </div>
  );
}
