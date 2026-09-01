import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Plus } from "lucide-react";
import { useExpenses } from "../../context/ExpenseContext";
import { Modal } from "../common/Modal";
import { ExpenseForm } from "../expenses/ExpenseForm";
import { Toast } from "../common/Toast";
import "./Layout.css";

export const Layout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAddModalOpen, setIsAddModalOpen } = useExpenses();

  return (
    <div className="app-layout">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Container */}
      <div className="app-main-wrapper">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <main className="app-main-content">
          <div className="content-inner">{children}</div>
        </main>
      </div>

      {/* Floating Action Button (FAB) - Add Expense (as seen in screenshot) */}
      <button
        className="fab-add-expense"
        onClick={() => setIsAddModalOpen(true)}
        aria-label="Add new expense"
        title="Add Expense"
      >
        <Plus size={26} />
      </button>

      {/* Quick Add Expense Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Expense"
        subtitle="Record your spending to keep your budget on track."
      >
        <ExpenseForm
          onSuccess={() => setIsAddModalOpen(false)}
          onCancel={() => setIsAddModalOpen(false)}
        />
      </Modal>

      {/* Toast Notifications */}
      <Toast />
    </div>
  );
};
