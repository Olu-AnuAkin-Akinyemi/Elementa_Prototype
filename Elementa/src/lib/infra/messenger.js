/**
 * Voice-to-text recording state
 */
let recognition = null;
let isRecording = false;
let userStopped = false; // Flag to prevent auto-restart when user clicks stop
let finalTranscript = "";
let hasError = false;
let lastProcessedIndex = 0;
let onTranscriptUpdate = null;

/**
 * Saves a journal entry to localStorage.
 */
export const saveEntry = async (entry) => {
  try {
    const entries = JSON.parse(
      localStorage.getItem("elementa_entries") || "[]"
    );
    entries.unshift(entry);
    entries.sort((a, b) => b.id - a.id);
    localStorage.setItem("elementa_entries", JSON.stringify(entries));
  } catch (err) {
    console.error("Save failed:", err);
    throw new Error("Could not save entry to local storage.");
  }
};

/**
 * Loads all journal entries from localStorage.
 */
export const loadEntries = async () => {
  try {
    const entries = JSON.parse(
      localStorage.getItem("elementa_entries") || "[]"
    );
    entries.sort((a, b) => b.id - a.id);
    return entries;
  } catch (err) {
    console.error("Load failed:", err);
    return [];
  }
};

/**
 * Starts voice-to-text recording using the Web Speech API.
 */
export const startRecording = async (element, callback) => {
  if (isRecording) {
    console.warn("Recording already in progress.");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    throw new Error(
      "Speech recognition not supported. Use Chrome, Edge, or Safari 14.1+"
    );
  }

  if (!navigator.onLine) {
    throw new Error("Voice-to-text requires an internet connection.");
  }

  // Reset all state
  recognition = new SpeechRecognition();
  isRecording = true;
  userStopped = false;
  finalTranscript = "";
  hasError = false;
  lastProcessedIndex = 0;
  onTranscriptUpdate = callback;

  // Configure
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    console.log("✅ Voice recognition started");
  };

  recognition.onresult = (event) => {
    let interimTranscript = "";

    for (let i = lastProcessedIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + " ";
        lastProcessedIndex = i + 1;
      } else {
        interimTranscript += transcript;
      }
    }

    if (onTranscriptUpdate) {
      onTranscriptUpdate(finalTranscript + interimTranscript, false);
    }
  };

  recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);

    const criticalErrors = [
      "not-allowed",
      "audio-capture",
      "service-not-allowed",
      "network",
    ];
    if (criticalErrors.includes(event.error)) {
      hasError = true;
      isRecording = false;
      recognition = null;
    }
  };

  recognition.onend = () => {
    console.log(
      "Recognition ended. userStopped:",
      userStopped,
      "isRecording:",
      isRecording
    );

    // Only restart if user didn't explicitly stop
    if (!userStopped && isRecording && !hasError && navigator.onLine) {
      try {
        lastProcessedIndex = 0;
        recognition.start();
        console.log("↻ Restarting recognition after silence");
      } catch (err) {
        console.error("Could not restart:", err);
        isRecording = false;
        recognition = null;
      }
    } else {
      // Clean up
      isRecording = false;
      recognition = null;
    }
  };

  try {
    recognition.start();
    console.log(`🎤 Voice recording started for ${element}`);
  } catch (err) {
    console.error("Failed to start:", err);
    isRecording = false;
    recognition = null;
    throw new Error("Failed to start voice recognition.");
  }
};

/**
 * Stops the active voice-to-text recording session.
 */
export const stopRecording = async () => {
  console.log("stopRecording called. isRecording:", isRecording);

  if (!isRecording) {
    console.warn("No recording is currently active.");
    return "";
  }

  // Set flag BEFORE stopping to prevent auto-restart
  userStopped = true;
  isRecording = false;

  const result = finalTranscript.trim();

  if (recognition) {
    try {
      recognition.stop();
    } catch (err) {
      console.error("Error stopping recognition:", err);
    }
    recognition = null;
  }

  if (onTranscriptUpdate && result) {
    onTranscriptUpdate(result, true);
  }

  console.log("🎤 Recording stopped. Transcript:", result);
  return result;
};

/**
 * Deletes a journal entry from localStorage by ID.
 */
export const deleteEntry = async (id) => {
  try {
    const entries = await loadEntries();
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    localStorage.setItem("elementa_entries", JSON.stringify(updatedEntries));
  } catch (err) {
    console.error("Delete failed:", err);
    throw new Error("Could not delete entry.");
  }
};

/**
 * Moves a journal entry to a different element folder.
 */
export const moveEntryToFolder = async (id, newFolder) => {
  try {
    const entries = await loadEntries();
    const entryIndex = entries.findIndex((entry) => entry.id === id);

    if (entryIndex === -1) {
      throw new Error("Entry not found.");
    }

    entries[entryIndex].folder = newFolder;
    localStorage.setItem("elementa_entries", JSON.stringify(entries));
  } catch (err) {
    console.error("Move failed:", err);
    throw new Error("Could not move entry to folder.");
  }
};

/**
 * Checks if a voice-to-text recording session is currently active.
 */
export const isRecordingActive = () => isRecording;

/**
 * Gets the current transcribed text.
 */
export const getCurrentTranscript = () => finalTranscript;
