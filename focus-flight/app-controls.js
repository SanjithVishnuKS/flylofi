(() => {
  const durationOptions = document.querySelector('fieldset .options');
  if (!durationOptions) return;
  const customDuration = document.createElement('input');
  customDuration.id = 'customDuration';
  customDuration.className = 'custom-duration';
  customDuration.type = 'number';
  customDuration.min = '1';
  customDuration.max = '240';
  customDuration.placeholder = 'Custom min';
  customDuration.setAttribute('aria-label', 'Custom flight duration in minutes');
  durationOptions.append(customDuration);
  const durationInputs = [...document.querySelectorAll('input[name="duration"]')];
  durationInputs.forEach((input) => {
    input.dataset.duration = input.value;
    input.addEventListener('change', () => { input.value = input.dataset.duration; });
  });
  customDuration.addEventListener('input', () => {
    const selected = document.querySelector('input[name="duration"]:checked');
    if (selected && customDuration.value) selected.value = String(Math.max(1, Math.min(240, Number(customDuration.value))));
  });
})();
