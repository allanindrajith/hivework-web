/**
 * Copies text to the user's clipboard using navigator.clipboard when available,
 * falling back to document.execCommand('copy') in environments like HTTP preview.
 */
export async function copyText(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy execCommand fallback
    }
  }

  if (typeof document === 'undefined') {
    return false;
  }

  let textArea: HTMLTextAreaElement | null = null;
  try {
    textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.top = '-9999px';
    textArea.style.left = '-9999px';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const successful = document.execCommand('copy');
    return Boolean(successful);
  } catch {
    return false;
  } finally {
    if (textArea && textArea.parentNode === document.body) {
      document.body.removeChild(textArea);
    }
  }
}
