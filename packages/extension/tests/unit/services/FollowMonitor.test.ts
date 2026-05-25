import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FollowMonitor } from '../../../src/bundle/services/FollowMonitor.js';
import { dbService } from '../../../src/bundle/services/DatabaseService.js';
import { ACTION_TYPES, ACTION_SOURCES } from '../../../src/constants/Constants.js';

const realDocument = globalThis._jsdomDocument || document;

function createFollowButton(username = 'john_doe') {
  document.body.innerHTML = `
    <div>
      <a href="/${username}/">@${username}</a>
      <button type="button">Seguir</button>
    </div>
  `;

  return document.querySelector('button') as HTMLButtonElement;
}

describe('FollowMonitor', () => {
  let monitor: FollowMonitor;
  let savedDocument: Document;
  let originalLocation: Location;

  async function flushAsync(): Promise<void> {
    await Promise.resolve();
    await Promise.resolve();
    await new Promise(resolve => setTimeout(resolve, 0));
    await Promise.resolve();
  }

  beforeEach(() => {
    savedDocument = global.document;
    global.document = realDocument;
    document.body.innerHTML = '';

    originalLocation = global.location;
    Object.defineProperty(global, 'location', {
      configurable: true,
      value: {
        pathname: '/john_doe/'
      }
    });

    dbService.getAllActions = jest.fn(async () => [] as any);
    dbService.logAction = jest.fn(async () => 'action-id') as any;

    monitor = new FollowMonitor();
    monitor.start();
  });

  afterEach(() => {
    monitor.stop();
    document.body.innerHTML = '';
    global.document = savedDocument;
    Object.defineProperty(global, 'location', {
      configurable: true,
      value: originalLocation
    });
  });

  it('deve substituir o botão por confirmação inline quando houver histórico de auto unfollow', async () => {
    (dbService.getAllActions as jest.Mock).mockResolvedValue([
      {
        username: 'john_doe',
        actionType: ACTION_TYPES.UNFOLLOW,
        source: ACTION_SOURCES.AUTO,
        timestamp: Date.now()
      }
    ]);

    const button = createFollowButton();
    const nativeHandler = jest.fn();
    button.addEventListener('click', nativeHandler);

    button.click();
    await flushAsync();

    const confirmation = document.querySelector('.iu-follow-confirmation');
    expect(confirmation).not.toBeNull();
    expect(button.style.display).toBe('none');
    expect(nativeHandler).toHaveBeenCalledTimes(0);
  });

  it('deve confirmar re-follow e liberar o clique nativo uma vez', async () => {
    (dbService.getAllActions as jest.Mock).mockResolvedValue([
      {
        username: 'john_doe',
        actionType: ACTION_TYPES.UNFOLLOW,
        source: ACTION_SOURCES.AUTO,
        timestamp: Date.now()
      }
    ]);

    const button = createFollowButton();
    const clickSpy = jest.spyOn(button, 'click');

    button.click();
    await flushAsync();

    const confirmButton = document.querySelector('.iu-follow-confirmation-btn-confirm') as HTMLButtonElement;
    confirmButton.click();
    await flushAsync();

    expect(dbService.logAction).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'john_doe',
      username: 'john_doe',
      actionType: ACTION_TYPES.RE_FOLLOW_ACCEPTED,
      source: ACTION_SOURCES.MANUAL
    }));
    expect(document.querySelector('.iu-follow-confirmation')).toBeNull();
    expect(button.style.display).toBe('');
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });

  it('deve cancelar re-follow sem liberar o clique nativo', async () => {
    (dbService.getAllActions as jest.Mock).mockResolvedValue([
      {
        username: 'john_doe',
        actionType: ACTION_TYPES.UNFOLLOW,
        source: ACTION_SOURCES.AUTO,
        timestamp: Date.now()
      }
    ]);

    const button = createFollowButton();
    const nativeHandler = jest.fn();
    button.addEventListener('click', nativeHandler);

    button.click();
    await flushAsync();

    const cancelButton = document.querySelector('.iu-follow-confirmation-btn-cancel') as HTMLButtonElement;
    cancelButton.click();
    await Promise.resolve();
    await Promise.resolve();

    expect(dbService.logAction).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'john_doe',
      username: 'john_doe',
      actionType: ACTION_TYPES.RE_FOLLOW_REJECTED,
      source: ACTION_SOURCES.MANUAL
    }));
    expect(document.querySelector('.iu-follow-confirmation')).toBeNull();
    expect(button.style.display).toBe('');
    expect(nativeHandler).toHaveBeenCalledTimes(0);
  });

  it('deve registrar follow normal e liberar o clique quando não houver histórico', async () => {
    const button = createFollowButton();
    const clickSpy = jest.spyOn(button, 'click');

    button.click();
    await flushAsync();
    await flushAsync();

    expect(dbService.logAction).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'john_doe',
      username: 'john_doe',
      actionType: ACTION_TYPES.FOLLOW,
      source: ACTION_SOURCES.MANUAL
    }));
    expect(document.querySelector('.iu-follow-confirmation')).toBeNull();
    expect(clickSpy).toHaveBeenCalledTimes(2);
  });
});
