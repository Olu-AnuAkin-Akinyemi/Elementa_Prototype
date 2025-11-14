let mediaRecorder = null;
let audioChunks = [];
let stream = null;
let isRecording = false;

export const saveEntry = async (entry) => {
  try {
    const entries = JSON.parse(localStorage.getItem('elementa_entries') || '[]');
    entries.unshift(entry);
    entries.sort((a, b) => b.id - a.id);
    localStorage.setItem('elementa_entries', JSON.stringify(entries));
  } catch (err) {
    console.error('Save failed:', err);
    throw new Error('Could not save entry to local storage.');
  }
};

export const loadEntries = async () => {
  try {
    const entries = JSON.parse(localStorage.getItem('elementa_entries') || '[]');
    entries.sort((a, b) => b.id - a.id);
    return entries;
  } catch (err) {
    console.error('Load failed:', err);
    return [];
  }
};

export const startRecording = async (element) => {
  if (isRecording) {
    console.warn('Recording already in progress.');
    return;
  }

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const options = { mimeType: 'audio/webm' };
    mediaRecorder = new MediaRecorder(stream, options);
    audioChunks = [];

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      console.log(`Recording finished for ${element}. Blob size: ${audioBlob.size} bytes.`);
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
      isRecording = false;
    };

    mediaRecorder.start();
    isRecording = true;
  } catch (err) {
    console.error('Microphone access or recording failed:', err);
    isRecording = false;
    throw new Error('Failed to start recording. Please check microphone permissions.');
  }
};

export const stopRecording = async () => {
  if (!isRecording || !mediaRecorder) {
    console.warn('No recording is currently active.');
    return;
  }

  mediaRecorder.stop();
  isRecording = false;
};

export const deleteEntry = async (id) => {
  try {
    const entries = await loadEntries();
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    localStorage.setItem('elementa_entries', JSON.stringify(updatedEntries));
  } catch (err) {
    console.error('Delete failed:', err);
    throw new Error('Could not delete entry.');
  }
};

export const moveEntryToFolder = async (id, newFolder) => {
  try {
    const entries = await loadEntries();
    const entryIndex = entries.findIndex((entry) => entry.id === id);

    if (entryIndex === -1) {
      throw new Error('Entry not found.');
    }

    entries[entryIndex].folder = newFolder;
    localStorage.setItem('elementa_entries', JSON.stringify(entries));
  } catch (err) {
    console.error('Move failed:', err);
    throw new Error('Could not move entry to folder.');
  }
};

export const isRecordingActive = () => isRecording;
