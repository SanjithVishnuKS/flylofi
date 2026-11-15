// Focus Flight — Enhanced Dynamic Media & Parallax Engine
(() => {
  'use strict';

  // 1. Cabin Parallax
  const stage = document.getElementById('stage');
  if (stage) {
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 5;
      stage.style.setProperty('--parallax-x', `${x}px`);
      stage.style.setProperty('--parallax-y', `${y}px`);
    });
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--parallax-x', '0px');
      stage.style.setProperty('--parallax-y', '0px');
    });
  }

  // 2. DOM Elements & State
  const lofiAudio = document.getElementById('mediaLofi');
  const cabinAudio = document.getElementById('mediaCabin');
  const flightVideo = document.getElementById('flightVideo');
  const volumeSlider = document.getElementById('volume');
  const audioTrackContainer = document.getElementById('audioTrackList');
  const cabinBtn = document.getElementById('cabinBtn');
  const videoBtn = document.getElementById('videoBtn');
  const synthBtn = document.getElementById('lofiBtn');
  const addAudioBtn = document.getElementById('addAudioBtn');
  const addVideoBtn = document.getElementById('addVideoBtn');
  const customAudioFile = document.getElementById('customAudioFile');
  const customVideoFile = document.getElementById('customVideoFile');

  if (!lofiAudio || !cabinAudio || !flightVideo) return;

  const getVolume = () => (volumeSlider ? (Number(volumeSlider.value) / 100) * 0.42 : 0.35 * 0.42);

  // Helper to generate candidate paths for any relative asset
  function getCandidatePaths(src) {
    if (!src) return [];
    if (/^(blob:|data:|https?:|\/\/)/i.test(src)) return [src];
    const clean = src.replace(/^(\.\.\/|\.\/|\/)/, '');
    const candidates = [
      '../' + clean,
      './' + clean,
      '/' + clean
    ];
    if (window.location.hostname && window.location.hostname !== 'localhost') {
      candidates.push(`http://${window.location.hostname}:8080/${clean}`);
    }
    candidates.push(`http://192.168.0.103:8080/${clean}`);
    return [...new Set(candidates)];
  }

  // Play audio safely with candidate path fallback
  async function playWithFallback(audioElement, candidateList, index = 0) {
    if (index >= candidateList.length) {
      throw new Error('All candidate paths failed for media source');
    }
    const currentSrc = candidateList[index];
    audioElement.src = currentSrc;
    audioElement.volume = getVolume();
    try {
      await audioElement.play();
      return currentSrc;
    } catch (err) {
      // If error is not user abort, try next candidate
      if (err.name !== 'AbortError') {
        return playWithFallback(audioElement, candidateList, index + 1);
      }
      throw err;
    }
  }

  // 3. Audio Tracks Registry
  let activeAudioButton = null;

  function registerTrackButton(button) {
    button.addEventListener('click', async () => {
      const src = button.dataset.lofiSrc;
      if (!src) return;

      if (activeAudioButton === button && !lofiAudio.paused) {
        lofiAudio.pause();
        button.classList.remove('active');
        return;
      }

      // Stop synth if it was running
      if (synthBtn && synthBtn.classList.contains('active')) {
        synthBtn.click();
      }

      const candidates = getCandidatePaths(src);
      try {
        await playWithFallback(lofiAudio, candidates);
        if (activeAudioButton) activeAudioButton.classList.remove('active');
        button.classList.add('active');
        activeAudioButton = button;
      } catch (err) {
        console.warn('Could not play track:', src, err);
        button.classList.remove('active');
      }
    });
  }

  // Register existing track buttons
  document.querySelectorAll('.media-toggle').forEach(registerTrackButton);

  // 4. Custom Audio File Insertion
  if (addAudioBtn && customAudioFile) {
    addAudioBtn.addEventListener('click', () => customAudioFile.click());
    customAudioFile.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const cleanName = file.name.replace(/\.[^/.]+$/, '').slice(0, 16);

      // Create new button in track container
      const newBtn = document.createElement('button');
      newBtn.className = 'sound-btn media-toggle active';
      newBtn.dataset.lofiSrc = blobUrl;
      newBtn.textContent = '♪ ' + cleanName;
      newBtn.title = file.name;
      audioTrackContainer.prepend(newBtn);
      registerTrackButton(newBtn);

      // Immediately play
      if (activeAudioButton) activeAudioButton.classList.remove('active');
      activeAudioButton = newBtn;
      lofiAudio.src = blobUrl;
      lofiAudio.volume = getVolume();
      try {
        await lofiAudio.play();
      } catch (err) {
        console.error('Custom audio playback failed:', err);
      }
    });
  }

  // 5. Cabin Ambience Audio
  const cabinCandidates = [
    '../media/flight/audio/airplane-cabin-white.webm',
    './media/flight/audio/airplane-cabin-white.webm',
    '/media/flight/audio/airplane-cabin-white.webm',
    'http://192.168.0.103:8080/media/flight/audio/airplane-cabin-white.webm'
  ];

  if (cabinBtn) {
    const defaultCabinHandler = cabinBtn.onclick;
    cabinBtn.onclick = async () => {
      if (!cabinAudio.paused) {
        cabinAudio.pause();
        cabinBtn.textContent = '〰 Cabin off';
        cabinBtn.classList.remove('active');
        return;
      }

      try {
        await playWithFallback(cabinAudio, cabinCandidates);
        cabinBtn.textContent = '〰 Cabin on';
        cabinBtn.classList.add('active');
      } catch (err) {
        console.warn('Falling back to procedural cabin synthesizer');
        defaultCabinHandler?.();
      }
    };
  }

  // 6. Video Background Scene Switcher
  const videoScenes = [
    { name: 'Night Flight', src: 'media/flight/clips/night-flight-lofi.mp4' },
    { name: 'First Class', src: 'media/flight/videos/first-class-cabin.mp4' },
    { name: 'Master Loop', src: 'media/flight/clips/gemini_generated_video_09c1b3d1.mp4' },
    { name: 'Canvas Mode', src: null }
  ];
  let currentSceneIndex = 0;

  async function loadVideoScene(scene) {
    if (!scene.src) {
      // Canvas art mode: hide video
      flightVideo.pause();
      stage.classList.remove('video-live');
      if (videoBtn) {
        videoBtn.textContent = '▣ Mode: Canvas';
        videoBtn.classList.remove('active');
      }
      return;
    }

    const candidates = getCandidatePaths(scene.src);
    let loaded = false;

    for (const url of candidates) {
      try {
        flightVideo.src = url;
        flightVideo.load();
        await flightVideo.play();
        stage.classList.add('video-live');
        if (videoBtn) {
          videoBtn.textContent = `▣ Video: ${scene.name}`;
          videoBtn.classList.add('active');
        }
        loaded = true;
        break;
      } catch (e) {
        // try next candidate
      }
    }

    if (!loaded) {
      console.warn('Could not load video scene:', scene.name);
      stage.classList.remove('video-live');
      if (videoBtn) videoBtn.textContent = '▣ Mode: Canvas';
    }
  }

  if (videoBtn) {
    videoBtn.addEventListener('click', async () => {
      currentSceneIndex = (currentSceneIndex + 1) % videoScenes.length;
      await loadVideoScene(videoScenes[currentSceneIndex]);
    });
  }

  // Initial video attempt (plays first scene if possible)
  loadVideoScene(videoScenes[0]);

  // 7. Custom Video File Insertion
  if (addVideoBtn && customVideoFile) {
    addVideoBtn.addEventListener('click', () => customVideoFile.click());
    customVideoFile.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const customScene = {
        name: file.name.replace(/\.[^/.]+$/, '').slice(0, 12),
        src: blobUrl
      };
      videoScenes.splice(currentSceneIndex + 1, 0, customScene);
      currentSceneIndex = currentSceneIndex + 1;
      await loadVideoScene(customScene);
    });
  }

  // 8. Volume Master Control
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      const vol = getVolume();
      lofiAudio.volume = vol;
      cabinAudio.volume = vol;
    });
  }

  // 9. Server Media Auto-Discovery (/api/media)
  async function discoverServerMedia() {
    const apiEndpoints = [
      '/api/media',
      `http://${window.location.hostname || 'localhost'}:8080/api/media`,
      'http://192.168.0.103:8080/api/media'
    ];

    let mediaFiles = null;
    for (const endpoint of apiEndpoints) {
      try {
        const resp = await fetch(endpoint, { mode: 'cors' });
        if (resp.ok) {
          mediaFiles = await resp.json();
          break;
        }
      } catch (e) {
        // next endpoint
      }
    }

    if (!Array.isArray(mediaFiles)) return;

    mediaFiles.forEach((file) => {
      const lower = file.name.toLowerCase();

      // Audio file discovery
      if (file.type === 'audio' || /\.(mp3|wav|ogg|m4a|webm|flac)$/i.test(lower)) {
        if (lower.includes('cabin') || lower.includes('white')) {
          if (!cabinCandidates.includes(file.path)) {
            cabinCandidates.unshift(file.path);
          }
        } else {
          // Check if already in track container
          const existing = [...document.querySelectorAll('.media-toggle')].some((btn) =>
            btn.dataset.lofiSrc?.includes(file.name)
          );
          if (!existing) {
            const btn = document.createElement('button');
            btn.className = 'sound-btn media-toggle';
            btn.dataset.lofiSrc = file.path;
            const label = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            btn.textContent = label.slice(0, 14);
            btn.title = file.name;
            audioTrackContainer.appendChild(btn);
            registerTrackButton(btn);
          }
        }
      }

      // Video file discovery
      if (file.type === 'video' || /\.(mp4|webm|mov)$/i.test(lower)) {
        const existingVideo = videoScenes.some((s) => s.src && s.src.includes(file.name));
        if (!existingVideo) {
          const label = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          videoScenes.push({
            name: label.slice(0, 14),
            src: file.path
          });
        }
      }
    });
  }

  // Run discovery in background
  discoverServerMedia().catch(() => {});
})();
