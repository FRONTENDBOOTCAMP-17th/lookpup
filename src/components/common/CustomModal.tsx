'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useMounted } from '@/hooks/useMounted';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Flag,
  Info,
  Inbox,
  Lock,
  Trash2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { modalPresets, type PresetKey } from './modalPresets';

export type ModalType =
  | 'info'
  | 'success'
  | 'warning'
  | 'danger'
  | 'confirm'
  | 'disabled'
  | 'payment'
  | 'report'
  | 'error'
  | 'empty';

export type ModalSize = 'small' | 'medium' | 'large';

export interface ModalConfig {
  type?: ModalType;
  size?: ModalSize;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
}

interface CustomModalProps extends ModalConfig {
  open: boolean;
  preset?: PresetKey;
  onClose?: () => void;
  onConfirm?: () => void;
  children?: ReactNode;
  closeOnOverlay?: boolean;
  closeOnEsc?: boolean;
  showCloseButton?: boolean;
}

type TypeConfig = {
  iconBg: string;
  Icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  confirmBg: string;
  confirmHover: string;
};

const TYPE_CONFIG: Record<ModalType, TypeConfig> = {
  info: {
    iconBg: 'bg-blue-50',
    Icon: Info,
    iconColor: 'text-blue-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  success: {
    iconBg: 'bg-emerald-50',
    Icon: CheckCircle,
    iconColor: 'text-emerald-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  warning: {
    iconBg: 'bg-amber-50',
    Icon: AlertTriangle,
    iconColor: 'text-amber-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  danger: {
    iconBg: 'bg-red-50',
    Icon: Trash2,
    iconColor: 'text-red-500',
    confirmBg: 'bg-red-500',
    confirmHover: 'hover:bg-red-600',
  },
  confirm: {
    iconBg: 'bg-orange-50',
    Icon: AlertTriangle,
    iconColor: 'text-orange-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  disabled: {
    iconBg: 'bg-gray-100',
    Icon: Lock,
    iconColor: 'text-gray-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  payment: {
    iconBg: 'bg-orange-50',
    Icon: CreditCard,
    iconColor: 'text-orange-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  report: {
    iconBg: 'bg-red-50',
    Icon: Flag,
    iconColor: 'text-red-500',
    confirmBg: 'bg-red-500',
    confirmHover: 'hover:bg-red-600',
  },
  error: {
    iconBg: 'bg-red-50',
    Icon: AlertCircle,
    iconColor: 'text-red-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
  empty: {
    iconBg: 'bg-gray-100',
    Icon: Inbox,
    iconColor: 'text-gray-500',
    confirmBg: 'bg-orange-500',
    confirmHover: 'hover:bg-orange-600',
  },
};

const SIZE_CLASS: Record<ModalSize, string> = {
  small: 'w-[calc(100%-32px)] max-w-96',
  medium: 'w-[calc(100%-32px)] max-w-[480px]',
  large: 'w-[calc(100%-32px)] max-w-[600px]',
};

export function CustomModal({
  open,
  preset,
  onClose,
  onConfirm,
  children,
  closeOnOverlay = true,
  closeOnEsc = true,
  showCloseButton = true,
  type: typeProp,
  size: sizeProp,
  title: titleProp,
  description: descProp,
  confirmText: confirmProp,
  cancelText: cancelProp,
}: CustomModalProps) {
  const titleId = useId();
  const descId = useId();
  const mounted = useMounted();

  const base: ModalConfig = preset ? modalPresets[preset] : {};
  const type: ModalType = typeProp ?? base.type ?? 'info';
  const size: ModalSize = sizeProp ?? base.size ?? 'medium';
  const title = titleProp ?? base.title ?? '';
  const description = descProp ?? base.description;
  const confirmText = confirmProp ?? base.confirmText ?? '확인';
  const cancelText = cancelProp ?? base.cancelText;

  const { iconBg, Icon, iconColor, confirmBg, confirmHover } = TYPE_CONFIG[type];
  const hasCancel = Boolean(cancelText);

  useEffect(() => {
    if (!closeOnEsc || !open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, closeOnEsc, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative flex flex-col bg-white rounded-[20px]',
          'shadow-[0px_20px_60px_0px_rgba(232,116,42,0.20)]',
          SIZE_CLASS[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && onClose && (
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="px-7 pt-8 pb-6 flex flex-col items-center gap-4">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0', iconBg)}>
            <Icon className={cn('w-7 h-7', iconColor)} />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <p id={titleId} className="text-stone-900 text-base font-bold leading-6">
              {title}
            </p>
            {description && (
              <p id={descId} className="text-gray-500 text-sm leading-6 whitespace-pre-line">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="h-px bg-orange-100" />

        {children && (
          <>
            <div className="px-7 py-5">{children}</div>
            <div className="h-px bg-orange-100" />
          </>
        )}

        <div className="px-7 py-5 flex gap-3">
          {hasCancel && (
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 px-5 rounded-[10px] bg-white outline outline-1 outline-offset-[-1px] outline-orange-500 flex items-center justify-center text-orange-500 text-base transition-colors hover:bg-orange-50"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'h-11 px-5 rounded-[10px] flex items-center justify-center text-white text-base transition-colors',
              hasCancel ? 'flex-1' : 'w-full',
              confirmBg,
              confirmHover,
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
