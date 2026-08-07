"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  X,
  Loader2,
  Receipt,
  Banknote,
  Hourglass,
  BarChart3,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/context/ToastContext";
import ConfirmModal from "@/components/ConfirmModal";
import { downloadExcel } from "@/lib/export-excel";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const emptyForm = {
  name: "",
  totalCost: "",
  advance: "",
  notes: "",
  date: "",
};

const emptyExtraForm = {
  name: "",
  amount: "",
  notes: "",
};

function money(value) {
  return `Rs. ${Number(value || 0).toLocaleString()}`;
}

function toDateInputValue(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function SummaryCard({ label, value, icon: Icon, tone }) {
  const tones = {
    zinc: {
      wrap: "from-zinc-500/10 via-white to-white dark:from-zinc-500/15 dark:via-zinc-950 dark:to-zinc-950",
      icon: "bg-zinc-700 text-white",
      value: "text-zinc-900 dark:text-white",
    },
    emerald: {
      wrap: "from-emerald-500/15 via-white to-white dark:from-emerald-500/20 dark:via-zinc-950 dark:to-zinc-950",
      icon: "bg-emerald-600 text-white",
      value: "text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      wrap: "from-amber-500/15 via-white to-white dark:from-amber-500/20 dark:via-zinc-950 dark:to-zinc-950",
      icon: "bg-amber-500 text-white",
      value: "text-amber-700 dark:text-amber-300",
    },
  };
  const t = tones[tone] || tones.zinc;

  return (
    <div
      className={`rounded-xl border border-zinc-200/80 bg-gradient-to-br p-3.5 shadow-sm dark:border-zinc-800 ${t.wrap}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            {label}
          </p>
          <p className={`mt-1 text-xl font-black tabular-nums ${t.value}`}>
            {value}
          </p>
        </div>
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${t.icon}`}
        >
          <Icon size={14} />
        </span>
      </div>
    </div>
  );
}

function ExpenseBarChart({ totals }) {
  const series = useMemo(
    () => [
      {
        name: "Amount",
        data: [totals.totalCost, totals.advance, totals.pending],
      },
    ],
    [totals]
  );

  const options = useMemo(
    () => ({
      chart: {
        type: "bar",
        toolbar: { show: false },
        fontFamily: "inherit",
        animations: { enabled: true, speed: 650 },
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: "28%",
          distributed: true,
          dataLabels: { position: "top" },
        },
      },
      colors: ["#3f3f46", "#10b981", "#f59e0b"],
      dataLabels: {
        enabled: true,
        offsetY: -16,
        formatter: (v) => `Rs. ${Number(v).toLocaleString()}`,
        style: { fontSize: "10px", fontWeight: 700, colors: ["#52525b"] },
      },
      xaxis: {
        categories: ["Total", "Advance", "Pending"],
        labels: {
          style: { colors: "#71717a", fontSize: "11px", fontWeight: 700 },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: { colors: "#a1a1aa", fontSize: "10px", fontWeight: 600 },
          formatter: (v) =>
            v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)),
        },
        forceNiceScale: true,
        min: 0,
      },
      grid: {
        borderColor: "#f4f4f5",
        strokeDashArray: 4,
        padding: { top: 18 },
      },
      legend: { show: false },
      tooltip: {
        theme: "light",
        y: { formatter: (v) => money(v) },
      },
    }),
    []
  );

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-2 border-b border-zinc-100 px-3.5 py-2.5 dark:border-zinc-800">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white">
          <BarChart3 size={13} />
        </span>
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
            Expense Overview
          </h3>
          <p className="text-[10px] text-zinc-500">
            Total · Advance · Pending
          </p>
        </div>
      </div>
      <div className="px-2 pb-1 pt-2">
        <Chart type="bar" series={series} options={options} height={220} width="100%" />
      </div>
    </div>
  );
}

export default function ExpensesPage() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [extraModalOpen, setExtraModalOpen] = useState(false);
  const [editingExtra, setEditingExtra] = useState(null);
  const [extraForm, setExtraForm] = useState(emptyExtraForm);
  const [savingExtra, setSavingExtra] = useState(false);
  const [deleteExtraTarget, setDeleteExtraTarget] = useState(null);
  const [deletingExtra, setDeletingExtra] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [expRes, extraRes] = await Promise.all([
        fetch("/api/admin/expenses"),
        fetch("/api/admin/extra-expenses"),
      ]);
      if (!expRes.ok) throw new Error("Failed to load expenses");
      if (!extraRes.ok) throw new Error("Failed to load extra expenses");
      const expData = await expRes.json();
      const extraData = await extraRes.json();
      setExpenses(expData.expenses || []);
      setExtras(extraData.extras || []);
    } catch (error) {
      toast(error.message || "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }

  const totals = useMemo(() => {
    return expenses.reduce(
      (acc, e) => {
        acc.totalCost += Number(e.totalCost || 0);
        acc.advance += Number(e.advance || 0);
        acc.pending += Number(e.pendingAmount || 0);
        return acc;
      },
      { totalCost: 0, advance: 0, pending: 0 }
    );
  }, [expenses]);

  const filtered = expenses;
  const pendingPreview = useMemo(() => {
    const total = Math.max(0, Number(form.totalCost) || 0);
    const advance = Math.max(0, Number(form.advance) || 0);
    return Math.max(0, total - advance);
  }, [form.totalCost, form.advance]);

  function openCreate() {
    setEditing(null);
    setForm({
      ...emptyForm,
      date: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  }

  function openEdit(expense) {
    setEditing(expense);
    setForm({
      name: expense.name || "",
      totalCost: String(expense.totalCost ?? ""),
      advance: String(expense.advance ?? ""),
      notes: expense.notes || "",
      date: toDateInputValue(expense.date || expense._createdAt),
    });
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function handleSave(e) {
    e.preventDefault();
    const name = form.name.trim();
    const totalCost = Number(form.totalCost);
    const advance = Number(form.advance || 0);

    if (!name) {
      toast("Expense name is required", "error");
      return;
    }
    if (Number.isNaN(totalCost) || totalCost < 0) {
      toast("Enter a valid total cost", "error");
      return;
    }
    if (Number.isNaN(advance) || advance < 0) {
      toast("Advance must be 0 or more", "error");
      return;
    }
    if (advance > totalCost) {
      toast("Advance cannot be greater than total cost", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name,
        totalCost,
        advance,
        notes: form.notes.trim(),
        date: form.date || new Date().toISOString(),
      };

      const res = await fetch(
        editing ? `/api/admin/expenses/${editing._id}` : "/api/admin/expenses",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save expense");

      if (editing) {
        setExpenses((prev) =>
          prev.map((item) => (item._id === editing._id ? data.expense : item))
        );
        toast("Expense updated", "success");
      } else {
        setExpenses((prev) => [data.expense, ...prev]);
        toast("Expense added", "success");
      }
      closeModal();
    } catch (error) {
      toast(error.message || "Failed to save expense", "error");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/expenses/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete expense");
      setExpenses((prev) => prev.filter((e) => e._id !== deleteTarget._id));
      toast("Expense deleted", "success");
      setDeleteTarget(null);
    } catch (error) {
      toast(error.message || "Failed to delete expense", "error");
    } finally {
      setDeleting(false);
    }
  }

  const extrasTotal = useMemo(
    () => extras.reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [extras]
  );

  function openCreateExtra() {
    setEditingExtra(null);
    setExtraForm(emptyExtraForm);
    setExtraModalOpen(true);
  }

  function openEditExtra(item) {
    setEditingExtra(item);
    setExtraForm({
      name: item.name || "",
      amount: String(item.amount ?? ""),
      notes: item.notes || "",
    });
    setExtraModalOpen(true);
  }

  function closeExtraModal() {
    if (savingExtra) return;
    setExtraModalOpen(false);
    setEditingExtra(null);
    setExtraForm(emptyExtraForm);
  }

  async function handleSaveExtra(e) {
    e.preventDefault();
    const name = extraForm.name.trim();
    const amount = Number(extraForm.amount);

    if (!name) {
      toast("Expense name is required", "error");
      return;
    }
    if (Number.isNaN(amount) || amount < 0) {
      toast("Enter a valid amount", "error");
      return;
    }

    setSavingExtra(true);
    try {
      const payload = {
        name,
        amount,
        notes: extraForm.notes.trim(),
      };
      const res = await fetch(
        editingExtra
          ? `/api/admin/extra-expenses/${editingExtra._id}`
          : "/api/admin/extra-expenses",
        {
          method: editingExtra ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save extra expense");

      if (editingExtra) {
        setExtras((prev) =>
          prev.map((item) =>
            item._id === editingExtra._id ? data.extra : item
          )
        );
        toast("Extra expense updated", "success");
      } else {
        setExtras((prev) => [data.extra, ...prev]);
        toast("Extra expense added", "success");
      }
      closeExtraModal();
    } catch (error) {
      toast(error.message || "Failed to save extra expense", "error");
    } finally {
      setSavingExtra(false);
    }
  }

  async function confirmDeleteExtra() {
    if (!deleteExtraTarget) return;
    setDeletingExtra(true);
    try {
      const res = await fetch(
        `/api/admin/extra-expenses/${deleteExtraTarget._id}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setExtras((prev) => prev.filter((e) => e._id !== deleteExtraTarget._id));
      toast("Extra expense deleted", "success");
      setDeleteExtraTarget(null);
    } catch (error) {
      toast(error.message || "Failed to delete extra expense", "error");
    } finally {
      setDeletingExtra(false);
    }
  }

  function exportMainExpenses() {
    if (!expenses.length) {
      toast("No main expenses to export", "error");
      return;
    }
    const rows = expenses.map((e, i) => ({
      "#": i + 1,
      "Expense Name": e.name || "",
      Date: e.date ? new Date(e.date).toLocaleDateString() : "",
      "Total Cost (Rs)": Number(e.totalCost || 0),
      "Advance (Rs)": Number(e.advance || 0),
      "Pending (Rs)": Number(e.pendingAmount || 0),
      Notes: e.notes || "",
    }));
    downloadExcel(
      rows,
      `main-expenses-${new Date().toISOString().slice(0, 10)}`,
      "Main Expenses"
    );
    toast(`Exported ${rows.length} main expenses`, "success");
  }

  function exportExtraExpenses() {
    if (!extras.length) {
      toast("No extra expenses to export", "error");
      return;
    }
    const rows = extras.map((e, i) => ({
      "#": i + 1,
      "Expense Name": e.name || "",
      "Amount (Rs)": Number(e.amount || 0),
      Note: e.notes || "",
      Date: e.date ? new Date(e.date).toLocaleDateString() : "",
    }));
    downloadExcel(
      rows,
      `extra-expenses-${new Date().toISOString().slice(0, 10)}`,
      "Extra Expenses"
    );
    toast(`Exported ${rows.length} extra expenses`, "success");
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-500">
        <Loader2 className="mr-2 animate-spin" size={16} />
        Loading expenses...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-4 text-white shadow-lg shadow-emerald-600/20 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
              <Wallet size={11} />
              Finance
            </div>
            <h1 className="text-xl font-black tracking-tight sm:text-2xl">
              Expense Management
            </h1>
            <p className="mt-0.5 text-xs text-emerald-50/90 sm:text-sm">
              Track tournament costs, advances, and pending amounts
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 shadow-md transition hover:bg-emerald-50"
          >
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_1.1fr]">
        <div className="grid gap-2.5 sm:grid-cols-3 lg:grid-cols-1">
          <SummaryCard
            label="Total Cost"
            value={money(totals.totalCost)}
            icon={Receipt}
            tone="zinc"
          />
          <SummaryCard
            label="Advance Paid"
            value={money(totals.advance)}
            icon={Banknote}
            tone="emerald"
          />
          <SummaryCard
            label="Pending Amount"
            value={money(totals.pending)}
            icon={Hourglass}
            tone="amber"
          />
        </div>
        <ExpenseBarChart totals={totals} />
      </div>

      {filtered.length === 0 ? (
        <div className="flex min-h-[140px] flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <Wallet className="mb-2 text-zinc-400" size={24} />
          <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            No expenses found
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Main Expenses
            </h2>
            <button
              type="button"
              onClick={exportMainExpenses}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <FileSpreadsheet size={13} />
              <span className="sm:hidden">Excel</span>
              <span className="hidden sm:inline">Export to Excel</span>
            </button>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
            {filtered.map((expense) => {
              const pending = Number(expense.pendingAmount || 0);
              return (
                <div key={expense._id} className="space-y-3 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold leading-snug text-zinc-900 dark:text-white">
                        {expense.name}
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-zinc-500">
                        {expense.date
                          ? new Date(expense.date).toLocaleDateString()
                          : "No date"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(expense)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                        title="Edit"
                        aria-label="Edit expense"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(expense)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 dark:bg-red-950/40"
                        title="Delete"
                        aria-label="Delete expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-zinc-50 px-2 py-2 dark:bg-zinc-900/60">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                        Total
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold tabular-nums leading-tight text-zinc-800 dark:text-zinc-100">
                        {money(expense.totalCost)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-2 py-2 dark:bg-emerald-950/30">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-emerald-600/80">
                        Advance
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold tabular-nums leading-tight text-emerald-700 dark:text-emerald-300">
                        {money(expense.advance)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-2 py-2 dark:bg-amber-950/30">
                      <p className="text-[9px] font-bold uppercase tracking-wide text-amber-600/80">
                        Pending
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold tabular-nums leading-tight text-amber-700 dark:text-amber-300">
                        {money(pending)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Expense Name</th>
                  <th className="px-3 py-2.5 font-semibold">Date</th>
                  <th className="px-3 py-2.5 font-semibold">Total</th>
                  <th className="px-3 py-2.5 font-semibold">Advance</th>
                  <th className="px-3 py-2.5 font-semibold">Pending</th>
                  <th className="px-3 py-2.5 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filtered.map((expense) => {
                  const pending = Number(expense.pendingAmount || 0);
                  return (
                    <tr
                      key={expense._id}
                      className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    >
                      <td className="max-w-[220px] px-3 py-2.5 font-semibold text-zinc-900 dark:text-white">
                        <span className="line-clamp-2">{expense.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-zinc-500">
                        {expense.date
                          ? new Date(expense.date).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold tabular-nums text-zinc-800 dark:text-zinc-100">
                        {money(expense.totalCost)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                        {money(expense.advance)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold tabular-nums text-amber-700 dark:text-amber-300">
                        {money(pending)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(expense)}
                            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(expense)}
                            className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Extra Expenses */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 border-b border-zinc-100 px-3 py-3 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Extra Expenses
            </h2>
            <p className="text-[11px] text-zinc-500">
              Total:{" "}
              <span className="font-bold text-sky-700 dark:text-sky-300">
                {money(extrasTotal)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportExtraExpenses}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100 sm:flex-none dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
            >
              <FileSpreadsheet size={13} />
              <span className="sm:hidden">Excel</span>
              <span className="hidden sm:inline">Export to Excel</span>
            </button>
            <button
              type="button"
              onClick={openCreateExtra}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-sky-500 sm:flex-none"
            >
              <Plus size={13} />
              Add Extra
            </button>
          </div>
        </div>

        {extras.length === 0 ? (
          <div className="flex min-h-[100px] flex-col items-center justify-center px-3 py-6">
            <p className="text-xs font-semibold text-zinc-500">
              No extra expenses yet
            </p>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-800">
              {extras.map((item) => (
                <div key={item._id} className="space-y-2.5 p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-bold leading-snug text-zinc-900 dark:text-white">
                        {item.name}
                      </p>
                      {item.notes ? (
                        <p className="mt-1 break-words text-[11px] leading-relaxed text-zinc-500">
                          {item.notes}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditExtra(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                        title="Edit"
                        aria-label="Edit extra expense"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteExtraTarget(item)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100 dark:bg-red-950/40"
                        title="Delete"
                        aria-label="Delete extra expense"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="inline-flex rounded-lg bg-sky-50 px-2.5 py-1.5 dark:bg-sky-950/30">
                    <p className="text-sm font-bold tabular-nums text-sky-700 dark:text-sky-300">
                      {money(item.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="border-b border-zinc-100 bg-zinc-50/80 text-[10px] uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Expense Name</th>
                    <th className="px-3 py-2.5 font-semibold">Amount</th>
                    <th className="px-3 py-2.5 font-semibold">Note</th>
                    <th className="px-3 py-2.5 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {extras.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                    >
                      <td className="max-w-[200px] px-3 py-2.5 font-semibold text-zinc-900 dark:text-white">
                        <span className="line-clamp-2">{item.name}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold tabular-nums text-sky-700 dark:text-sky-300">
                        {money(item.amount)}
                      </td>
                      <td className="max-w-[240px] px-3 py-2.5 text-xs text-zinc-500">
                        <span className="line-clamp-2">{item.notes || "—"}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEditExtra(item)}
                            className="rounded-md p-1.5 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteExtraTarget(item)}
                            className="rounded-md p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-emerald-50 to-transparent px-5 py-4 dark:border-zinc-800 dark:from-emerald-950/30">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editing ? "Edit Expense" : "Add Expense"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Expense Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="e.g. Ground booking"
                  required
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    Total Cost (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.totalCost}
                    onChange={(e) =>
                      setForm({ ...form, totalCost: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                    Advance (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.advance}
                    onChange={(e) =>
                      setForm({ ...form, advance: e.target.value })
                    }
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                  Pending Amount
                </p>
                <p className="mt-0.5 text-base font-black text-amber-800 dark:text-amber-200">
                  {money(pendingPreview)}
                </p>
                <p className="mt-0.5 text-[10px] text-amber-700/80 dark:text-amber-300/80">
                  Auto calculated: Total Cost − Advance
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Optional notes..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {editing ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {extraModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 bg-gradient-to-r from-sky-50 to-transparent px-5 py-4 dark:border-zinc-800 dark:from-sky-950/30">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {editingExtra ? "Edit Extra Expense" : "Add Extra Expense"}
              </h2>
              <button
                type="button"
                onClick={closeExtraModal}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveExtra} className="space-y-3.5 p-5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Expense Name
                </label>
                <input
                  value={extraForm.name}
                  onChange={(e) =>
                    setExtraForm({ ...extraForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="e.g. Refreshments"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={extraForm.amount}
                  onChange={(e) =>
                    setExtraForm({ ...extraForm, amount: e.target.value })
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                  Note
                </label>
                <textarea
                  value={extraForm.notes}
                  onChange={(e) =>
                    setExtraForm({ ...extraForm, notes: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-zinc-700 dark:bg-zinc-950"
                  placeholder="Optional note..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeExtraModal}
                  disabled={savingExtra}
                  className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExtra}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white shadow-md disabled:opacity-60"
                >
                  {savingExtra && <Loader2 size={14} className="animate-spin" />}
                  {editingExtra ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Expense"
        message={`Delete "${deleteTarget?.name || "this expense"}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
        loading={deleting}
        danger
      />

      <ConfirmModal
        isOpen={!!deleteExtraTarget}
        title="Delete Extra Expense"
        message={`Delete "${deleteExtraTarget?.name || "this extra expense"}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteExtra}
        onCancel={() => !deletingExtra && setDeleteExtraTarget(null)}
        loading={deletingExtra}
        danger
      />
    </div>
  );
}
