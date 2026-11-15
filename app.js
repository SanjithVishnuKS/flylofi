const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
let toastTimer;

function showToast(message) {
  toastText.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function selectView(view) {
  document.querySelectorAll('.nav-item').forEach((nav) => nav.classList.toggle('active', nav.dataset.view === view));
  const label = view === 'storage' ? 'Media library' : view.charAt(0).toUpperCase() + view.slice(1);
  document.querySelector('.breadcrumb strong').textContent = label;
  const isMedia = view === 'storage';
  document.getElementById('mediaWorkspace').hidden = !isMedia;
  document.getElementById('overviewContent').hidden = isMedia;
  if (isMedia) loadServerMedia();
  showToast(`${label} view selected`);
}

document.querySelectorAll('.nav-item, [data-view]').forEach((item) => {
  item.addEventListener('click', () => {
    const view = item.dataset.view;
    if (!view) return;
    selectView(view);
  });
});

document.querySelectorAll('.segment').forEach((segment) => {
  segment.addEventListener('click', () => {
    document.querySelectorAll('.segment').forEach((item) => item.classList.remove('active'));
    segment.classList.add('active');
    showToast(`Showing resource data for ${segment.textContent}`);
  });
});

document.getElementById('refreshButton').addEventListener('click', (event) => {
  const button = event.currentTarget;
  const icon = button.querySelector('.refresh-icon');
  icon.style.transform = 'rotate(360deg)';
  icon.style.transition = 'transform .45s ease';
  document.getElementById('lastSync').textContent = 'just now';
  showToast('Environment data refreshed');
  setTimeout(() => { icon.style.transform = ''; }, 500);
});

document.getElementById('deployButton').addEventListener('click', () => showToast('Deployment workflow opened'));
document.getElementById('terminalButton').addEventListener('click', () => showToast('Secure terminal session requested'));
document.querySelectorAll('.row-menu').forEach((button) => button.addEventListener('click', () => showToast(`${button.getAttribute('aria-label').replace(' actions', '')} actions opened`)));

document.getElementById('serviceSearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('#serviceTable tr').forEach((row) => {
    row.hidden = !row.textContent.toLowerCase().includes(query);
  });
});

document.querySelectorAll('.media-filter').forEach((filter) => {
  filter.addEventListener('click', () => {
    const type = filter.dataset.mediaFilter;
    document.querySelectorAll('.media-filter').forEach((item) => item.classList.toggle('active', item === filter));
    document.querySelectorAll('.media-file-row').forEach((row) => { row.hidden = type !== 'all' && row.dataset.mediaType !== type; });
    const visible = document.querySelectorAll('.media-file-row:not([hidden])').length;
    document.getElementById('mediaSummary').textContent = type === 'all' ? '48 files' : `${visible} visible files`;
  });
});

document.getElementById('mediaSearch').addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase();
  document.querySelectorAll('.media-file-row').forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  document.getElementById('mediaSummary').textContent = `${document.querySelectorAll('.media-file-row:not([hidden])').length} matching files`;
});

document.querySelectorAll('.file-action').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action} opened`)));
document.getElementById('uploadButton').addEventListener('click', () => showToast('Secure media upload opened'));
document.getElementById('newFolderButton').addEventListener('click', () => showToast('New server folder dialog opened'));

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

async function loadServerMedia() {
  try {
    const response = await fetch('/api/media');
    if (!response.ok) return;
    const files = await response.json();
    const list = document.getElementById('mediaFileList');
    list.innerHTML = files.map((file) => `<div class="media-file-row" data-media-type="${file.type}"><div class="file-thumb ${file.type}-thumb"><span>${file.type === 'video' ? '▶' : file.type === 'audio' ? '◖' : '▧'}</span><small>${file.name.split('.').pop().toUpperCase()}</small></div><div class="file-info"><strong>${file.name}</strong><span>${file.path} <b>·</b> ${formatBytes(file.size)}</span></div><span class="file-modified">${new Date(file.modified).toLocaleDateString()}</span><span class="file-access">Server file</span><button class="file-action" data-action="Open ${file.name}">Open</button></div>`).join('');
    document.getElementById('mediaSummary').textContent = `${files.length} files on server`;
    list.querySelectorAll('.file-action').forEach((button) => button.addEventListener('click', () => showToast(`${button.dataset.action} requested`)));
  } catch (error) {
    // Direct file access has no API; the bundled demo media remains available.
  }
}

setInterval(() => {
  const seconds = Math.floor(Math.random() * 8) + 4;
  document.querySelector('.chart-updated').textContent = `Updated ${seconds} sec ago`;
}, 5000);
