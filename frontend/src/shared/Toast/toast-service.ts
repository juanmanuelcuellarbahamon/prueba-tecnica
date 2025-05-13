import { createApp, nextTick } from 'vue';
import Toast from './Toast.vue';

let toastContainer: HTMLElement | null = null;

const defaultIcons: Record<string, string> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
};

function createToastContainer(): void {
  if (!toastContainer) {
    const existingContainer = document.getElementById('toast-container');
    if (existingContainer) {
      toastContainer = existingContainer;
      return;
    }

    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
    toastContainer = container;
    injectToastStyles();
  }
}

function injectToastStyles(): void {
  const styleId = 'toast-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      #toast-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 10px;
      }
    `;
    document.head.appendChild(style);
  }
}

function removeToastContainerIfEmpty(): void {
  if (toastContainer && toastContainer.children.length === 0) {
    toastContainer.remove();
    toastContainer = null;
  }
}

export function showToast(
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  icon?: string,
  duration: number = 5000
): void {
  const finalIcon = icon || defaultIcons[type];
  createToastContainer();

  // Create a ref to track the Toast component instance
  let toastComponent: InstanceType<typeof Toast> | undefined;

  // Create and mount the Toast instance
  const toastInstance = createApp(Toast, {
    message,
    type,
    icon: finalIcon,
    duration,
  });

  const toastElement = document.createElement('div');
  toastInstance.mount(toastElement);

  // Use a ref to track the component instance
  toastInstance.provide('$toastRef', {
    setComponent: (component: InstanceType<typeof Toast>) => {
      toastComponent = component;
    },
  });

  // Append the toast element to the container
  toastContainer?.appendChild(toastElement);

  // Wait for the component to mount and access its instance
  nextTick().then(() => {
    if (!toastComponent) {
      console.error('Toast component is not properly initialized.');
      return;
    }

    // Call the show method
    toastComponent.show();

    // Schedule the hide and cleanup
    setTimeout(() => {
      if (toastComponent && typeof toastComponent.hide === 'function') {
        toastComponent.hide();
      }

      // Unmount and remove the toast element
      toastInstance.unmount();
      toastElement.remove();

      removeToastContainerIfEmpty();
    }, duration + 100);
  });
}