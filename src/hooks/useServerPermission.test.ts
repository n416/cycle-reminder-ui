import { renderHook } from '@testing-library/react';
import { useServerPermission } from './useServerPermission';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAppSelector } from '@/app/hooks';

// --- GIVEN (前提条件) ---
vi.mock('@/app/hooks', () => ({
  useAppSelector: vi.fn(),
  useAppDispatch: vi.fn(() => vi.fn()),
}));

const mockedUseAppSelector = vi.mocked(useAppSelector);

const mockServers = [
  { id: 'admin-server', name: '管理者サーバー', role: 'admin' },
  { id: 'member-server', name: '一般サーバー', role: 'member' },
];

const mockStateFactory = ({ role, servers, tokens }: { role: 'owner' | 'supporter' | 'tester', servers: any[], tokens: { [key: string]: string } }) => 
  (selector: (state: any) => any) => {
    const mockState = {
      auth: { userRole: role, writeTokens: tokens },
      servers: { servers: servers, status: 'succeeded' },
    };
    return selector(mockState);
};

// --- WHEN (操作) & THEN (結果) ---
describe('フィーチャー: 権限管理ロジック', () => {

  beforeEach(() => {
    mockedUseAppSelector.mockClear();
  });

  describe('シナリオ: ユーザーがオーナーの場合', () => {
    it('もしDiscord管理者であれば、すべての操作権限を持つべきである', () => {
      mockedUseAppSelector.mockImplementation(mockStateFactory({ role: 'owner', servers: mockServers, tokens: {} }));
      const { result } = renderHook(() => useServerPermission('admin-server'));
      
      expect(result.current.canCreate).toBe(true);
      expect(result.current.canEdit).toBe(true);
      expect(result.current.canManageServerSettings).toBe(true);
      expect(result.current.canViewLogs).toBe(true);
      expect(result.current.canManipulateLogs).toBe(true);
    });

    it('もしDiscord管理者でなければ、いかなる権限も持たないべきである', () => {
      mockedUseAppSelector.mockImplementation(mockStateFactory({ role: 'owner', servers: mockServers, tokens: {} }));
      const { result } = renderHook(() => useServerPermission('member-server'));

      expect(result.current.canCreate).toBe(false);
      expect(result.current.canEdit).toBe(false);
      expect(result.current.canManageServerSettings).toBe(false);
    });
  });

  describe('シナリオ: ユーザーがサポーターの場合', () => {
    it('もしDiscord管理者で、かつサーバーにパスワードがない場合、編集とログ閲覧の権限を持つべきである', () => {
      mockedUseAppSelector.mockImplementation(mockStateFactory({ role: 'supporter', servers: mockServers, tokens: { 'admin-server': 'valid-token' } }));
      const { result } = renderHook(() => useServerPermission('admin-server'));

      expect(result.current.canCreate).toBe(false);
      expect(result.current.canEdit).toBe(true);
      expect(result.current.canViewLogs).toBe(true);
      expect(result.current.isLockedByPassword).toBe(false);
    });

    it('もしDiscord管理者で、かつサーバーにパスワードがある場合、ログ閲覧権限のみを持ち、ロックされているべきである', () => {
       mockedUseAppSelector.mockImplementation(mockStateFactory({ role: 'supporter', servers: mockServers, tokens: {} }));
       const { result } = renderHook(() => useServerPermission('admin-server'));

      expect(result.current.canEdit).toBe(false);
      expect(result.current.canViewLogs).toBe(true);
      expect(result.current.isLockedByPassword).toBe(true);
    });
  });
});