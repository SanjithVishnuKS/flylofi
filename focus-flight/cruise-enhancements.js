// FlyLofi Focus Flight — Cabin Entertainment, Window Shade & Standout Systems
(() => {
  'use strict';

  // 1. Cabin Mouse & Touch Parallax for 3D Window Depth
  const stage = document.getElementById('stage');
  const portal = document.getElementById('airplaneWindowPortal');
  if (stage && portal) {
    stage.addEventListener('pointermove', (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 12;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
      portal.style.setProperty('--parallax-x', `${x}px`);
      portal.style.setProperty('--parallax-y', `${y}px`);
    });
    stage.addEventListener('pointerleave', () => {
      portal.style.setProperty('--parallax-x', '0px');
      portal.style.setProperty('--parallax-y', '0px');
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

  // Standout Elements
  const windowShade = document.getElementById('windowShade');
  const shadeHandle = document.getElementById('shadeHandle');
  const seatbeltSign = document.getElementById('seatbeltSignHud');
  const chimeDot = document.getElementById('chimeDot');
  const trayToggle = document.getElementById('trayTableToggle');
  const trayClose = document.getElementById('trayCloseBtn');
  const trayDrawer = document.getElementById('trayTableDrawer');
  const trayTaskInput = document.getElementById('trayTaskInput');
  const trayTaskDone = document.getElementById('trayTaskDone');
  const trayNotesInput = document.getElementById('trayNotesInput');
  const smartTintGlass = document.getElementById('smartTintGlass');

  if (!lofiAudio || !cabinAudio || !flightVideo) return;

  // Video strictly muted to protect audio isolation
  flightVideo.muted = true;
  flightVideo.defaultMuted = true;
  flightVideo.volume = 0;

  // 3. Audio & Video Candidate Path Generator
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

  // Master Volume
  const getVolumeLevel = () => {
    return volumeSlider ? Number(volumeSlider.value) / 100 : 0.45;
  };

  function updateAudioVolumes() {
    const vol = getVolumeLevel();
    lofiAudio.volume = vol;
    cabinAudio.volume = vol * 0.65;
  }
  updateAudioVolumes();

  if (volumeSlider) {
    volumeSlider.addEventListener('input', updateAudioVolumes);
  }

  // Robust Media Playback with Path Fallback
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

  // 4. Lofi Music Player (Single-Channel, Zero Overlap)
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
      const selectedSrc = lofiTrackSelect ? lofiTrackSelect.value : '../media/flight/audio/afternoon-jazz.webm';
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

  lofiAudio.addEventListener('play', () => updatePlayButtonUI(true));
  lofiAudio.addEventListener('pause', () => updatePlayButtonUI(false));
  lofiAudio.addEventListener('ended', () => updatePlayButtonUI(false));

  if (customAudioFile && lofiTrackSelect) {
    customAudioFile.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const blobUrl = URL.createObjectURL(file);
      const cleanName = '♪ ' + file.name.replace(/\.[^/.]+$/, '').slice(0, 18);

      const opt = document.createElement('option');
      opt.value = blobUrl;
      opt.textContent = cleanName;
      lofiTrackSelect.prepend(opt);
      lofiTrackSelect.value = blobUrl;

      startTrackPlayback(blobUrl);
    });
  }

  // 5. Cabin White Noise Ambience
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

  // 6. Scenic Video Backdrop
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
      } catch (e) {}
    }

    if (!loaded && stage) {
      stage.classList.remove('video-live');
    }
  }

  if (videoSceneSelect) {
    videoSceneSelect.addEventListener('change', () => {
      loadVideoScene(videoSceneSelect.value);
    });
  }

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

  loadVideoScene(videoSceneSelect?.value || 'media/flight/clips/gemini_generated_video_09c1b3d1.mp4');

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

  // ==========================================================================
  // 7. STANDOUT FEATURE: INTERACTIVE DRAGGABLE AIRPLANE WINDOW SHADE
  // ==========================================================================
  let isDraggingShade = false;
  let shadeStartY = 0;
  let currentShadePercent = 0;

  function playShadeMechanicalSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch (e) {}
  }

  function setShadePull(percent, animate = false) {
    currentShadePercent = Math.max(0, Math.min(100, percent));
    document.documentElement.style.setProperty('--window-shade-pull', `${currentShadePercent}%`);
    if (windowShade) {
      windowShade.classList.toggle('animating', animate);
      windowShade.classList.toggle('closed', currentShadePercent > 85);
    }
  }

  if (shadeHandle && windowShade) {
    shadeHandle.addEventListener('pointerdown', (e) => {
      isDraggingShade = true;
      shadeStartY = e.clientY;
      windowShade.classList.remove('animating');
      shadeHandle.setPointerCapture(e.pointerId);
      playShadeMechanicalSound();
    });

    window.addEventListener('pointermove', (e) => {
      if (!isDraggingShade) return;
      const portalEl = document.getElementById('airplaneWindowPortal');
      const portalHeight = portalEl ? portalEl.clientHeight : 500;
      const deltaY = e.clientY - shadeStartY;
      const addedPct = (deltaY / portalHeight) * 100;
      setShadePull(currentShadePercent + addedPct);
      shadeStartY = e.clientY;
      if (Math.abs(deltaY) > 8) playShadeMechanicalSound();
    });

    window.addEventListener('pointerup', () => {
      if (!isDraggingShade) return;
      isDraggingShade = false;
      // Snap to closed if > 60%, else snap open
      if (currentShadePercent > 55) {
        setShadePull(92, true);
      } else {
        setShadePull(0, true);
      }
      playShadeMechanicalSound();
    });

    // Tap handle to toggle
    shadeHandle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentShadePercent > 30) {
        setShadePull(0, true);
      } else {
        setShadePull(92, true);
      }
      playShadeMechanicalSound();
    });
  }

  // ==========================================================================
  // 8. STANDOUT FEATURE: AUTHENTIC TWO-TONE CABIN CHIME ("Ding-Dong!")
  // ==========================================================================
  function playCabinTwoToneChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Tone 1: High tone (D5 - 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain1.gain.setValueAtTime(0.28, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(ctx.currentTime);
      osc1.stop(ctx.currentTime + 0.45);

      // Tone 2: Low chime tone (A4 - 440 Hz) starting slightly after
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(440.00, ctx.currentTime + 0.22);
      gain2.gain.setValueAtTime(0.001, ctx.currentTime);
      gain2.gain.setValueAtTime(0.32, ctx.currentTime + 0.22);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.85);

      // Flash overhead seatbelt sign
      if (seatbeltSign) {
        seatbeltSign.style.boxShadow = '0 0 24px rgba(131, 224, 181, 0.7)';
        setTimeout(() => { seatbeltSign.style.boxShadow = ''; }, 900);
      }
    } catch (e) {}
  }

  if (seatbeltSign) {
    seatbeltSign.addEventListener('click', () => {
      playCabinTwoToneChime();
    });
  }

  // Play subtle chime on boarding entry
  setTimeout(() => {
    playCabinTwoToneChime();
  }, 1200);

  // ==========================================================================
  // 9. STANDOUT FEATURE: SEAT 01A FIRST CLASS SMART TINT
  // ==========================================================================
  const savedFlightData = JSON.parse(localStorage.getItem('focusFlightActive') || '{}');
  if (savedFlightData?.seat === '01A' && smartTintGlass) {
    let tintLevel = 0;
    const tintLevels = [0, 0.25, 0.5, 0.75, 0.9];
    
    // Add Smart Tint button to deck
    const deckRow = document.querySelector('.cruise-media-deck .deck-row:last-child');
    if (deckRow) {
      const tintBtn = document.createElement('button');
      tintBtn.className = 'deck-btn';
      tintBtn.id = 'smartTintBtn';
      tintBtn.title = 'Adjust Boeing 787 Electrochromic Smart Tint Window';
      tintBtn.innerHTML = '<span>🔘 Tint: 0</span>';
      tintBtn.addEventListener('click', () => {
        tintLevel = (tintLevel + 1) % tintLevels.length;
        document.documentElement.style.setProperty('--tint-opacity', String(tintLevels[tintLevel]));
        tintBtn.innerHTML = `<span>🔘 Tint: ${tintLevel}</span>`;
        playShadeMechanicalSound();
      });
      deckRow.appendChild(tintBtn);
    }
  }

  // ==========================================================================
  // 10. STANDOUT FEATURE: IN-FLIGHT TRAY TABLE / FOCUS MISSION NOTEPAD
  // ==========================================================================
  if (trayToggle && trayDrawer) {
    trayToggle.addEventListener('click', () => {
      trayDrawer.classList.toggle('open');
    });
  }

  if (trayClose && trayDrawer) {
    trayClose.addEventListener('click', () => {
      trayDrawer.classList.remove('open');
    });
  }

  // Restore saved task & notes from localStorage
  if (trayTaskInput) {
    trayTaskInput.value = localStorage.getItem('flylofi_flight_task') || '';
    trayTaskInput.addEventListener('input', () => {
      localStorage.setItem('flylofi_flight_task', trayTaskInput.value);
    });
  }

  if (trayTaskDone) {
    trayTaskDone.checked = localStorage.getItem('flylofi_flight_task_done') === 'true';
    trayTaskDone.addEventListener('change', () => {
      localStorage.setItem('flylofi_flight_task_done', String(trayTaskDone.checked));
      if (trayTaskDone.checked) {
        playCabinTwoToneChime();
      }
    });
  }

  if (trayNotesInput) {
    trayNotesInput.value = localStorage.getItem('flylofi_flight_notes') || '';
    trayNotesInput.addEventListener('input', () => {
      localStorage.setItem('flylofi_flight_notes', trayNotesInput.value);
    });
  }

  // 11. Server Media Auto-Discovery (/api/media)
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
      } catch (e) {}
    }

    if (!Array.isArray(mediaFiles)) return;

    mediaFiles.forEach((file) => {
      const lower = file.name.toLowerCase();

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

  // Flight Navigation Return Button
  const returnBtn = document.getElementById('cruiseReturnBtn');
  if (returnBtn) {
    returnBtn.addEventListener('click', () => {
      if (window.self !== window.top) {
        window.parent.postMessage({ type: 'flylofi-exit-cruise' }, '*');
      } else {
        window.location.href = 'app.html';
      }
    });
  }

  // Legacy Global API Aliases
  window.FlyLofiAudio = {
    play: startTrackPlayback,
    pause: () => { lofiAudio.pause(); updatePlayButtonUI(false); },
    togglePlay: togglePlayPause,
    toggleCabin: toggleCabin,
    setVolume: (val) => {
      if (volumeSlider) volumeSlider.value = String(val);
      updateAudioVolumes();
    },
    loadScene: loadVideoScene,
    playChime: playCabinTwoToneChime,
    setShade: setShadePull
  };
})();
