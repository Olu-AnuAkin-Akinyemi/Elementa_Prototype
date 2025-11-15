import {
  isValidElement,
  createEntry,
  getRandomPrompt,
  getAllElements
} from '../core/pure.js';
import {
  saveEntry,
  loadEntries,
  startRecording,
  stopRecording,
  isRecordingActive,
  deleteEntry,
  moveEntryToFolder
} from '../infra/messenger.js';
import {
  switchPage,
  updatePrompt,
  updateRecordButton,
  toggleSidebar,
  renderEntries,
  createScene,
  animateAllMeshes,
  addMeshInteraction,
  showStatusMessage,
  renderElementPanel,
  toggleElementPanel,
  attachNatureHint
} from '../ui/scribe.js';
import { initSpaceBackground } from '../ui/spaceBackground.js';

let currentRecordingButton = null;
let activeEntryIdForMove = null;
const navBadgeTimers = new WeakMap();

const revealNavBadge = (navItem) => {
  if (!navItem) return;
  navItem.classList.add('nav-item--show-label');
  if (navBadgeTimers.has(navItem)) {
    clearTimeout(navBadgeTimers.get(navItem));
  }
  const timeout = setTimeout(() => {
    navItem.classList.remove('nav-item--show-label');
    navBadgeTimers.delete(navItem);
  }, 1500);
  navBadgeTimers.set(navItem, timeout);
};

const handleNavClick = (e) => {
  const navItem = e.currentTarget;
  revealNavBadge(navItem);
  const element = navItem.dataset.element;
  if (!isValidElement(element)) return;

  switchPage(element);
  updatePrompt(element);
};

const handleSaveClick = async (e) => {
  const btn = e.currentTarget;
  const element = btn.dataset.element;
  const page = document.querySelector(`#${element}-page`);
  const textarea = page.querySelector('.text-input');
  const text = textarea.value.trim();

  if (!text) {
    showStatusMessage(
      page,
      'Type your feelings or record what is on your heart.',
      'info',
      { compact: true, autoHide: true, duration: 5000 }
    );
    return;
  }

  try {
    const entry = createEntry(element, text, element);
    btn.dataset.state = 'saving';
    btn.textContent = 'Saving...';
    btn.disabled = true;
    await saveEntry(entry);
    const entries = await loadEntries();
    renderEntries(entries);
    textarea.value = '';

    btn.dataset.state = 'saved';
    btn.textContent = 'Saved ✓';
    showStatusMessage(page, 'Entry saved.', 'success', { autoHide: true, duration: 2500 });
    setTimeout(() => {
      btn.dataset.state = '';
      btn.textContent = 'Save Entry';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('Save error:', err);
    btn.dataset.state = '';
    btn.textContent = 'Error';
    showStatusMessage(page, 'Something went wrong while saving. Please try again.', 'error');
    setTimeout(() => {
      btn.textContent = 'Save Entry';
      btn.disabled = false;
    }, 2000);
  }
};

const handleRecordClick = async (e) => {
  const btn = e.currentTarget;
  const element = btn.dataset.element;

  if (isRecordingActive()) {
    await stopRecording();
    updateRecordButton(btn, false);
    currentRecordingButton = null;
  } else {
    if (currentRecordingButton && currentRecordingButton !== btn) {
      await stopRecording();
      updateRecordButton(currentRecordingButton, false);
    }

    try {
      await startRecording(element);
      updateRecordButton(btn, true);
      currentRecordingButton = btn;
    } catch (err) {
      alert('Could not start recording. Check microphone permissions.');
      updateRecordButton(btn, false);
      currentRecordingButton = null;
    }
  }
};

const handleSidebarToggle = () => {
  const sidebar = document.querySelector('.sidebar');
  const isOpen = sidebar.classList.contains('open');
  toggleSidebar(!isOpen);
};

const handleElementPanelToggle = () => {
  const panel = document.querySelector('.element-panel');
  const isOpen = panel?.classList.contains('open');
  toggleElementPanel(!isOpen);
};

export const handleEntryControlClick = async (e) => {
  const icon = e.currentTarget;
  const action = icon.dataset.action;
  const entryItem = icon.closest('.entry-item');
  const entryId = parseInt(entryItem.dataset.entryId, 10);

  entryItem.classList.remove('active-touch');

  switch (action) {
    case 'open-move-menu':
      activeEntryIdForMove = entryId;
      document.getElementById('folder-list').style.display = 'block';
      alert('Select an element folder below to move this entry.');
      break;
    case 'edit':
      alert(`Editing entry ${entryId}. (Prototype: Edit function stubbed)`);
      break;
    case 'delete':
      if (confirm('Are you sure you want to delete this entry?')) {
        await deleteEntry(entryId);
        const entries = await loadEntries();
        renderEntries(entries);
        alert('Entry deleted.');
      }
      break;
  }
};

export const handleElementIconClick = async (e) => {
  const folderItem = e.currentTarget;
  const element = folderItem.dataset.element;

  if (!activeEntryIdForMove) return;

  try {
    await moveEntryToFolder(activeEntryIdForMove, element);
    const entries = await loadEntries();
    renderEntries(entries);
    alert(`Entry moved to ${element.charAt(0).toUpperCase() + element.slice(1)} folder.`);
  } catch (err) {
    alert(`Error moving entry: ${err.message}`);
  } finally {
    activeEntryIdForMove = null;
    document.getElementById('folder-list').style.display = 'none';
  }
};

export const initApp = async () => {
  initSpaceBackground();
  renderElementPanel();
  const allElements = getAllElements();

  allElements.forEach((element) => {
    const navItem = document.querySelector(`.nav-bar .nav-item[data-element="${element}"]`);
    const navSceneData = createScene(navItem, element, 50, true);
    if (navSceneData) {
      addMeshInteraction(navItem, navSceneData);
    }
    navItem.addEventListener('click', handleNavClick);

    const headerContainer = document.querySelector(`.page .header-icon[data-element="${element}"]`);
    const headerSceneData = createScene(headerContainer, element, 80, false);
    if (headerSceneData) {
      addMeshInteraction(headerContainer, headerSceneData);
    }
    attachNatureHint(headerContainer, element);

    const promptEl = document.querySelector(`.prompt-text[data-prompts-id="${element}"]`);
    if (promptEl) {
      promptEl.textContent = getRandomPrompt(element);
    }
  });

  animateAllMeshes();

  document.querySelectorAll('.save-btn').forEach((btn) => {
    btn.addEventListener('click', handleSaveClick);
  });

  document.querySelectorAll('.record-btn').forEach((btn) => {
    btn.addEventListener('click', handleRecordClick);
  });

  const sidebarToggle = document.querySelector('.sidebar-toggle');
  sidebarToggle.addEventListener('click', handleSidebarToggle);
  const sidebarClose = document.querySelector('.sidebar-close');
  const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
  if (sidebarClose) {
    sidebarClose.addEventListener('click', () => toggleSidebar(false));
  }
  if (sidebarBackdrop) {
    sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));
  }

  const elementPanelToggle = document.querySelector('.element-panel-toggle');
  const elementPanelClose = document.querySelector('.element-panel-close');
  const elementPanelBackdrop = document.querySelector('.element-panel-backdrop');
  if (elementPanelToggle) {
    elementPanelToggle.addEventListener('click', handleElementPanelToggle);
  }
  if (elementPanelClose) {
    elementPanelClose.addEventListener('click', () => toggleElementPanel(false));
  }
  if (elementPanelBackdrop) {
    elementPanelBackdrop.addEventListener('click', () => toggleElementPanel(false));
  }

  const entries = await loadEntries();
  renderEntries(entries);

  console.log('ELEMENTA initialized successfully');
};
