let mediaRecorder = null;
let audioChunks = [];
let stream = null;
let isRecording = false;

/**
 * Saves a journal entry to localStorage.
 * Entries are stored in descending order by ID (newest first).
 * @param {Object} entry - Entry object with id, element, text, folder, and date
 * @returns {Promise<void>}
 * @throws {Error} If localStorage save fails
 */
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

/**
 * Loads all journal entries from localStorage.
 * Returns entries sorted by ID in descending order (newest first).
 * @returns {Promise<Array<Object>>} Array of entry objects, or empty array if load fails
 */
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

/**
 * Starts audio recording for a journal entry using the MediaRecorder API.
 * Requests microphone access and initializes recording session.
 * @param {string} element - Element name for this recording session
 * @returns {Promise<void>}
 * @throws {Error} If microphone access denied, MediaRecorder not supported, or recording initialization fails
 */
export const startRecording = async (element) => {
  if (isRecording) {
    console.warn('Recording already in progress.');
    return;
  }

  // Check if MediaRecorder is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('Audio recording is not supported in this browser.');
  }

  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder API is not available in this browser.');
  }

  try {
    // Request microphone access
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Check if audio/webm is supported, fallback to browser default
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Use browser default
        console.warn('Using browser default audio format - webm and mp4 not supported');
      }
    }

    const options = mimeType ? { mimeType } : {};
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
      // TODO: Save audio blob to entry or upload to cloud storage

      // Clean up stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      isRecording = false;
    };

    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event.error);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }
      isRecording = false;
    };

    mediaRecorder.start();
    isRecording = true;
  } catch (err) {
    console.error('Microphone access or recording failed:', err);

    // Clean up on error
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    isRecording = false;

    // Provide specific error messages
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('Microphone permission denied. Please allow microphone access in your browser settings.');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      throw new Error('No microphone found. Please connect a microphone and try again.');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      throw new Error('Microphone is already in use by another application.');
    } else {
      throw new Error(`Failed to start recording: ${err.message}`);
    }
  }
};

/**
 * Stops the active audio recording session.
 * MediaRecorder will trigger onstop callback with the recorded audio blob.
 * @returns {Promise<void>}
 */
export const stopRecording = async () => {
  if (!isRecording || !mediaRecorder) {
    console.warn('No recording is currently active.');
    return;
  }

  try {
    mediaRecorder.stop();
    isRecording = false;
  } catch (err) {
    console.error('Failed to stop recording:', err);
    // Force cleanup
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    isRecording = false;
  }
};

/**
 * Deletes a journal entry from localStorage by ID.
 * @param {number} id - Entry ID to delete
 * @returns {Promise<void>}
 * @throws {Error} If delete operation fails
 */
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

/**
 * Moves a journal entry to a different element folder.
 * @param {number} id - Entry ID to move
 * @param {string} newFolder - New folder/element name
 * @returns {Promise<void>}
 * @throws {Error} If entry not found or move operation fails
 */
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

/**
 * Checks if an audio recording session is currently active.
 * @returns {boolean} True if recording is in progress
 */
export const isRecordingActive = () => isRecording;
