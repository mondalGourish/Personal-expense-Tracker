import React, { useState } from "react";
import { formatCurrency, formatDate } from "../../data/mockExpenses";
import { useExpenses } from "../../context/ExpenseContext";
import { CategoryIcon, CategoryBadge } from "../common/CategoryIcon";
import { Button } from "../common/Button";
import { Modal } from "../common/Modal";
import { ExpenseForm } from "./ExpenseForm";
import {
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import "./ExpenseTable.css";

export const ExpenseTable = ({ expenses = [] }) => {
  const { deleteExpense, settings } = useExpenses();

  // Modal states for Edit and Delete
  const [editingExpense, setEditingExpense] = useState(null);
  const [deletingExpense, setDeletingExpense] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(expenses.length / itemsPerPage) || 1;

  const paginatedExpenses = expenses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteConfirm = () => {
    if (deletingExpense) {
      deleteExpense(deletingExpense.id);
      setDeletingExpense(null);
    }
  };

  return (
    <div className="expense-table-container">
      {/* Desktop Table View */}
      <div className="table-responsive">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Date</th>
              <th className="text-right">Amount</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedExpenses.map((item) => (
              <tr key={item.id} className="expense-table-row">
                <td className="col-category">
                  <div className="category-cell">
                    <CategoryIcon category={item.category} size="md" />
                    <div className="category-cell-text">
                      <span className="cat-name">{item.category}</span>
                    </div>
                  </div>
                </td>

                <td className="col-desc">
                  <span className="desc-text" title={item.description}>
                    {item.description || "—"}
                  </span>
                </td>

                <td className="col-date">
                  <span className="date-badge">{formatDate(item.date)}</span>
                </td>

                <td className="col-amount text-right">
                  <span className="amount-text">
                    {formatCurrency(item.amount, settings.currencySymbol)}
                  </span>
                </td>

                <td className="col-actions text-center">
                  <div className="action-buttons-group">
                    <button
                      className="btn-action btn-edit"
                      onClick={() => setEditingExpense(item)}
                      title="Edit Expense"
                      aria-label="Edit Expense"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => setDeletingExpense(item)}
                      title="Delete Expense"
                      aria-label="Delete Expense"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="mobile-expense-cards">
        {paginatedExpenses.map((item) => (
          <div key={item.id} className="mobile-expense-card">
            <div className="mobile-card-top">
              <div className="mobile-lead">
                <CategoryIcon category={item.category} size="md" />
                <div>
                  <h4 className="mobile-cat-title">{item.category}</h4>
                  <span className="mobile-date">{formatDate(item.date)}</span>
                </div>
              </div>
              <span className="mobile-amount">
                {formatCurrency(item.amount, settings.currencySymbol)}
              </span>
            </div>

            {item.description && (
              <p className="mobile-desc">{item.description}</p>
            )}

            <div className="mobile-card-footer">
              <CategoryBadge category={item.category} showIcon={false} size="sm" />
              <div className="mobile-actions">
                <button
                  className="btn-action btn-edit"
                  onClick={() => setEditingExpense(item)}
                >
                  <Edit2 size={15} />
                  <span>Edit</span>
                </button>
                <button
                  className="btn-action btn-delete"
                  onClick={() => setDeletingExpense(item)}
                >
                  <Trash2 size={15} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="table-pagination">
          <span className="pagination-info">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, expenses.length)} of{" "}
            {expenses.length} entries
          </span>

          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                className={`pagination-page-btn ${
                  currentPage === pageNum ? "active" : ""
                }`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            <button
              className="pagination-btn"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      <Modal
        isOpen={Boolean(editingExpense)}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
        subtitle="Modify the details of your recorded expense."
      >
        {editingExpense && (
          <ExpenseForm
            initialData={editingExpense}
            onSuccess={() => setEditingExpense(null)}
            onCancel={() => setEditingExpense(null)}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingExpense)}
        onClose={() => setDeletingExpense(null)}
        title="Delete Expense"
        maxWidth="440px"
      >
        <div className="delete-modal-content">
          <div className="delete-icon-wrapper">
            <AlertTriangle size={28} />
          </div>
          <h4 className="delete-prompt-title">Are you sure?</h4>
          <p className="delete-prompt-desc">
            This will permanently remove this{" "}
            <strong>
              {deletingExpense &&
                formatCurrency(deletingExpense.amount, settings.currencySymbol)}
            </strong>{" "}
            expense ({deletingExpense?.category}). This action cannot be undone.
          </p>
          <div className="delete-modal-actions">
            <Button
              variant="secondary"
              onClick={() => setDeletingExpense(null)}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              Yes, Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
