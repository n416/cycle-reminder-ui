import { render, screen } from '@/test/test-utils';
import { ReminderList } from './ReminderList';
// ★★★★★ ここからが修正箇所です ★★★★★
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
// ★★★★★ ここまで ★★★★★
import { useServerPermission } from '@/hooks/useServerPermission';
import apiClient from '@/api/client';

// モックの設定
vi.mock('@/hooks/useServerPermission');
vi.mock('@/api/client');

const mockedUseServerPermission = vi.mocked(useServerPermission);
const mockedApiClient = vi.mocked(apiClient);

const baseMockState = {
  servers: {
    servers: [{ id: '1', name: 'テストサーバー', role: 'admin', isAdded: true }],
    status: 'succeeded',
  },
  reminders: {
    reminders: [],
    status: 'idle', 
  },
  missedNotifications: {
    notifications: [],
    status: 'idle',
  }
};

describe('ReminderListコンポーネントの権限テスト', () => {

  beforeEach(() => {
    // ★★★★★ ここからが修正箇所です ★★★★★
    // apiClient.getがVitestのモック関数であることをTypeScriptに明示的に伝える
    (mockedApiClient.get as Mock).mockResolvedValue({ data: [] });
    // ★★★★★ ここまで ★★★★★
  });

  it('オーナーは「サーバー設定」「操作ログ」「新規作成」ボタンが正しく表示されること', async () => {
    mockedUseServerPermission.mockReturnValue({
      canCreate: true,
      canEdit: true,
      canManageServerSettings: true,
      canViewLogs: true,
      canManipulateLogs: true,
      isLockedByPassword: false,
    });
    
    const ownerState = {
      ...baseMockState,
      auth: { userRole: 'owner', writeTokens: {} }
    };
    
    render(<ReminderList />, { 
      preloadedState: ownerState, 
      route: '/servers/1',
      path: '/servers/:serverId' 
    });

    expect(await screen.findByTestId('SettingsIcon')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /操作ログ/i })).toBeInTheDocument();
    expect(await screen.findByTestId('AddIcon')).toBeInTheDocument();
  });

  it('サポーター（ロック状態）は「編集ロックを解除」ボタンが表示され、他は表示されないこと', async () => {
    mockedUseServerPermission.mockReturnValue({
      canCreate: false,
      canEdit: false,
      canManageServerSettings: false,
      canViewLogs: true,
      canManipulateLogs: false,
      isLockedByPassword: true,
    });
    
    const supporterState = {
      ...baseMockState,
      auth: { userRole: 'supporter', writeTokens: {} }
    };
    
    render(<ReminderList />, { 
      preloadedState: supporterState, 
      route: '/servers/1',
      path: '/servers/:serverId' 
    });

    expect(await screen.findByRole('button', { name: /編集ロックを解除/i })).toBeInTheDocument();
    expect(screen.queryByTestId('SettingsIcon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('AddIcon')).not.toBeInTheDocument();
  });

  it('サポーター（ロック解除済み）は「編集ロックを解除」ボタンが表示されないこと', async () => {
    mockedUseServerPermission.mockReturnValue({
      canCreate: false,
      canEdit: true,
      canManageServerSettings: false,
      canViewLogs: true,
      canManipulateLogs: true,
      isLockedByPassword: false,
    });
    
    const stateWithReminder = {
      ...baseMockState,
      auth: { userRole: 'supporter', writeTokens: { '1': 'valid-token' } },
      reminders: {
        reminders: [{ id: 'r1', serverId: '1', message: 'テスト', recurrence: { type: 'none' }, status: 'active', channel: 'general', startTime: new Date().toISOString() }],
        status: 'succeeded',
      },
    };

    render(<ReminderList />, { 
      preloadedState: stateWithReminder, 
      route: '/servers/1',
      path: '/servers/:serverId' 
    });

    await screen.findByText('テストサーバー');
    
    expect(screen.queryByRole('button', { name: /編集ロックを解除/i })).not.toBeInTheDocument();
  });
});