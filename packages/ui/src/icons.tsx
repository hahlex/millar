import React from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Folder,
  Globe,
  HelpCircle,
  Home,
  Info,
  Layers,
  LayoutGrid,
  List,
  Lock,
  LogOut,
  Menu,
  Moon,
  MoreHorizontal,
  Palette,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Type,
  Upload,
  User,
  Users,
  X,
  type LucideProps,
} from "lucide-react";

export type MillarIconSize = "sm" | "md" | "lg" | "xl";

const ICON_SIZE_PX: Record<MillarIconSize, number> = {
  sm: 14,
  md: 16,
  lg: 20,
  xl: 32,
};

export interface MillarIconProps extends Omit<LucideProps, "size" | "strokeWidth"> {
  size?: MillarIconSize;
  label?: string;
}

function createSemanticIcon(IconComp: React.ComponentType<LucideProps>, displayName: string) {
  const SemanticIcon = React.forwardRef<SVGSVGElement, MillarIconProps>(
    ({ size = "md", label, className, ...rest }, ref) => (
      <IconComp
        ref={ref}
        size={ICON_SIZE_PX[size]}
        strokeWidth={1.5}
        absoluteStrokeWidth
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
        focusable="false"
        className={className}
        {...rest}
      />
    ),
  );
  SemanticIcon.displayName = displayName;
  return SemanticIcon;
}

export const IconAdd = createSemanticIcon(Plus, "IconAdd");
export const IconEdit = createSemanticIcon(Edit3, "IconEdit");
export const IconDelete = createSemanticIcon(Trash2, "IconDelete");
export const IconClose = createSemanticIcon(X, "IconClose");
export const IconCheck = createSemanticIcon(Check, "IconCheck");
export const IconCopy = createSemanticIcon(Copy, "IconCopy");
export const IconDownload = createSemanticIcon(Download, "IconDownload");
export const IconUpload = createSemanticIcon(Upload, "IconUpload");
export const IconSearch = createSemanticIcon(Search, "IconSearch");
export const IconFilter = createSemanticIcon(Filter, "IconFilter");
export const IconSliders = createSemanticIcon(SlidersHorizontal, "IconSliders");
export const IconMore = createSemanticIcon(MoreHorizontal, "IconMore");
export const IconMenu = createSemanticIcon(Menu, "IconMenu");
export const IconSidebar = createSemanticIcon(PanelLeft, "IconSidebar");
export const IconHome = createSemanticIcon(Home, "IconHome");
export const IconUsers = createSemanticIcon(Users, "IconUsers");
export const IconUser = createSemanticIcon(User, "IconUser");
export const IconSettings = createSemanticIcon(Settings, "IconSettings");
export const IconBell = createSemanticIcon(Bell, "IconBell");
export const IconCalendar = createSemanticIcon(Calendar, "IconCalendar");
export const IconClock = createSemanticIcon(Clock, "IconClock");
export const IconFile = createSemanticIcon(FileText, "IconFile");
export const IconFolder = createSemanticIcon(Folder, "IconFolder");
export const IconEye = createSemanticIcon(Eye, "IconEye");
export const IconRefresh = createSemanticIcon(RefreshCw, "IconRefresh");
export const IconSend = createSemanticIcon(Send, "IconSend");
export const IconExternal = createSemanticIcon(ExternalLink, "IconExternal");
export const IconArrowLeft = createSemanticIcon(ArrowLeft, "IconArrowLeft");
export const IconArrowRight = createSemanticIcon(ArrowRight, "IconArrowRight");
export const IconArrowUpRight = createSemanticIcon(ArrowUpRight, "IconArrowUpRight");
export const IconChevronDown = createSemanticIcon(ChevronDown, "IconChevronDown");
export const IconChevronUp = createSemanticIcon(ChevronUp, "IconChevronUp");
export const IconChevronLeft = createSemanticIcon(ChevronLeft, "IconChevronLeft");
export const IconChevronRight = createSemanticIcon(ChevronRight, "IconChevronRight");
export const IconGrid = createSemanticIcon(LayoutGrid, "IconGrid");
export const IconList = createSemanticIcon(List, "IconList");
export const IconLayers = createSemanticIcon(Layers, "IconLayers");
export const IconPalette = createSemanticIcon(Palette, "IconPalette");
export const IconTypography = createSemanticIcon(Type, "IconTypography");
export const IconCode = createSemanticIcon(Code2, "IconCode");
export const IconTerminal = createSemanticIcon(Terminal, "IconTerminal");
export const IconGlobe = createSemanticIcon(Globe, "IconGlobe");
export const IconSun = createSemanticIcon(Sun, "IconSun");
export const IconMoon = createSemanticIcon(Moon, "IconMoon");
export const IconHelp = createSemanticIcon(HelpCircle, "IconHelp");
export const IconInfo = createSemanticIcon(Info, "IconInfo");
export const IconSuccess = createSemanticIcon(CheckCircle2, "IconSuccess");
export const IconWarning = createSemanticIcon(AlertTriangle, "IconWarning");
export const IconError = createSemanticIcon(AlertCircle, "IconError");
export const IconShield = createSemanticIcon(ShieldCheck, "IconShield");
export const IconLock = createSemanticIcon(Lock, "IconLock");
export const IconLogout = createSemanticIcon(LogOut, "IconLogout");
export const IconSparkle = createSemanticIcon(Sparkles, "IconSparkle");

export const MILLAR_CORE_ICONS = {
  IconAdd,
  IconEdit,
  IconDelete,
  IconClose,
  IconCheck,
  IconCopy,
  IconDownload,
  IconUpload,
  IconSearch,
  IconFilter,
  IconSliders,
  IconMore,
  IconMenu,
  IconSidebar,
  IconHome,
  IconUsers,
  IconUser,
  IconSettings,
  IconBell,
  IconCalendar,
  IconClock,
  IconFile,
  IconFolder,
  IconEye,
  IconRefresh,
  IconSend,
  IconExternal,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUpRight,
  IconChevronDown,
  IconChevronUp,
  IconChevronLeft,
  IconChevronRight,
  IconGrid,
  IconList,
  IconLayers,
  IconPalette,
  IconTypography,
  IconCode,
  IconTerminal,
  IconGlobe,
  IconSun,
  IconMoon,
  IconHelp,
  IconInfo,
  IconSuccess,
  IconWarning,
  IconError,
  IconShield,
  IconLock,
  IconLogout,
  IconSparkle,
} as const;

export type MillarIconBoxTone = "neutral" | "brand" | "sand" | "sage" | "success" | "warning" | "error";

const TONE_STYLES: Record<MillarIconBoxTone, React.CSSProperties> = {
  neutral: {
    backgroundColor: "var(--bg-surface-2)",
    borderColor: "var(--border-default)",
    color: "var(--fg-muted)",
  },
  brand: {
    backgroundColor: "var(--tone-brand-soft)",
    borderColor: "var(--tone-brand-border)",
    color: "var(--tone-brand-fg)",
  },
  sand: {
    backgroundColor: "var(--tone-sand-soft)",
    borderColor: "var(--tone-sand-border)",
    color: "var(--tone-sand-fg)",
  },
  sage: {
    backgroundColor: "var(--tone-sage-soft)",
    borderColor: "var(--tone-sage-border)",
    color: "var(--tone-sage-fg)",
  },
  success: {
    backgroundColor: "var(--status-success-soft)",
    borderColor: "var(--status-success-border)",
    color: "var(--status-success)",
  },
  warning: {
    backgroundColor: "var(--status-warning-soft)",
    borderColor: "var(--status-warning-border)",
    color: "var(--status-warning)",
  },
  error: {
    backgroundColor: "var(--status-error-soft)",
    borderColor: "var(--status-error-border)",
    color: "var(--status-error)",
  },
};

const BOX_DIM: Record<"sm" | "md" | "lg", number> = {
  sm: 28,
  md: 32,
  lg: 40,
};

export interface IconBoxProps {
  tone?: MillarIconBoxTone;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

export function IconBox({ tone = "neutral", size = "md", children, className }: IconBoxProps) {
  const dim = BOX_DIM[size];
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: dim,
        height: dim,
        borderRadius: "var(--radius-control, 10px)",
        borderWidth: 1,
        borderStyle: "solid",
        flexShrink: 0,
        ...TONE_STYLES[tone],
      }}
    >
      {children}
    </span>
  );
}
