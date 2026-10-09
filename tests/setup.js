import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());
beforeEach(() => { window.history.replaceState(null, '', '/'); });
if (!globalThis.ResizeObserver) globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
if (!globalThis.PointerEvent) globalThis.PointerEvent = MouseEvent;
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {};
if (!Element.prototype.hasPointerCapture) Element.prototype.hasPointerCapture = () => false;
if (!Element.prototype.setPointerCapture) Element.prototype.setPointerCapture = () => {};
if (!Element.prototype.releasePointerCapture) Element.prototype.releasePointerCapture = () => {};
