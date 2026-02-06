import React, { useEffect, useState } from 'react';
import { todoAPI } from '../../services/api';
import type { Todo, ApiError, TodoCreateData } from '../../types';
import { AxiosError } from 'axios';
import TodoItem from './TodoItem';

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const [quickAddTitle, setQuickAddTitle] = useState('');
  const [quickAddDescription, setQuickAddDescription] = useState('');
  const [quickAddPriority, setQuickAddPriority] = useState(0);
  const [quickAddDueDate, setQuickAddDueDate] = useState('');
  const [quickAddError, setQuickAddError] = useState('');
  const [isQuickAddSaving, setIsQuickAddSaving] = useState(false);

  const fetchTodos = async () => {
    try {
      const response = await todoAPI.list();
      setTodos(response.results);
      setError('');
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setError(
        axiosError.response?.data?.error ||
        'Failed to load todos. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  const handleTodoUpdated = (updatedTodo: Todo) => {
    setTodos(todos.map((todo) => (todo.id === updatedTodo.id ? updatedTodo : todo)));
  };

  const handleTodoDeleted = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleQuickAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickAddError('');

    if (!quickAddTitle.trim()) {
      setQuickAddError('Title is required');
      return;
    }

    setIsQuickAddSaving(true);

    try {
      const data: TodoCreateData = {
        title: quickAddTitle.trim(),
        description: quickAddDescription.trim(),
        priority: quickAddPriority,
        due_date: quickAddDueDate || null,
      };

      const newTodo = await todoAPI.create(data);
      setTodos([newTodo, ...todos]);

      // Reset form
      setQuickAddTitle('');
      setQuickAddDescription('');
      setQuickAddPriority(0);
      setQuickAddDueDate('');
      setIsQuickAddExpanded(false);

      // Focus back on the title input
      setTimeout(() => {
        document.getElementById('quick-add-title')?.focus();
      }, 0);
    } catch (err) {
      const axiosError = err as AxiosError<ApiError>;
      setQuickAddError(
        axiosError.response?.data?.error ||
        'Failed to create todo. Please try again.'
      );
    } finally {
      setIsQuickAddSaving(false);
    }
  };

  const handleQuickAddCancel = () => {
    setQuickAddTitle('');
    setQuickAddDescription('');
    setQuickAddPriority(0);
    setQuickAddDueDate('');
    setQuickAddError('');
    setIsQuickAddExpanded(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-6 text-neutral-600 font-medium">Loading your todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold text-neutral-900 tracking-tight mb-2">My Todos</h1>
          <p className="text-neutral-600">
            {todos.length} {todos.length === 1 ? 'task' : 'tasks'} to complete
          </p>
        </div>

        {error && (
          <div className="rounded-2xl bg-soft-red/10 border border-soft-red/20 p-5 mb-8 animate-slide-down">
            <p className="text-sm text-soft-red font-medium">{error}</p>
          </div>
        )}

        {/* Quick Add Form */}
        <form onSubmit={handleQuickAddSubmit} className="card-soft mb-8 animate-fade-in">
          {quickAddError && (
            <div className="rounded-xl bg-soft-red/10 border border-soft-red/20 p-4 mb-4">
              <p className="text-sm text-soft-red font-medium">{quickAddError}</p>
            </div>
          )}

          {/* Always visible title input */}
          <input
            id="quick-add-title"
            type="text"
            value={quickAddTitle}
            onChange={(e) => setQuickAddTitle(e.target.value)}
            onFocus={() => setIsQuickAddExpanded(true)}
            onKeyDown={(e) => {
              // Submit on Enter if title is filled and form is not expanded
              if (e.key === 'Enter' && !isQuickAddExpanded && quickAddTitle.trim()) {
                handleQuickAddSubmit(e);
              }
            }}
            className="input-soft text-lg"
            placeholder="+ Add a new todo..."
            disabled={isQuickAddSaving}
            autoFocus
          />

          {/* Expanded form fields */}
          {isQuickAddExpanded && (
            <div className="space-y-4 mt-4 animate-slide-down">
              <textarea
                value={quickAddDescription}
                onChange={(e) => setQuickAddDescription(e.target.value)}
                className="input-soft resize-none"
                rows={3}
                placeholder="Add description (optional)"
                disabled={isQuickAddSaving}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Priority (0-10)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={quickAddPriority}
                    onChange={(e) => setQuickAddPriority(parseInt(e.target.value) || 0)}
                    className="input-soft"
                    disabled={isQuickAddSaving}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={quickAddDueDate}
                    onChange={(e) => setQuickAddDueDate(e.target.value)}
                    className="input-soft"
                    disabled={isQuickAddSaving}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isQuickAddSaving || !quickAddTitle.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isQuickAddSaving ? 'Adding...' : 'Add Todo'}
                </button>
                <button
                  type="button"
                  onClick={handleQuickAddCancel}
                  disabled={isQuickAddSaving}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </form>

        {todos.length === 0 ? (
          <div className="card-soft text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-neutral-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-3">No todos yet</h3>
            <p className="text-neutral-600 leading-relaxed max-w-md mx-auto">
              Get started by adding your first todo using the form above
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {todos.map((todo, index) => (
              <div
                key={todo.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'backwards' }}
              >
                <TodoItem
                  todo={todo}
                  onUpdate={handleTodoUpdated}
                  onDelete={handleTodoDeleted}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodoList;
