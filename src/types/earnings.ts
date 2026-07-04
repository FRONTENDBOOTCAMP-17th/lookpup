export interface Transaction {
  id: string;
  date: string;
  service: string;
  clientName: string;
  amount: number;
  status: "completed" | "pending";
}

export interface MonthlyEarning {
  month: string;
  label: string;
  total: number;
}

export interface EarningsData {
  total: number;
  thisMonth: number;
  thisWeek: number;
  monthly: MonthlyEarning[];
  transactions: Transaction[];
}
