// Testes unitários - FloatingPanel component
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { FloatingPanel } from '../../../src/bundle/components/FloatingPanel.js';

// Salva referência ao document real do jsdom (jest.setup.js sobrescreve com mock)
const realDocument = globalThis._jsdomDocument || document;

function createBaseProps(overrides = {}) {
  return {
    isExpanded: false,
    isScanning: false,
    isPaused: false,
    isScanCompleted: false,
    isUnfollowing: false,
    isUnfollowModalOpen: false,
    scanProgress: 0,
    unfollowProgress: 0,
    nonFollowers: [],
    selectedUsers: new Set(),
    whitelist: new Set(),
    activeTab: 'non_whitelisted',
    searchQuery: '',
    unfollowLog: [],
    stealthMode: false,
    onToggleExpand: jest.fn(),
    onToggle: jest.fn(),
    onStartScan: jest.fn(),
    onTogglePause: jest.fn(),
    onCancelScan: jest.fn(),
    onStartUnfollow: jest.fn(),
    onToggleUser: jest.fn(),
    onToggleAll: jest.fn(),
    onToggleWhitelist: jest.fn(),
    onChangeTab: jest.fn(),
    onSearch: jest.fn(),
    onOpenHistory: jest.fn(),
    ...overrides
  };
}

function createMockUser(id, username, overrides = {}) {
  return {
    getId: () => String(id),
    getUsername: () => username || `user_${id}`,
    getFullName: () => overrides.fullName || `User ${id}`,
    getProfilePicUrl: () => 'https://instagram.com/pic.jpg',
    isVerified: () => overrides.verified || false,
    isPrivate: () => overrides.isPrivate || false,
    followsViewer: () => overrides.followsViewer || false,
    toObject: () => ({
      id: String(id),
      username: username || `user_${id}`,
      full_name: overrides.fullName || `User ${id}`,
      profile_pic_url: 'https://instagram.com/pic.jpg',
      is_verified: overrides.verified || false,
      is_private: overrides.isPrivate || false,
      follows_viewer: overrides.followsViewer || false
    })
  };
}

describe('FloatingPanel', () => {
  let panel;
  let savedDocument;

  beforeEach(() => {
    // jest.setup.js sobrescreve document com mock simplificado;
    // FloatingPanel precisa do document real do jsdom
    savedDocument = global.document;
    global.document = realDocument;
    panel = new FloatingPanel();
  });

  afterEach(() => {
    global.document = savedDocument;
  });

  describe('render', () => {
    it('deve criar elemento com classe iu-floating-panel', () => {
      const props = createBaseProps();
      const element = panel.render(props);

      expect(element).toBeDefined();
      expect(element.classList.contains('iu-floating-panel')).toBe(true);
    });

    it('deve criar toggle button quando não expandido', () => {
      const props = createBaseProps({ isExpanded: false });
      const element = panel.render(props);

      const toggleBtn = element.querySelector('.iu-toggle-button');
      expect(toggleBtn).not.toBeNull();
    });

    it('não deve criar toggle button com modal de unfollow aberto', () => {
      const props = createBaseProps({
        isExpanded: false,
        isUnfollowModalOpen: true
      });
      const element = panel.render(props);

      const toggleBtn = element.querySelector('.iu-toggle-button');
      expect(toggleBtn).toBeNull();
    });

    it('deve criar conteúdo quando expandido', () => {
      const props = createBaseProps({ isExpanded: true });
      const element = panel.render(props);

      const content = element.querySelector('.iu-content');
      expect(content).not.toBeNull();
    });

    it('deve ter classe iu-expanded quando expandido', () => {
      const props = createBaseProps({ isExpanded: true });
      const element = panel.render(props);

      expect(element.classList.contains('iu-expanded')).toBe(true);
    });

    it('não deve ter classe iu-expanded quando não expandido', () => {
      const props = createBaseProps({ isExpanded: false });
      const element = panel.render(props);

      expect(element.classList.contains('iu-expanded')).toBe(false);
    });
  });

  describe('badge', () => {
    it('deve mostrar contagem de não-seguidores no badge', () => {
      const users = Array.from({ length: 5 }, (_, i) => createMockUser(i));
      const props = createBaseProps({ nonFollowers: users });
      const element = panel.render(props);

      const badge = element.querySelector('.iu-badge');
      expect(badge).not.toBeNull();
      expect(badge.textContent).toBe('5');
    });

    it('deve truncar para "99+" via _updateBadge', () => {
      // Badge 99+ é aplicada via _updateBadge, não no render inicial
      const users5 = Array.from({ length: 5 }, (_, i) => createMockUser(i));
      const props = createBaseProps({ nonFollowers: users5 });
      panel.render(props);

      const users150 = Array.from({ length: 150 }, (_, i) => createMockUser(i));
      const props2 = createBaseProps({ nonFollowers: users150 });
      panel.update(props2);

      const badge = panel.element.querySelector('.iu-badge');
      expect(badge.textContent).toBe('99+');
    });

    it('não deve mostrar badge quando sem não-seguidores', () => {
      const props = createBaseProps({ nonFollowers: [] });
      const element = panel.render(props);

      const badge = element.querySelector('.iu-badge');
      expect(badge).toBeNull();
    });
  });

  describe('toggle button', () => {
    it('deve chamar onToggle ao clicar', () => {
      const onToggle = jest.fn();
      const props = createBaseProps({ onToggle });
      const element = panel.render(props);

      const toggleBtn = element.querySelector('.iu-toggle-button');
      toggleBtn.click();

      expect(onToggle).toHaveBeenCalled();
    });

    it('deve exibir ícone PNG no botão toggle', () => {
      const props = createBaseProps();
      const element = panel.render(props);

      const toggleBtn = element.querySelector('.iu-toggle-button');
      const img = toggleBtn.querySelector('img');
      expect(img).not.toBeNull();
    });
  });

  describe('header (expandido)', () => {
    it('deve ter header com título GhostGram', () => {
      const props = createBaseProps({ isExpanded: true });
      const element = panel.render(props);

      const header = element.querySelector('.iu-header');
      expect(header).not.toBeNull();

      const title = header.querySelector('h3');
      expect(title).not.toBeNull();
      expect(title.textContent).toContain('GhostGram');
    });

    it('deve ter botão de minimizar', () => {
      const props = createBaseProps({ isExpanded: true });
      const element = panel.render(props);

      const minimizeBtn = element.querySelector('.iu-minimize-btn');
      expect(minimizeBtn).not.toBeNull();
    });
  });

  describe('start section', () => {
    it('deve mostrar seção inicial quando não escaneando', () => {
      const props = createBaseProps({
        isExpanded: true,
        isScanning: false,
        isScanCompleted: false,
        isUnfollowing: false
      });
      const element = panel.render(props);

      const startSection = element.querySelector('.iu-start-section');
      expect(startSection).not.toBeNull();
    });

    it('deve ter botão de iniciar scan', () => {
      const props = createBaseProps({ isExpanded: true });
      const element = panel.render(props);

      const buttons = element.querySelectorAll('.iu-button');
      const scanBtn = Array.from(buttons).find(b =>
        b.textContent.toLowerCase().includes('scan') ||
        b.textContent.toLowerCase().includes('iniciar')
      );
      expect(scanBtn).not.toBeNull();
    });
  });

  describe('progress section', () => {
    it('deve mostrar barra de progresso durante scan', () => {
      const props = createBaseProps({
        isExpanded: true,
        isScanning: true,
        scanProgress: 50
      });
      const element = panel.render(props);

      const progressBar = element.querySelector('.iu-progress-fill');
      expect(progressBar).not.toBeNull();
    });
  });

  describe('results section', () => {
    it('deve mostrar resultados quando scan completo', () => {
      const users = [createMockUser(1), createMockUser(2)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users
      });
      const element = panel.render(props);

      const resultsSection = element.querySelector('.iu-results-section');
      expect(resultsSection).not.toBeNull();
    });

    it('deve exibir whitelist zerada quando não houver usuários visíveis na whitelist', () => {
      const users = [createMockUser(1), createMockUser(2)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users,
        whitelist: new Set(['999'])
      });
      const element = panel.render(props);

      const tabs = element.querySelectorAll('.iu-tab');
      expect(tabs[1].textContent).toContain('Whitelist (0)');
    });

    it('deve mostrar tabs (abas)', () => {
      const users = [createMockUser(1)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users
      });
      const element = panel.render(props);

      const tabs = element.querySelectorAll('.iu-tab');
      expect(tabs.length).toBeGreaterThanOrEqual(2);
    });

    it('deve mostrar lista de usuários', () => {
      const users = [createMockUser(1), createMockUser(2)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users
      });
      const element = panel.render(props);

      const userItems = element.querySelectorAll('.iu-user-item');
      expect(userItems.length).toBeGreaterThanOrEqual(2);
    });

    it('deve ter container de busca quando há 2+ usuários', () => {
      const users = [createMockUser(1), createMockUser(2)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users
      });
      const element = panel.render(props);

      const searchContainer = element.querySelector('.iu-search-container');
      expect(searchContainer).not.toBeNull();
    });
  });

  describe('update', () => {
    it('deve atualizar badge ao mudar contagem', () => {
      const props1 = createBaseProps({ nonFollowers: [createMockUser(1)] });
      panel.render(props1);

      const users = Array.from({ length: 10 }, (_, i) => createMockUser(i));
      const props2 = createBaseProps({ nonFollowers: users });
      panel.update(props2);

      const badge = panel.element.querySelector('.iu-badge');
      expect(badge.textContent).toBe('10');
    });

    it('deve adicionar classe iu-sliding-out ao colapsar', () => {
      const propsExpanded = createBaseProps({ isExpanded: true });
      panel.render(propsExpanded);

      const content = panel.element.querySelector('.iu-content');
      expect(content).not.toBeNull();

      const propsCollapsed = createBaseProps({ isExpanded: false });
      panel.update(propsCollapsed);

      // Content deve ter a classe de animação slide-out
      expect(content.classList.contains('iu-sliding-out')).toBe(true);
    });

    it('deve expandir quando isExpanded muda para true', () => {
      const props1 = createBaseProps({ isExpanded: false });
      panel.render(props1);

      const props2 = createBaseProps({ isExpanded: true });
      panel.update(props2);

      expect(panel.element.classList.contains('iu-expanded')).toBe(true);
      expect(panel.element.querySelector('.iu-content')).not.toBeNull();
    });

    it('deve esconder toggle button ao abrir modal de unfollow', () => {
      const props1 = createBaseProps({ isExpanded: false });
      panel.render(props1);

      const props2 = createBaseProps({
        isExpanded: false,
        isUnfollowModalOpen: true
      });
      panel.update(props2);

      expect(panel.element.querySelector('.iu-toggle-button')).toBeNull();
    });

    it('deve recriar toggle button ao fechar modal de unfollow', () => {
      const props1 = createBaseProps({
        isExpanded: false,
        isUnfollowModalOpen: true
      });
      panel.render(props1);

      const props2 = createBaseProps({
        isExpanded: false,
        isUnfollowModalOpen: false,
        nonFollowers: [createMockUser(1)]
      });
      panel.update(props2);

      const toggleBtn = panel.element.querySelector('.iu-toggle-button');
      expect(toggleBtn).not.toBeNull();
      expect(toggleBtn.querySelector('.iu-badge')?.textContent).toBe('1');
    });
  });

  describe('footer', () => {
    it('deve ter botões de ação quando scan completo', () => {
      const users = [createMockUser(1), createMockUser(2)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users
      });
      const element = panel.render(props);

      const footer = element.querySelector('.iu-footer');
      expect(footer).not.toBeNull();
    });
  });

  describe('deduplicação na renderização', () => {
    it('deve renderizar apenas 1 vez quando houver usuários duplicados em nonFollowers', () => {
      const u1 = createMockUser('1', 'user1');
      const u1Dup = createMockUser('1', 'user1');
      const u2 = createMockUser('2', 'user2');

      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: [u1, u1Dup, u2]
      });

      const element = panel.render(props);
      const userItems = element.querySelectorAll('.iu-user-item');
      expect(userItems.length).toBe(2);
    });
  });

  describe('cooldown de unfollow (24h após erro 400)', () => {
    it('deve desabilitar botão de unfollow e exibir tempo restante quando unfollowBlockUntil estiver ativo', () => {
      const users = [createMockUser(1)];
      const blockUntil = Date.now() + 2 * 60 * 60 * 1000; // 2 horas no futuro
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users,
        selectedUsers: new Set(['1']),
        unfollowBlockUntil: blockUntil
      });
      const element = panel.render(props);

      const unfollowBtn = element.querySelector('.iu-button-danger');
      expect(unfollowBtn).not.toBeNull();
      expect(unfollowBtn.disabled).toBe(true);
      expect(unfollowBtn.textContent).toContain('Bloqueado');
      expect(unfollowBtn.title).toContain('400');
    });

    it('deve habilitar botão de unfollow normalmente quando unfollowBlockUntil for nulo', () => {
      const users = [createMockUser(1)];
      const props = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users,
        selectedUsers: new Set(['1']),
        unfollowBlockUntil: null
      });
      const element = panel.render(props);

      const unfollowBtn = element.querySelector('.iu-button-danger');
      expect(unfollowBtn).not.toBeNull();
      expect(unfollowBtn.disabled).toBe(false);
      expect(unfollowBtn.textContent).toContain('Deixar de seguir (1)');
    });

    it('deve atualizar o botão no update() quando unfollowBlockUntil for ativado', () => {
      const users = [createMockUser(1)];
      const propsInitial = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users,
        selectedUsers: new Set(['1']),
        unfollowBlockUntil: null
      });
      panel.render(propsInitial);

      const unfollowBtn = panel.element.querySelector('.iu-button-danger');
      expect(unfollowBtn.disabled).toBe(false);

      const blockUntil = Date.now() + 60 * 60 * 1000; // 1 hora
      const propsBlocked = createBaseProps({
        isExpanded: true,
        isScanCompleted: true,
        nonFollowers: users,
        selectedUsers: new Set(['1']),
        unfollowBlockUntil: blockUntil
      });
      panel.update(propsBlocked);

      expect(unfollowBtn.disabled).toBe(true);
      expect(unfollowBtn.textContent).toContain('Bloqueado');
    });

    it('deve exibir feedback de checkpoint e desabilitar botão Iniciar Scan quando scanBlockUntil estiver ativo', () => {
      const blockUntil = Date.now() + 10 * 60 * 1000;
      const props = createBaseProps({
        isExpanded: true,
        isScanning: false,
        isScanCompleted: false,
        scanBlockUntil: blockUntil
      });
      const element = panel.render(props);

      const alert = element.querySelector('.iu-scan-alert-checkpoint');
      expect(alert).not.toBeNull();
      expect(alert.textContent).toContain('Proteção de Conta / Checkpoint');
      expect(alert.textContent).toContain('verificação de segurança');

      const scanBtn = element.querySelector('.iu-button-primary');
      expect(scanBtn).not.toBeNull();
      expect(scanBtn.disabled).toBe(true);
      expect(scanBtn.textContent).toContain('Aguarde');
    });

    it('deve atualizar startSection no update() quando scanBlockUntil for acionado', () => {
      const propsInitial = createBaseProps({
        isExpanded: true,
        isScanning: false,
        isScanCompleted: false,
        scanBlockUntil: null
      });
      panel.render(propsInitial);

      let scanBtn = panel.element.querySelector('.iu-button-primary');
      expect(scanBtn.disabled).toBe(false);
      expect(scanBtn.textContent).toBe('Iniciar Scan');

      const blockUntil = Date.now() + 10 * 60 * 1000;
      const propsBlocked = createBaseProps({
        isExpanded: true,
        isScanning: false,
        isScanCompleted: false,
        scanBlockUntil: blockUntil
      });
      panel.update(propsBlocked);

      scanBtn = panel.element.querySelector('.iu-button-primary');
      expect(scanBtn.disabled).toBe(true);
      expect(scanBtn.textContent).toContain('Aguarde');
      expect(panel.element.querySelector('.iu-scan-alert-checkpoint')).not.toBeNull();
    });
  });
});
