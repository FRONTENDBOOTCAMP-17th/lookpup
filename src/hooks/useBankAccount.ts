"use client";

import { useEffect, useState } from "react";

export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  account_holder: string;
}

interface BankForm {
  bank_name: string;
  account_number: string;
  account_holder: string;
}

export function useBankAccount(initialBankAccount?: BankAccount | null) {
  const [bankAccount, setBankAccount] = useState<BankAccount | null>(initialBankAccount ?? null);
  const [bankLoading, setBankLoading] = useState(initialBankAccount === undefined);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankForm, setBankForm] = useState<BankForm>({ bank_name: "", account_number: "", account_holder: "" });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState("");

  useEffect(() => {
    if (initialBankAccount !== undefined) {
      if (initialBankAccount) {
        // initialBankAccount prop 또는 아래 fetch로 폼을 채우는 초기화 로직
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBankForm({
          bank_name: initialBankAccount.bank_name,
          account_number: initialBankAccount.account_number,
          account_holder: initialBankAccount.account_holder,
        });
      } else {
        setIsEditingBank(true);
      }
      return;
    }
    fetch("/api/bank-account")
      .then((r) => r.json())
      .then(({ data: d }) => {
        if (d) {
          setBankAccount(d);
          setBankForm({ bank_name: d.bank_name, account_number: d.account_number, account_holder: d.account_holder });
        } else {
          setIsEditingBank(true);
        }
      })
      .catch(() => {})
      .finally(() => setBankLoading(false));
  }, [initialBankAccount]);

  function startEditBank() {
    if (bankAccount) {
      setBankForm({
        bank_name: bankAccount.bank_name,
        account_number: bankAccount.account_number,
        account_holder: bankAccount.account_holder,
      });
    }
    setBankError("");
    setIsEditingBank(true);
  }

  async function saveBank() {
    if (!bankForm.bank_name || !bankForm.account_number.trim() || !bankForm.account_holder.trim()) {
      setBankError("모든 항목을 입력해주세요.");
      return;
    }
    setBankSaving(true);
    setBankError("");
    try {
      const res = await fetch("/api/bank-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bankForm),
      });
      const json = await res.json();
      if (!res.ok) {
        setBankError(json.error?.message ?? "저장에 실패했습니다.");
        return;
      }
      setBankAccount(json.data);
      setIsEditingBank(false);
    } catch {
      setBankError("저장 중 오류가 발생했습니다.");
    } finally {
      setBankSaving(false);
    }
  }

  return {
    bankAccount,
    bankLoading,
    isEditingBank,
    bankForm,
    bankSaving,
    bankError,
    setBankForm,
    setIsEditingBank,
    setBankError,
    startEditBank,
    saveBank,
  };
}
