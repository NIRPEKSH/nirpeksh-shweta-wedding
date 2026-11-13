import { createGuestToken, invitationUrl } from './invite-token.js';
const form = document.querySelector('#guest-form');
const name = document.querySelector('#guest-name');
const result = document.querySelector('#link-result');
const status = document.querySelector('#maker-status');
const output = document.querySelector('#guest-url');
const preview = document.querySelector('#greeting-preview');
const createButton = document.querySelector('#create-link');
let revision = 0;
const greeting = () => name.value.trim() ? `Dear ${name.value.trim()}` : 'Dear Kunal';
name.addEventListener('input', () => {
  revision++;
  preview.textContent = greeting();
  result.hidden = true;
  output.value = '';
  document.querySelector('#open-link').removeAttribute('href');
  status.textContent = '';
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const currentRevision = revision;
  if (!name.value.trim()) { status.textContent = 'Please enter your guest’s name.'; name.focus(); return; }
  createButton.disabled = true;
  status.textContent = 'Preparing their invitation…';
  try {
    const token = await createGuestToken(greeting());
    if (currentRevision !== revision) return;
    const url = invitationUrl(new URL('./', location.href), token);
    output.value = url;
    document.querySelector('#open-link').href = url;
    result.hidden = false;
    status.textContent = `The invitation for ${name.value.trim()} is ready. Copy the link below.`;
  } catch (_) { status.textContent = 'The link could not be created. Please open this page in an up-to-date browser and try again.'; }
  finally { createButton.disabled = false; }
});
document.querySelector('#copy-link').addEventListener('click', async () => {
  if (!output.value) return;
  try { await navigator.clipboard.writeText(output.value); status.textContent = 'Link copied. It is ready to share with your guest.'; }
  catch (_) { output.focus(); output.select(); status.textContent = 'Select and copy the link above.'; }
});
