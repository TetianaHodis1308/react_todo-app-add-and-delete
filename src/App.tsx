/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { createTodos, deleteTodos, getTodos, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
import cn from 'classnames';
import { Filters } from './types/Filtres';
import { TodoItem } from './components/TodoItem.ts/TodoItem';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isErrorHidden, setIsErrorHidden] = useState(true);
  const [filter, setFilter] = useState<Filters>(Filters.All);
  const [selectedTodos, setSelectedTodos] = useState<Todo[]>([]);
  // **** block add
  const [query, setQuery] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  // **** block delete
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  useEffect(() => {
    setIsErrorHidden(true);

    getTodos()
      .then(todosFromServer => {
        setTodos(todosFromServer);
        setSelectedTodos(todosFromServer);
      })
      .catch(() => setErrorMessage('Unable to load todos'))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (errorMessage) {
      setIsErrorHidden(false);

      timer = setTimeout(() => {
        setIsErrorHidden(true);
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [errorMessage]);

  const activeTodos = todos.filter(todo => !todo.completed);

  const getSelectedTodos = (selected: Filters) => {
    setFilter(selected);

    switch (selected) {
      case Filters.Completed:
        setSelectedTodos(todos.filter(todo => todo.completed));
        break;

      case Filters.Active:
        setSelectedTodos(todos.filter(todo => !todo.completed));
        break;

      case Filters.All:
      default:
        setSelectedTodos(todos);
        break;
    }
  };

  const visibleFooter = todos.length !== 0;

  // **** block add
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setQuery('');
  };

  const resetErrorMessage = () => {
    setIsErrorHidden(false);
    setErrorMessage('');
  };

  const handleQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      resetErrorMessage();
      setTimeout(() => {
        setIsErrorHidden(true);
        setErrorMessage('Title should not be empty');
      }, 0);

      return;
    }

    const newTodo = {
      userId: USER_ID,
      title: trimmedQuery,
      completed: false,
    };

    setTempTodo({ ...newTodo, id: 0 });
    setIsDisabled(true);

    createTodos(newTodo)
      .then(newTodoFromServer => {
        setTodos(currentTodo => {
          return [...currentTodo, newTodoFromServer];
        });
        setSelectedTodos(currentTodo => {
          return [...currentTodo, newTodoFromServer];
        });
        setTempTodo(null);
        setIsDisabled(false);
        reset();
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
        setTempTodo(null);
        setIsDisabled(false);
      });
  };

  useEffect(() => {
    if (!isDisabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isDisabled]);

  // **** block delete

  const handleDelete = (todo: Todo) => {
    setLoadingTodoIds(prev => [...prev, todo.id]);

    deleteTodos(todo.id)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(currentTodo => currentTodo.id !== todo.id),
        );
        setSelectedTodos(currentTodos =>
          currentTodos.filter(currentTodo => currentTodo.id !== todo.id),
        );
      })
      .catch(() => {
        resetErrorMessage();
        setTimeout(() => {
          setErrorMessage('Unable to delete todo');
        }, 0);
      })
      .finally(() => {
        setLoadingTodoIds(prev => prev.filter(id => id !== todo.id));
      });
  };

  const completedTodo = todos.filter(todo => todo.completed);

  const availableCompletedTodo = completedTodo.length > 0;

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <header className="todoapp__header">
          {visibleFooter && (
            <button
              type="button"
              className="todoapp__toggle-all"
              data-cy="ToggleAllButton"
            />
          )}

          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo active"
              placeholder="What needs to be done?"
              value={query}
              onChange={handleQuery}
              disabled={isDisabled}
              autoFocus
              ref={inputRef}
            />
          </form>
        </header>
        <section className="todoapp__main" data-cy="TodoList">
          {selectedTodos.map(selectedTodo => (
            <TodoItem
              key={selectedTodo.id}
              todo={selectedTodo}
              isLoading={loadingTodoIds.includes(selectedTodo.id)}
              onDelete={handleDelete}
            />
          ))}
          {tempTodo && <TodoItem todo={tempTodo} isLoading={true} />}
        </section>

        {visibleFooter && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {activeTodos.length} items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={cn('filter__link', {
                  'filter__link selected': filter === Filters.All,
                })}
                data-cy="FilterLinkAll"
                onClick={() => getSelectedTodos(Filters.All)}
              >
                All
              </a>

              <a
                href="#/active"
                className={cn('filter__link', {
                  'filter__link selected': filter === Filters.Active,
                })}
                data-cy="FilterLinkActive"
                onClick={() => getSelectedTodos(Filters.Active)}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={cn('filter__link', {
                  'filter__link selected': filter === Filters.Completed,
                })}
                data-cy="FilterLinkCompleted"
                onClick={() => getSelectedTodos(Filters.Completed)}
              >
                Completed
              </a>
            </nav>
            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              onClick={() => {
                completedTodo.forEach(todo => {
                  handleDelete(todo);
                });
              }}
            >
              {availableCompletedTodo ? 'Clear completed' : ''}
            </button>
          </footer>
        )}
      </div>
      <div
        data-cy="ErrorNotification"
        className={cn(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: isErrorHidden || loading || !errorMessage },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setIsErrorHidden(true)}
        />
        {errorMessage}
      </div>
    </div>
  );
};
