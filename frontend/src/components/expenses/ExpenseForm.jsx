import React, { useState, useEffect } from "react";
import { CATEGORIES } from "../../data/mockExpenses";
import { useExpenses } from "../../context/ExpenseContext";
import { Button } from "../common/Button";
import { CategoryIcon } from "../common/CategoryIcon";
import { DollarSign, Calendar, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import "./ExpenseForm.css";

export const ExpenseForm = ({
  initialData = null,
  onSuccess,
  onCancel,
  submitLabel = "Add Expense",
}) => {
  const { addExpense, editExpense, settings } = useExpenses();

  // Form State
  const [formData, setFormData] = useState({
    amount: "",
    category: "Food",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  // Validation errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Pre-fill form if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        amount: initialData.amount || "",
        category: initialData.category || "Food",
        description: initialData.description || "",
        date: initialData.date ? initialData.date.split("T")[0] : new Date().toISOString().split("T")[0],
      });
    }
  }, [initialData]);

  // Validation function
  const validate = (data = formData) => {
    const newErrors = {};

    if (!data.amount || data.amount === "") {
      newErrors.amount = "Amount is required";
    } else if (isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    } else if (Number(data.amount) > 10000000) {
      newErrors.amount = "Amount exceeds the maximum limit";
    }

    if (!data.category) {
      newErrors.category = "Category is required";
    }

    if (data.description && data.description.length > 500) {
      newErrors.description = "Description cannot exceed 500 characters";
    }

    if (data.date) {
      const selectedDate = new Date(data.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.date = "Expense date cannot be in the future";
      }
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (touched[name]) {
      const validationErrors = validate({ ...formData, [name]: value });
      setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const validationErrors = validate();
    setErrors((prev) => ({ ...prev, [name]: validationErrors[name] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ amount: true, category: true, description: true, date: true });

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    // Simulate realistic async operation (350ms)
    setTimeout(() => {
      try {
        if (initialData && initialData.id) {
          editExpense(initialData.id, formData);
        } else {
          addExpense(formData);
        }

        setIsLoading(false);
        setIsSuccess(true);

        setTimeout(() => {
          if (onSuccess) {
            onSuccess();
          } else {
            // Reset if on standalone page
            setFormData({
              amount: "",
              category: "Food",
              description: "",
              date: new Date().toISOString().split("T")[0],
            });
            setTouched({});
            setIsSuccess(false);
          }
        }, 600);
      } catch (err) {
        setIsLoading(false);
        setErrors({ form: "Failed to save expense. Please try again." });
      }
    }, 400);
  };

  return (
    <form className="expense-form" onSubmit={handleSubmit} noValidate>
      {errors.form && (
        <div className="form-alert form-alert-danger">
          <AlertCircle size={18} />
          <span>{errors.form}</span>
        </div>
      )}

      {isSuccess && (
        <div className="form-alert form-alert-success">
          <CheckCircle2 size={18} />
          <span>Expense saved successfully!</span>
        </div>
      )}

      {/* Amount Field */}
      <div className="form-group">
        <label className="form-label" htmlFor="expense-amount">
          Amount ({settings.currencySymbol}) <span className="required-star">*</span>
        </label>
        <div className={`input-wrapper ${errors.amount && touched.amount ? "input-error" : ""}`}>
          <span className="input-prefix">{settings.currencySymbol}</span>
          <input
            id="expense-amount"
            type="number"
            name="amount"
            className="form-input with-prefix"
            placeholder="0.00"
            step="any"
            value={formData.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            autoFocus={!initialData}
          />
        </div>
        {errors.amount && touched.amount && (
          <span className="form-error-msg">{errors.amount}</span>
        )}
      </div>

      {/* Category Field */}
      <div className="form-group">
        <label className="form-label" htmlFor="expense-category">
          Category <span className="required-star">*</span>
        </label>
        <div className="category-select-wrapper">
          <div className="category-preview-icon">
            <CategoryIcon category={formData.category} size="sm" />
          </div>
          <select
            id="expense-category"
            name="category"
            className={`form-select with-icon ${errors.category && touched.category ? "input-error" : ""}`}
            value={formData.category}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        {errors.category && touched.category && (
          <span className="form-error-msg">{errors.category}</span>
        )}
      </div>

      {/* Date Field */}
      <div className="form-group">
        <label className="form-label" htmlFor="expense-date">
          Date
        </label>
        <div className={`input-wrapper ${errors.date && touched.date ? "input-error" : ""}`}>
          <input
            id="expense-date"
            type="date"
            name="date"
            className="form-input"
            value={formData.date}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
        {errors.date && touched.date && (
          <span className="form-error-msg">{errors.date}</span>
        )}
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label className="form-label" htmlFor="expense-description">
          Description / Note <span className="optional-badge">(Optional)</span>
        </label>
        <textarea
          id="expense-description"
          name="description"
          rows={3}
          className={`form-textarea ${errors.description && touched.description ? "input-error" : ""}`}
          placeholder="e.g. Lunch at Cafe with colleagues..."
          value={formData.description}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={isLoading}
          maxLength={500}
        />
        <div className="textarea-footer">
          {errors.description && touched.description ? (
            <span className="form-error-msg">{errors.description}</span>
          ) : (
            <span className="char-count">{formData.description.length}/500</span>
          )}
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {initialData ? "Save Changes" : submitLabel}
        </Button>
      </div>
    </form>
  );
};
