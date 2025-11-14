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
  showStatusMessage
} from '../ui/scribe.js';

let currentRecordingButton = null;
let activeEntryIdForMove = null;

const handleNavClick = (e) => {
  const element = e.currentTarget.dataset.element;
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
    showStatusMessage(page, 'Feel free to type your thoughts and feelings or record what is on your heart.', 'info');
    return;
  }

  try {
    const entry = createEntry(element, text, element);
    btn.disabled = true;
    await saveEntry(entry);
    const entries = await loadEntries();
    renderEntries(entries);
    textarea.value = '';

    btn.textContent = 'Saved ✓';
    showStatusMessage(page, 'Entry saved.', 'success');
    setTimeout(() => {
      btn.textContent = 'Save Entry';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    console.error('Save error:', err);
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
  const allElements = getAllElements();

  allElements.forEach((element) => {
    const navItem = document.querySelector(`.nav-bar .nav-item[data-element="${element}"]`);
    const navSceneData = createScene(navItem, element, 50, true);
    addMeshInteraction(navItem, navSceneData);
    navItem.addEventListener('click', handleNavClick);

    const headerContainer = document.querySelector(`.page .header-icon[data-element="${element}"]`);
    const headerSceneData = createScene(headerContainer, element, 80, true);
    addMeshInteraction(headerContainer, headerSceneData);

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

  const entries = await loadEntries();
  renderEntries(entries);

  console.log('ELEMENTA initialized successfully with Clean Architecture.');
};
