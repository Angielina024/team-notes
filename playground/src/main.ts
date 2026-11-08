import './style.css';

const root = document.documentElement;

const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
if (themeToggle) {
  themeToggle.setAttribute('aria-pressed', String(root.classList.contains('dark')));
  themeToggle.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    themeToggle.setAttribute('aria-pressed', String(isDark));
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

const menuButton = document.querySelector<HTMLButtonElement>('#menu-button');
const mobileMenu = document.querySelector<HTMLElement>('#mobile-menu');
if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
    menuButton.setAttribute('aria-expanded', String(!isOpen));
    mobileMenu.classList.toggle('hidden', isOpen);
  });
}

type Field = HTMLInputElement | HTMLTextAreaElement;

function errorText(field: Field): string {
  if (field.validity.valueMissing) return field.dataset.errorMissing ?? 'Заповни це поле.';
  if (field.validity.tooShort) return `Потрібно щонайменше ${field.minLength} символів.`;
  return '';
}

function validate(field: Field): boolean {
  const message = errorText(field);
  const error = document.getElementById(`${field.id}-error`);
  if (error) error.textContent = message;
  if (message) field.setAttribute('aria-invalid', 'true');
  else field.removeAttribute('aria-invalid');
  return message === '';
}

const form = document.querySelector<HTMLFormElement>('#new-note');
const formStatus = document.querySelector<HTMLElement>('#form-status');
if (form && formStatus) {
  form.noValidate = true;
  const fields = Array.from(form.querySelectorAll<Field>('[required]'));

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const invalid = fields.filter((field) => !validate(field));
    if (invalid.length > 0) {
      formStatus.textContent = '';
      invalid[0]?.focus();
      return;
    }
    formStatus.textContent = 'Нотатку збережено (демо: дані нікуди не надсилаються).';
    form.reset();
  });

  form.addEventListener('input', (event) => {
    const target = event.target;
    const isField = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
    if (isField && target.getAttribute('aria-invalid') === 'true') validate(target);
  });
}
