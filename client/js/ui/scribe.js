import { 
  getElementGeometry, 
  getElementColor, 
  getRandomPrompt,
  formatDate,
  getAllElements
} from '../core/pure.js';
import { handleElementIconClick, handleEntryControlClick } from '../app/commander.js';

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

/**
 * Shows a transient status message beneath the save button.
 * @param {HTMLElement} page - Element page container.
 * @param {string} message - Message to show.
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - Message style.
 */
export const showStatusMessage = (page, message, type = 'info') => {
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
  statusEl.textContent = message;
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

const sceneDataMap = new Map();

export const createScene = (container, element, size, autoRotate = true) => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
  camera.position.z = 2;

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });
  renderer.setSize(size, size);
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

  const sceneData = { scene, camera, renderer, mesh, autoRotate, rotationSpeed: 0.003 };
  sceneDataMap.set(container, sceneData);
  return sceneData;
};

export const animateAllMeshes = () => {
  requestAnimationFrame(animateAllMeshes);

  sceneDataMap.forEach((sceneData) => {
    const { scene, camera, renderer, mesh, autoRotate, rotationSpeed } = sceneData;

    if (autoRotate) {
      mesh.rotation.x += rotationSpeed;
      mesh.rotation.y += rotationSpeed;
    }
    renderer.render(scene, camera);
  });
};

export const addMeshInteraction = (container, sceneData) => {
  const { mesh } = sceneData;
  const originalSpeed = 0.003;

  container.addEventListener('mouseenter', () => {
    sceneData.rotationSpeed = 0.01;
  });

  container.addEventListener('mouseleave', () => {
    sceneData.rotationSpeed = originalSpeed;
  });

  container.addEventListener('click', () => {
    mesh.rotation.x += 0.3;
    mesh.rotation.y += 0.3;

    sceneData.rotationSpeed = 0.02;
    setTimeout(() => {
      sceneData.rotationSpeed = originalSpeed;
    }, 150);
  });
};
