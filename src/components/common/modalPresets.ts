import type { ModalConfig } from './CustomModal';

export type PresetKey =
  | 'info'
  | 'success'
  | 'warning'
  | 'deletePost'
  | 'cancelReservation'
  | 'report'
  | 'payment'
  | 'saveConfirm'
  | 'logoutConfirm'
  | 'logoutDisabled'
  | 'deleteAccount'
  | 'deleteAccountDisabled'
  | 'leaveChat'
  | 'empty'
  | 'error';

export const modalPresets: Record<PresetKey, ModalConfig> = {
  info: {
    type: 'info',
    size: 'small',
    title: '알림',
    description: '요청하신 작업이 완료되었습니다.',
    confirmText: '확인',
  },
  success: {
    type: 'success',
    size: 'small',
    title: '완료되었습니다.',
    description: '예약 요청이 정상적으로 등록되었습니다.',
    confirmText: '확인',
  },
  warning: {
    type: 'warning',
    size: 'medium',
    title: '진행하시겠습니까?',
    description: '이 작업은 되돌릴 수 없을 수 있습니다.',
    cancelText: '취소',
    confirmText: '계속하기',
  },
  deletePost: {
    type: 'danger',
    size: 'medium',
    title: '게시글을 삭제하시겠습니까?',
    description: '삭제한 게시글은 복구할 수 없습니다.',
    cancelText: '취소',
    confirmText: '삭제하기',
  },
  cancelReservation: {
    type: 'danger',
    size: 'medium',
    title: '예약을 취소하시겠습니까?',
    description: '예약을 취소하면 상대방에게 알림이 전송됩니다.',
    cancelText: '아니요',
    confirmText: '예약 취소',
  },
  report: {
    type: 'report',
    size: 'large',
    title: '신고하기',
    description: '신고 사유를 선택하거나 직접 입력해 주세요.',
    cancelText: '취소',
    confirmText: '신고 제출',
  },
  payment: {
    type: 'payment',
    size: 'medium',
    title: '결제를 진행하시겠습니까?',
    description: '예약 정보를 확인한 뒤 결제를 진행해 주세요.',
    cancelText: '취소',
    confirmText: '결제하기',
  },
  saveConfirm: {
    type: 'confirm',
    size: 'small',
    title: '변경 내용을 저장하시겠습니까?',
    description: '입력한 내용이 저장됩니다.',
    cancelText: '취소',
    confirmText: '저장하기',
  },
  logoutConfirm: {
    type: 'confirm',
    size: 'small',
    title: '로그아웃하시겠습니까?',
    description: '현재 계정에서 로그아웃됩니다.',
    cancelText: '취소',
    confirmText: '로그아웃',
  },
  logoutDisabled: {
    type: 'disabled',
    size: 'medium',
    title: '로그아웃할 수 없습니다.',
    description:
      '현재 예약 중이거나 예약이 진행 중인 내역이 있어 로그아웃할 수 없습니다. 예약이 완료되거나 취소된 후 다시 시도해 주세요.',
    confirmText: '확인',
  },
  deleteAccount: {
    type: 'danger',
    size: 'medium',
    title: '계정을 삭제하시겠습니까?',
    description: '계정을 삭제하면 작성한 정보와 이용 내역이 삭제되며, 복구할 수 없습니다.',
    cancelText: '취소',
    confirmText: '계정 삭제',
  },
  deleteAccountDisabled: {
    type: 'disabled',
    size: 'medium',
    title: '계정을 삭제할 수 없습니다.',
    description:
      '현재 예약 중이거나 예약이 진행 중인 내역이 있어 계정을 삭제할 수 없습니다. 모든 예약이 완료되거나 취소된 후 다시 시도해 주세요.',
    confirmText: '확인',
  },
  leaveChat: {
    type: 'danger',
    size: 'small',
    title: '채팅방을 나가시겠습니까?',
    description: '채팅방을 나가면 대화 내역을 다시 볼 수 없습니다.',
    cancelText: '취소',
    confirmText: '나가기',
  },
  empty: {
    type: 'empty',
    size: 'small',
    title: '등록된 정보가 없습니다.',
    description: '먼저 필요한 정보를 등록해 주세요.',
    confirmText: '확인',
  },
  error: {
    type: 'error',
    size: 'small',
    title: '요청을 처리할 수 없습니다.',
    description: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    confirmText: '확인',
  },
};
