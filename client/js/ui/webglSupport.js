export const markWebGLUnavailable = () => {
  document.documentElement.classList.add('no-webgl');
};

let cachedWebGLSupport;

export const isWebGLSupported = () => {
  if (typeof cachedWebGLSupport !== 'undefined') {
    return cachedWebGLSupport;
  }

  try {
    const canvas = document.createElement('canvas');
    const contexts = ['webgl2', 'webgl', 'experimental-webgl'];
    cachedWebGLSupport =
      'WebGLRenderingContext' in window &&
      contexts.some((name) => canvas.getContext(name));
  } catch (err) {
    cachedWebGLSupport = false;
  }

  if (!cachedWebGLSupport) {
    markWebGLUnavailable();
  }

  return cachedWebGLSupport;
};

const toHexColor = (value) => `#${value.toString(16).padStart(6, '0')}`;

export const applyFallbackIcon = (container, element, colorValue) => {
  if (!container) return;
  container.classList.add('webgl-fallback-icon');
  container.setAttribute('data-element', element);
  if (colorValue) {
    container.style.setProperty('--fallback-color', toHexColor(colorValue));
  }

  if (!container.querySelector('.fallback-letter')) {
    const label = document.createElement('span');
    label.className = 'fallback-letter';
    label.textContent = element ? element.charAt(0).toUpperCase() : '?';
    container.innerHTML = '';
    container.appendChild(label);
  }
};
