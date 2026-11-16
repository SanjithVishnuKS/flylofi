// FlyLofi Focus Flight — Cabin Entertainment & Parallax Engine
(() => {
  'use strict';

  // 1. Cabin Mouse & Touch Parallax
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

  // 2. DOM Elements
  const lofiAudio = document.getElementById('mediaLofi');
  const cabinAudio = document.getElementById('mediaCabin');
  const flightVideo = document.getElementById('flightVideo');
  const lofiPlayToggle = document.getElementById('lofiPlayToggle');
  const playIcon = document.getElementById('playIcon');
  const playLabel = document.getElementById('playLabel');
  const lofiTrackSelect = document.getElementById('lofiTrackSelect');
  const cabinBtn = document.getElementById('cabinBtn');
  const cabinLabel = document.getElementById('cabinLabel');
  const videoSceneSelect = document.getElementById('videoSceneSelect');
  const volumeSlider = document.getElementById('volume');
  const customAudioFile = document.getElementById('customAudioFile');
  const customVideoFile = document.getElementById('customVideoFile');

  if (!lofiAudio || !cabinAudio || !flightVideo) return;

  // Ensure video is strictly muted so it never overlaps with music
  flightVideo.muted = true;
  flightVideo.defaultMuted = true;
  flightVideo.volume = 0;

  // 3. Candidate Path Generator
  function getCandidatePaths(src) {
    if (!src || src.startsWith('blob:') || src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) {
      return [src];
    }
    const clean = src.replace(/^(\.\.\/|\.\/|\/)/, '');
    const host = window.location.hostname || 'localhost';
    const candidates = [
      clean,
      './' + clean,
      '/assets/web/' + clean,
      'assets/web/' + clean,
      '../' + clean,
      '/' + clean,
      `http://${host}:8080/${clean}`,
      `http://192.168.0.28:8080/${clean}`,
      `http://localhost:8080/${clean}`,
      `http://127.0.0.1:8080/${clean}`,
      `http://10.0.2.2:8080/${clean}`
    ];
    return [...new Set(candidates)];
  }

  // Master Volume State
  const getVolumeLevel = () => {
    return volumeSlider ? Number(volumeSlider.value) / 100 : 0.45;
  };

  function updateAudioVolumes() {
    const vol = getVolumeLevel();
    lofiAudio.volume = vol;
    // Cabin white noise is ambient: 65% of master volume
    cabinAudio.volume = vol * 0.65;
  }
  updateAudioVolumes();

  if (volumeSlider) {
    volumeSlider.addEventListener('input', updateAudioVolumes);
  }

  // 4. Robust Media Playback with Path Fallback
  async function playSourceWithFallback(mediaElement, candidateList, index = 0) {
    if (!candidateList || index >= candidateList.length) {
      throw new Error('All candidate paths failed');
    }
    const currentSrc = candidateList[index];
    mediaElement.src = currentSrc;
    updateAudioVolumes();

    try {
      await mediaElement.play();
      return currentSrc;
    } catch (err) {
      if (err.name === 'AbortError') throw err;
      return playSourceWithFallback(mediaElement, candidateList, index + 1);
    }
  }

  // 5. Lofi Music Player (Single-Channel, Zero Overlap)
  let isMusicPlaying = false;

  function updatePlayButtonUI(playing) {
    isMusicPlaying = playing;
    if (lofiPlayToggle) {
      if (playing) {
        lofiPlayToggle.classList.add('playing');
        if (playIcon) playIcon.textContent = '⏸';
        if (playLabel) playLabel.textContent = 'Pause';
      } else {
        lofiPlayToggle.classList.remove('playing');
        if (playIcon) playIcon.textContent = '▶';
        if (playLabel) playLabel.textContent = 'Play Lofi';
      }
    }
  }

  async function startTrackPlayback(src) {
    if (!src) return;
    if (src === '__custom_audio__') {
      if (customAudioFile) customAudioFile.click();
      return;
    }

    // Stop current track before switching
    if (!lofiAudio.paused) {
      lofiAudio.pause();
    }

    const candidates = getCandidatePaths(src);
    try {
      await playSourceWithFallback(lofiAudio, candidates);
      updatePlayButtonUI(true);
      try {
        localStorage.setItem('flylofi_last_track', src);
      } catch (e) {}
    } catch (err) {
      console.warn('Lofi track playback failed for:', src, err);
      updatePlayButtonUI(false);
    }
  }

  function togglePlayPause() {
    if (isMusicPlaying && !lofiAudio.paused) {
      lofiAudio.pause();
      updatePlayButtonUI(false);
    } else {
      const selectedSrc = lofiTrackSelect ? lofiTrackSelect.value : '../media/flight/audio/bedtime-lofi.webm';
      startTrackPlayback(selectedSrc);
    }
  }

  if (lofiPlayToggle) {
    lofiPlayToggle.addEventListener('click', togglePlayPause);
  }

  if (lofiTrackSelect) {
    lofiTrackSelect.addEventListener('change', () => {
      const val = lofiTrackSelect.value;
      if (val === '__custom_audio__') {
        if (customAudioFile) customAudioFile.click();
      } else {
        startTrackPlayback(val);
      }
    });
  }

  // Handle HTML5 Audio element events
  lofiAudio.addEventListener('play', () => updatePlayButtonUI(true));
  lofiAudio.addEventListener('pause', () => updatePlayButtonUI(false));
  lofiAudio.addEventListener('ended', () => updatePlayButtonUI(false));

  // Custom Audio File Upload
  if (customAudioFile && lofiTrackSelect) {
    customAudioFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const cleanName = '♪ ' + file.name.replace(/\.[^/.]+$/, '').slice(0, 18);

      // Add to select dropdown
      const opt = document.createElement('option');
      opt.value = blobUrl;
      opt.textContent = cleanName;
      lofiTrackSelect.prepend(opt);
      lofiTrackSelect.value = blobUrl;

      startTrackPlayback(blobUrl);
    });
  }

  // 6. Cabin Ambience (airplane-cabin-white.webm)
  const cabinCandidates = [
    'media/flight/audio/airplane-cabin-white.webm',
    './media/flight/audio/airplane-cabin-white.webm',
    '/assets/web/media/flight/audio/airplane-cabin-white.webm',
    'assets/web/media/flight/audio/airplane-cabin-white.webm',
    '../media/flight/audio/airplane-cabin-white.webm',
    '/media/flight/audio/airplane-cabin-white.webm',
    'http://192.168.0.28:8080/media/flight/audio/airplane-cabin-white.webm',
    'http://localhost:8080/media/flight/audio/airplane-cabin-white.webm',
    'http://10.0.2.2:8080/media/flight/audio/airplane-cabin-white.webm'
  ];

  let isCabinActive = false;

  function updateCabinUI(active) {
    isCabinActive = active;
    if (cabinBtn) {
      if (active) {
        cabinBtn.classList.add('active');
        if (cabinLabel) cabinLabel.textContent = 'Cabin: ON';
      } else {
        cabinBtn.classList.remove('active');
        if (cabinLabel) cabinLabel.textContent = 'Cabin: Off';
      }
    }
  }

  async function toggleCabin() {
    if (isCabinActive && !cabinAudio.paused) {
      cabinAudio.pause();
      updateCabinUI(false);
    } else {
      try {
        await playSourceWithFallback(cabinAudio, cabinCandidates);
        updateCabinUI(true);
      } catch (err) {
        console.warn('Cabin white noise playback failed:', err);
        updateCabinUI(false);
      }
    }
  }

  if (cabinBtn) {
    cabinBtn.addEventListener('click', toggleCabin);
  }

  cabinAudio.addEventListener('play', () => updateCabinUI(true));
  cabinAudio.addEventListener('pause', () => updateCabinUI(false));

  // 7. Scenic Backdrop Video & Canvas Mode
  async function loadVideoScene(sceneSrc) {
    if (!sceneSrc || sceneSrc === '__canvas__') {
      flightVideo.pause();
      if (stage) stage.classList.remove('video-live');
      return;
    }

    if (sceneSrc === '__custom_video__') {
      if (customVideoFile) customVideoFile.click();
      return;
    }

    flightVideo.muted = true;
    flightVideo.defaultMuted = true;
    flightVideo.volume = 0;

    const candidates = getCandidatePaths(sceneSrc);
    let loaded = false;

    for (const url of candidates) {
      try {
        flightVideo.src = url;
        flightVideo.load();
        await flightVideo.play();
        if (stage) stage.classList.add('video-live');
        loaded = true;
        break;
      } catch (e) {
        // try next candidate
      }
    }

    if (!loaded) {
      console.warn('Could not load video scene:', sceneSrc);
      if (stage) stage.classList.remove('video-live');
    }
  }

  if (videoSceneSelect) {
    videoSceneSelect.addEventListener('change', () => {
      const val = videoSceneSelect.value;
      loadVideoScene(val);
    });
  }

  // Custom Video File Upload
  if (customVideoFile && videoSceneSelect) {
    customVideoFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const cleanName = '🎬 ' + file.name.replace(/\.[^/.]+$/, '').slice(0, 18);

      const opt = document.createElement('option');
      opt.value = blobUrl;
      opt.textContent = cleanName;
      videoSceneSelect.prepend(opt);
      videoSceneSelect.value = blobUrl;

      loadVideoScene(blobUrl);
    });
  }

  // Initial video attempt with user gesture listener fallback
  loadVideoScene(videoSceneSelect?.value || 'media/flight/clips/gemini_generated_video_09c1b3d1.mp4');

  // If browser blocked initial video autoplay, unlock on first user click anywhere in the window
  const unlockAutoplay = () => {
    if (stage && !stage.classList.contains('video-live') && videoSceneSelect?.value && videoSceneSelect.value !== '__canvas__') {
      flightVideo.muted = true;
      flightVideo.play().then(() => {
        stage.classList.add('video-live');
      }).catch(() => {});
    }
    window.removeEventListener('pointerdown', unlockAutoplay);
    window.removeEventListener('keydown', unlockAutoplay);
  };
  window.addEventListener('pointerdown', unlockAutoplay, { once: true });
  window.addEventListener('keydown', unlockAutoplay, { once: true });

  // 8. Server Media Auto-Discovery (/api/media)
  async function discoverServerMedia() {
    const apiEndpoints = [
      '/api/media',
      `http://${window.location.hostname || 'localhost'}:8080/api/media`,
      'http://localhost:8080/api/media'
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
        // try next endpoint
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
        } else if (lofiTrackSelect) {
          const exists = [...lofiTrackSelect.options].some((opt) => opt.value.includes(file.name));
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = file.path;
            const label = '🎵 ' + file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            opt.textContent = label.slice(0, 24);
            lofiTrackSelect.appendChild(opt);
          }
        }
      }

      // Video file discovery
      if (file.type === 'video' || /\.(mp4|webm|mov)$/i.test(lower)) {
        if (videoSceneSelect) {
          const exists = [...videoSceneSelect.options].some((opt) => opt.value.includes(file.name));
          if (!exists) {
            const opt = document.createElement('option');
            opt.value = file.path;
            const label = '🎬 ' + file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
            opt.textContent = label.slice(0, 24);
            videoSceneSelect.appendChild(opt);
          }
        }
      }
    });
  }

  discoverServerMedia().catch(() => {});

  // 9. Legacy API Aliases (guarantees backward compatibility)
  window.FlyLofiAudio = {
    play: startTrackPlayback,
    pause: () => { lofiAudio.pause(); updatePlayButtonUI(false); },
    togglePlay: togglePlayPause,
    toggleCabin: toggleCabin,
    setVolume: (val) => {
      if (volumeSlider) volumeSlider.value = String(val);
      updateAudioVolumes();
    },
    loadScene: loadVideoScene
  };
})();
