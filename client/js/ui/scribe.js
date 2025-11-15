import {
  getElementGeometry,
  getElementColor,
  getRandomPrompt,
  formatDate,
  getAllElements,
  getElementDetails,
  getNatureAction
} from '../core/pure.js';
import { handleElementIconClick, handleEntryControlClick } from '../app/commander.js';
import { isWebGLSupported, applyFallbackIcon } from './webglSupport.js';

const WEBGL_SUPPORTED = isWebGLSupported() && typeof THREE !== 'undefined';
const positionStatusMessage = (statusEl) => {
  if (!statusEl) return;
  const page = statusEl.closest('.page');
  if (!page) return;
  const saveBtn = page.querySelector('.save-btn');

  if (saveBtn) {
    const saveRect = saveBtn.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    const offset = saveRect.bottom - pageRect.top + 12;
    statusEl.style.top = `${offset}px`;
  } else {
    statusEl.style.top = '';
  }
};

export const switchPage = (element) => {
  const pages = document.querySelectorAll('.page');
  pages.forEach((page) => {
    if (page.dataset.element === element) {
      page.classList.add('active');
    } else {
      page.classList.remove('active');
    }
  });
};

export const updatePrompt = (element) => {
  const page = document.querySelector(`#${element}-page`);
  const promptEl = page.querySelector('.prompt-text');

  if (promptEl) {
    promptEl.textContent = getRandomPrompt(element);
  }
};

export const updateRecordButton = (btn, isRecording) => {
  if (isRecording) {
    btn.classList.add('recording');
    btn.setAttribute('aria-label', 'Stop recording');
  } else {
    btn.classList.remove('recording');
    btn.setAttribute('aria-label', 'Record voice note');
  }
};

export const toggleSidebar = (open) => {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.sidebar-toggle');
  const backdrop = document.querySelector('.sidebar-backdrop');
  const allActiveControls = document.querySelectorAll('.entry-item.active-touch');
  allActiveControls.forEach((el) => el.classList.remove('active-touch'));

  if (open) {
    sidebar.classList.add('open');
    toggle.classList.add('open');
    if (backdrop) backdrop.classList.add('visible');
  } else {
    sidebar.classList.remove('open');
    toggle.classList.remove('open');
    if (backdrop) backdrop.classList.remove('visible');
    document.getElementById('folder-list').style.display = 'none';
  }
};

export const toggleElementPanel = (open) => {
  const panel = document.querySelector('.element-panel');
  const toggle = document.querySelector('.element-panel-toggle');
  const backdrop = document.querySelector('.element-panel-backdrop');
  if (!panel) return;

  if (open) {
    panel.classList.add('open');
    toggle?.classList.add('open');
    backdrop?.classList.add('visible');
    panel.setAttribute('aria-hidden', 'false');
  } else {
    panel.classList.remove('open');
    toggle?.classList.remove('open');
    backdrop?.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
  }
};

const natureHintTimeouts = new WeakMap();

export const attachNatureHint = (container, element) => {
  if (!container || container.dataset.natureHintBound === 'true') return;
  const hintText = getNatureAction(element);
  if (!hintText) return;
  container.dataset.natureHintBound = 'true';

  let hintEl = container.querySelector('.nature-hint');
  if (!hintEl) {
    hintEl = document.createElement('div');
    hintEl.className = 'nature-hint';
    hintEl.setAttribute('role', 'status');
    hintEl.textContent = hintText;
    container.appendChild(hintEl);
  } else {
    hintEl.textContent = hintText;
  }

  const adjustHintPosition = () => {
    hintEl.style.setProperty('--hint-shift', '0px');
    const rect = hintEl.getBoundingClientRect();
    const padding = 12;
    let shift = 0;
    if (rect.left < padding) {
      shift = padding - rect.left;
    } else if (rect.right > window.innerWidth - padding) {
      shift = (window.innerWidth - padding) - rect.right;
    }
    hintEl.style.setProperty('--hint-shift', `${shift}px`);
  };

  const showHint = () => {
    hintEl.dataset.visible = 'true';
    requestAnimationFrame(adjustHintPosition);
    if (natureHintTimeouts.has(container)) {
      clearTimeout(natureHintTimeouts.get(container));
    }
    const timeout = setTimeout(() => {
      hintEl.dataset.visible = 'false';
      natureHintTimeouts.delete(container);
    }, 6500);
    natureHintTimeouts.set(container, timeout);
  };

  const hideHint = () => {
    hintEl.dataset.visible = 'false';
    if (natureHintTimeouts.has(container)) {
      clearTimeout(natureHintTimeouts.get(container));
      natureHintTimeouts.delete(container);
    }
  };

  container.addEventListener('mouseenter', showHint);
  container.addEventListener('mouseleave', hideHint);
  container.addEventListener('click', showHint);
};

/**
 * Shows a transient status message beneath the save button.
 * @param {HTMLElement} page - Element page container.
 * @param {string} message - Message to show.
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Message style.
 * @param {{compact?:boolean, autoHide?:boolean, duration?:number}} [options] - UI tweaks.
 */
export const showStatusMessage = (page, message, type = 'info', options = {}) => {
  if (!page) return;
  let statusEl = page.querySelector('.status-message');
  if (!statusEl) {
    statusEl = document.createElement('p');
    statusEl.className = 'status-message';
    statusEl.setAttribute('aria-live', 'polite');
    const saveBtn = page.querySelector('.save-btn');
    if (saveBtn) {
      saveBtn.insertAdjacentElement('afterend', statusEl);
    } else {
      page.appendChild(statusEl);
    }
  }
  statusEl.dataset.type = type;
  if (options.compact) {
    statusEl.classList.add('status-message--compact');
  } else {
    statusEl.classList.remove('status-message--compact');
  }
  statusEl.textContent = message;
  positionStatusMessage(statusEl);
  statusEl.dataset.visible = 'true';

  if (statusEl._hideTimeout) {
    clearTimeout(statusEl._hideTimeout);
  }

  if (options.autoHide) {
    const duration = Number.isFinite(options.duration) ? options.duration : 2200;
    statusEl._hideTimeout = setTimeout(() => {
      statusEl.dataset.visible = 'false';
      statusEl.textContent = '';
      statusEl.removeAttribute('data-type');
      statusEl.classList.remove('status-message--compact');
    }, duration);
  }
};

const renderFolders = () => {
  const list = document.getElementById('folder-list');
  const elements = getAllElements();

  const folderHTML = `
    <h3>Move To Folder</h3>
    ${elements
      .map(
        (element) => `
      <div class="folder-item" data-element="${element}">
        <div class="folder-icon" data-element="${element}"></div>
        <span>${element.charAt(0).toUpperCase() + element.slice(1)}</span>
      </div>
    `
      )
      .join('')}
  `;
  list.innerHTML = folderHTML;

  list.querySelectorAll('.folder-item').forEach((item) => {
    item.addEventListener('click', handleElementIconClick);
  });
  list.style.display = 'none';
};

export const renderEntries = (entries) => {
  const list = document.getElementById('entries-list');

  const groupedEntries = entries.reduce((acc, entry) => {
    const folder = entry.folder || 'inbox';
    if (!acc[folder]) {
      acc[folder] = [];
    }
    acc[folder].push(entry);
    return acc;
  }, {});

  list.innerHTML =
    Object.entries(groupedEntries)
      .map(([folder, folderEntries]) => {
        folderEntries.sort((a, b) => b.id - a.id);
        const folderTitle = folder.charAt(0).toUpperCase() + folder.slice(1) + ' Entries';

        return `
      <h3 style="margin-top: 1rem; opacity: 0.8;">${folderTitle}</h3>
      ${folderEntries
        .map(
          (entry) => `
        <div class="entry-item" data-entry-id="${entry.id}" data-element="${entry.element}" tabindex="0">
          <div class="entry-header">
            <div class="entry-meta">
              <div class="entry-element-icon" data-element="${entry.element}" title="${entry.element.toUpperCase()}"></div>
              <div class="entry-date">${formatDate(entry.date)}</div>
            </div>
          </div>
          <div class="entry-text-snippet">
            ${entry.text.slice(0, 50)}${entry.text.length > 50 ? '...' : ''}
          </div>
          
          <div class="entry-controls" data-entry-id="${entry.id}">
            <div class="control-icon icon-move" data-action="open-move-menu" title="Move to Folder"></div>
            <div class="control-icon icon-edit" data-action="edit" title="Edit Entry"></div>
            <div class="control-icon icon-delete" data-action="delete" title="Delete Entry"></div>
          </div>
        </div>
      `
        )
        .join('')}
    `;
      })
      .join('') || '<p style="opacity: 0.5; font-size: 0.85rem;">No entries yet</p>';

  list.querySelectorAll('.control-icon').forEach((icon) => {
    icon.addEventListener('click', handleEntryControlClick);
  });

  list.querySelectorAll('.entry-item').forEach((item) => {
    item.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      const entryId = item.dataset.entryId;
      const isActive = item.classList.contains('active-touch');

      document.querySelectorAll('.entry-item.active-touch').forEach((el) => {
        if (el.dataset.entryId !== entryId) {
          el.classList.remove('active-touch');
        }
      });

      if (!isActive) {
        item.classList.add('active-touch');
      } else {
        item.classList.remove('active-touch');
      }
    });
  });

  document.addEventListener('touchstart', (e) => {
    const controlsMenu = e.target.closest('.entry-controls');
    const isEntryItem = e.target.closest('.entry-item');

    if (!controlsMenu && !isEntryItem) {
      document.querySelectorAll('.entry-item.active-touch').forEach((el) => {
        el.classList.remove('active-touch');
      });
    }
  });

  renderFolders();
};

const elementDetails = getElementDetails();

const elementPanelState = {
  refs: {
    iconsContainer: null,
    figure: null,
    name: null,
    type: null,
    description: null,
    facts: null,
    detailWrapper: null
  },
  currentElement: null
};

const updateElementPanelDetail = (element) => {
  if (!element) return;
  const detail = elementDetails[element];
  const { iconsContainer, figure, name, type, description, facts } = elementPanelState.refs;
  if (!detail || !iconsContainer || !figure || !name || !type || !description || !facts) return;

  elementPanelState.currentElement = element;

  iconsContainer.querySelectorAll('.element-panel-icon').forEach((btn) => {
    const isActive = btn.dataset.element === element;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  name.textContent = detail.name;
  type.textContent = detail.figure;
  description.textContent = detail.description;
  facts.innerHTML = (detail.quickFacts || []).map((fact) => `<li>${fact}</li>`).join('');

  if (elementPanelState.refs.detailWrapper) {
    elementPanelState.refs.detailWrapper.dataset.element = element;
  }
  figure.setAttribute('aria-label', `${detail.name} geometry`);
  destroyScene(figure);
  const panelScene = createScene(figure, element, 200, true);
  if (panelScene) {
    addMeshInteraction(figure, panelScene, { enableDrag: true });
  }
};

export const renderElementPanel = (defaultElement = 'earth') => {
  const iconsContainer = document.getElementById('element-panel-icons');
  const figure = document.getElementById('element-panel-figure');
  const name = document.getElementById('element-panel-name');
  const type = document.getElementById('element-panel-figure-type');
  const description = document.getElementById('element-panel-description');
  const facts = document.getElementById('element-panel-facts');
  const detailWrapper = document.querySelector('.element-panel-detail');

  if (!iconsContainer || !figure || !name || !type || !description || !facts || !detailWrapper) return;

  elementPanelState.refs = { iconsContainer, figure, name, type, description, facts, detailWrapper };
  const allElements = getAllElements();

  iconsContainer.innerHTML = allElements
    .map(
      (element) => `
        <button 
          class="element-panel-icon" 
          data-element="${element}"
          role="tab"
          aria-selected="false"
          type="button"
        >
          ${element.toUpperCase()}
        </button>
      `
    )
    .join('');

  iconsContainer.querySelectorAll('.element-panel-icon').forEach((btn) => {
    btn.addEventListener('click', () => updateElementPanelDetail(btn.dataset.element));
  });

  const initialElement = allElements.includes(defaultElement) ? defaultElement : allElements[0];
  updateElementPanelDetail(initialElement);
};

const sceneDataMap = new Map();

export const destroyScene = (container) => {
  if (!container) return;
  const sceneData = sceneDataMap.get(container);
  if (sceneData) {
    if (sceneData.resizeObserver) {
      sceneData.resizeObserver.disconnect();
    }
    if (sceneData.resizeHandler) {
      window.removeEventListener('resize', sceneData.resizeHandler);
    }
    if (sceneData.interactionCleanup) {
      sceneData.interactionCleanup();
    }
    if (sceneData.renderer) {
      sceneData.renderer.dispose();
      if (sceneData.renderer.domElement && sceneData.renderer.domElement.parentNode === container) {
        container.removeChild(sceneData.renderer.domElement);
      }
    }
    if (sceneData.mesh) {
      sceneData.mesh.geometry?.dispose?.();
      if (Array.isArray(sceneData.mesh.material)) {
        sceneData.mesh.material.forEach((mat) => mat?.dispose?.());
      } else {
        sceneData.mesh.material?.dispose?.();
      }
    }
    sceneDataMap.delete(container);
  }
  container.innerHTML = '';
};

export const createScene = (container, element, size, autoRotate = true) => {
  if (!container) return null;

  if (!WEBGL_SUPPORTED) {
    applyFallbackIcon(container, element, getElementColor(element));
    return null;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);

  container.appendChild(renderer.domElement);

  const geometry = getElementGeometry(element);
  const material = new THREE.MeshPhongMaterial({
    color: getElementColor(element),
    emissive: getElementColor(element),
    emissiveIntensity: 0.5,
    wireframe: true,
    transparent: true,
    opacity: 0.8
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const light = new THREE.AmbientLight(0x404040, 5);
  scene.add(light);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(0, 1, 1).normalize();
  scene.add(directionalLight);

  const resizeScene = () => {
    const width = container.clientWidth || size;
    const height = container.clientHeight || size;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resizeScene();

  let resizeObserver = null;
  let resizeHandler = null;

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(resizeScene);
    resizeObserver.observe(container);
  } else {
    resizeHandler = () => resizeScene();
    window.addEventListener('resize', resizeHandler);
  }

  const sceneData = {
    scene,
    camera,
    renderer,
    mesh,
    autoRotate,
    rotationSpeed: 0.003,
    baseRotationSpeed: 0.003,
    isUserInteracting: false,
    resizeObserver,
    resizeHandler
  };
  sceneDataMap.set(container, sceneData);
  return sceneData;
};

export const animateAllMeshes = () => {
  requestAnimationFrame(animateAllMeshes);

  sceneDataMap.forEach((sceneData) => {
    const { scene, camera, renderer, mesh, autoRotate, rotationSpeed, isUserInteracting } = sceneData;

    if (autoRotate && !isUserInteracting) {
      mesh.rotation.x += rotationSpeed;
      mesh.rotation.y += rotationSpeed;
    }
    renderer.render(scene, camera);
  });
};

export const addMeshInteraction = (container, sceneData, options = {}) => {
  const { mesh } = sceneData;
  const originalSpeed = sceneData.baseRotationSpeed || sceneData.rotationSpeed || 0.003;
  const enableDrag = Boolean(options.enableDrag);
  const pointerState = { active: false, lastX: 0, lastY: 0 };
  const cleanupFns = [];
  const bind = (event, handler) => {
    container.addEventListener(event, handler);
    cleanupFns.push(() => container.removeEventListener(event, handler));
  };

  const handleMouseEnter = () => {
    if (sceneData.isUserInteracting) return;
    sceneData.rotationSpeed = originalSpeed * 3.5;
  };

  const handleMouseLeave = () => {
    if (sceneData.isUserInteracting) return;
    sceneData.rotationSpeed = originalSpeed;
  };

  const handleClick = () => {
    if (pointerState.active) return;
    mesh.rotation.x += 0.3;
    mesh.rotation.y += 0.3;
    sceneData.rotationSpeed = originalSpeed * 6;
    setTimeout(() => {
      if (!sceneData.isUserInteracting) {
        sceneData.rotationSpeed = originalSpeed;
      }
    }, 200);
  };

  bind('mouseenter', handleMouseEnter);
  bind('mouseleave', handleMouseLeave);
  bind('click', handleClick);

  if (!enableDrag) {
    sceneData.interactionCleanup = () => {
      cleanupFns.forEach((fn) => fn());
    };
    return;
  }

  const handlePointerDown = (event) => {
    pointerState.active = true;
    pointerState.lastX = event.clientX;
    pointerState.lastY = event.clientY;
    sceneData.isUserInteracting = true;
    sceneData.rotationSpeed = 0;
    if (container.setPointerCapture) {
      try {
        container.setPointerCapture(event.pointerId);
      } catch (err) {
        /* noop */
      }
    }
  };

  const handlePointerMove = (event) => {
    if (!pointerState.active) return;
    const deltaX = (event.clientX - pointerState.lastX) * 0.01;
    const deltaY = (event.clientY - pointerState.lastY) * 0.01;
    mesh.rotation.y += deltaX;
    mesh.rotation.x += deltaY;
    pointerState.lastX = event.clientX;
    pointerState.lastY = event.clientY;
  };

  const releasePointer = (event) => {
    if (!pointerState.active) return;
    pointerState.active = false;
    sceneData.isUserInteracting = false;
    sceneData.rotationSpeed = originalSpeed;
    if (container.releasePointerCapture) {
      try {
        container.releasePointerCapture(event.pointerId);
      } catch (err) {
        /* noop */
      }
    }
  };

  bind('pointerdown', handlePointerDown);
  bind('pointermove', handlePointerMove);
  bind('pointerup', releasePointer);
  bind('pointerleave', releasePointer);
  bind('pointercancel', releasePointer);

  sceneData.interactionCleanup = () => {
    cleanupFns.forEach((fn) => fn());
  };
};

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    document.querySelectorAll('.status-message').forEach(positionStatusMessage);
  });
}
