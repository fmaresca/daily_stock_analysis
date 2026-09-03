import {
  Activity,
  BarChart3,
  Bell,
  Gauge,
  History,
  Layers,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  LogOut,
  MessageSquareCode,
  Percent,
  Settings,
  Sliders,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { SCREENING_CONFIG_CHANGED_EVENT, SYSTEM_CONFIG_CHANGED_EVENT, screeningApi } from '../../api/screening';
import { useAuth } from '../../contexts/AuthContext';
import { useAgentChatStore } from '../../stores/agentChatStore';
import { useUiLanguage } from '../../contexts/UiLanguageContext';
import type { UiTextKey } from '../../i18n/uiText';
import { cn } from '../../utils/cn';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { StatusDot } from '../common/StatusDot';
import { UiLanguageToggle } from '../i18n/UiLanguageToggle';
import { ThemeToggle } from '../theme/ThemeToggle';

type SidebarNavProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
  variant?: 'default' | 'rail';
};

type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: 'completion';
};

type DefaultNavItem = {
  key: string;
  labelKey: UiTextKey;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: 'completion';
};

const COMMAND_NAV_ITEMS: NavItem[] = [
  { key: 'matrix', label: 'Signals Matrix', to: '/', icon: LayoutDashboard, exact: true },
  { key: 'watchlists', label: 'Watchlists', to: '/?tab=watchlist', icon: Layers },
  { key: 'options', label: 'Options Income Scanner', to: '/screening', icon: Percent },
  { key: 'archive', label: 'Archive & Backtests', to: '/backtest', icon: History },
  { key: 'settings', label: 'Settings & API Keys', to: '/settings', icon: Sliders },
];

const DEFAULT_NAV_ITEMS: DefaultNavItem[] = [
  { key: 'home', labelKey: 'layout.nav.home', to: '/', icon: LayoutDashboard, exact: true },
  { key: 'chat', labelKey: 'layout.nav.chat', to: '/chat', icon: MessageSquareCode, badge: 'completion' },
  { key: 'screening', labelKey: 'layout.nav.screening', to: '/screening', icon: ListOrdered },
  { key: 'portfolio', labelKey: 'layout.nav.portfolio', to: '/portfolio', icon: LineChart },
  { key: 'decision-signals', labelKey: 'layout.nav.decisionSignals', to: '/decision-signals', icon: Activity },
  { key: 'backtest', labelKey: 'layout.nav.backtest', to: '/backtest', icon: BarChart3 },
  { key: 'alerts', labelKey: 'layout.nav.alerts', to: '/alerts', icon: Bell },
  { key: 'usage', labelKey: 'layout.nav.usage', to: '/usage', icon: Gauge },
  { key: 'settings', labelKey: 'layout.nav.settings', to: '/settings', icon: Settings },
];

export const SidebarNav: React.FC<SidebarNavProps> = ({ collapsed = false, onNavigate, variant = 'default' }) => {
  const { authEnabled, logout } = useAuth();
  const { t } = useUiLanguage();
  const completionBadge = useAgentChatStore((state) => state.completionBadge);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showScreeningNav, setShowScreeningNav] = useState(false);

  useEffect(() => {
    let active = true;

    const refreshScreeningStatus = async () => {
      try {
        const status = await screeningApi.getStatus();
        if (active) {
          setShowScreeningNav(status.enabled);
        }
      } catch {
        if (active) {
          setShowScreeningNav(false);
        }
      }
    };

    void refreshScreeningStatus();
    window.addEventListener(SCREENING_CONFIG_CHANGED_EVENT, refreshScreeningStatus);
    window.addEventListener(SYSTEM_CONFIG_CHANGED_EVENT, refreshScreeningStatus);

    return () => {
      active = false;
      window.removeEventListener(SCREENING_CONFIG_CHANGED_EVENT, refreshScreeningStatus);
      window.removeEventListener(SYSTEM_CONFIG_CHANGED_EVENT, refreshScreeningStatus);
    };
  }, []);

  const isRail = variant === 'rail';

  const defaultItems = showScreeningNav
    ? DEFAULT_NAV_ITEMS
    : DEFAULT_NAV_ITEMS.filter((item) => item.key !== 'screening');

  const itemsToRender = isRail
    ? COMMAND_NAV_ITEMS.map((c) => ({ ...c, displayLabel: c.label }))
    : defaultItems.map((d) => ({
        key: d.key,
        to: d.to,
        icon: d.icon,
        exact: d.exact,
        badge: d.badge,
        displayLabel: t(d.labelKey),
      }));

  const itemBaseClass = cn(
    'group/item relative flex h-10 w-full items-center rounded-xl border border-transparent text-xs font-medium text-secondary-text transition-all',
    isRail
      ? 'px-2.5 justify-start gap-3'
      : collapsed
        ? 'justify-center px-0'
        : 'gap-3 px-3'
  );
  const itemInteractiveClass = cn(
    itemBaseClass,
    'hover:bg-surface-dark hover:text-foreground hover:border-border-subtle'
  );
  const itemActiveClass = 'border-border-subtle bg-surface-dark font-semibold text-accent-long shadow-sm';
  const itemIconClass = 'h-4 w-4 shrink-0';

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          'flex items-center gap-2.5 mb-4',
          isRail ? 'px-1 pt-1' : 'px-1',
          collapsed ? 'justify-center' : ''
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
          <BarChart3 className="h-4 w-4" />
        </div>
        <div className={cn('min-w-0 transition-opacity duration-200', isRail ? 'opacity-0 group-hover/sidebar:opacity-100' : '')}>
          <p className="font-bold text-foreground text-xs tracking-wider uppercase font-financial">Koyfin Terminal</p>
        </div>
      </div>

      <nav className={cn('flex flex-col gap-1.5', isRail ? '' : 'flex-1')} aria-label={t('layout.mainNav')}>
        {itemsToRender.map(({ key, displayLabel, to, icon: Icon, exact, badge }) => (
          <NavLink
            key={key}
            to={to}
            end={exact}
            onClick={onNavigate}
            aria-label={displayLabel}
            title={displayLabel}
            className={({ isActive }) =>
              cn(
                itemInteractiveClass,
                isActive ? itemActiveClass : ''
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn(itemIconClass, isActive ? 'text-accent-long' : 'text-muted-text group-hover/item:text-foreground')} />
                <span
                  className={cn(
                    'truncate font-medium transition-opacity duration-200',
                    isRail ? 'opacity-0 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden' : ''
                  )}
                >
                  {displayLabel}
                </span>
                {badge === 'completion' && completionBadge ? (
                  <StatusDot
                    tone="info"
                    data-testid="chat-completion-badge"
                    className="absolute right-3 border-2 border-background"
                    aria-label={t('layout.newChatMessage')}
                  />
                ) : null}
              </>
            )}
          </NavLink>
        ))}

        <ThemeToggle
          variant={isRail ? 'rail' : 'nav'}
          collapsed={collapsed}
          wrapperClassName="w-full"
          triggerClassName={itemInteractiveClass}
          triggerActiveClassName={itemActiveClass}
          iconClassName={itemIconClass}
          labelClassName={itemLabelClass}
        />
        <UiLanguageToggle
          variant={isRail ? 'rail' : 'nav'}
          collapsed={collapsed}
          wrapperClassName="w-full"
          triggerClassName={itemInteractiveClass}
          triggerActiveClassName={itemActiveClass}
          iconClassName={itemIconClass}
          labelClassName={itemLabelClass}
        />
      </nav>

      {authEnabled ? (
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className={cn(
            itemInteractiveClass,
            isRail ? 'mt-1.5' : 'mt-5'
          )}
        >
          <LogOut className={itemIconClass} />
          {!collapsed ? <span className={itemLabelClass}>{t('layout.logout')}</span> : null}
        </button>
      ) : null}

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title={t('layout.logoutTitle')}
        message={t('layout.logoutMessage')}
        confirmText={t('layout.logoutConfirm')}
        cancelText={t('common.cancel')}
        isDanger
        onConfirm={() => {
          setShowLogoutConfirm(false);
          onNavigate?.();
          void logout();
        }}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};
