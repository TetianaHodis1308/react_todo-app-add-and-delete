/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import { createTodos, deleteTodos, getTodos, USER_ID } from './api/todos';
import { Todo } from './types/Todo';
// import cn from 'classnames';
import { TodoFilters } from './types/TodoFilters';
import { TodoItem } from './components/TodoItem';
import { ErrorMessage } from './types/ErrorMessage';
import { StatusTodo } from './components/StatusTodo';
// eslint-disable-next-line max-len
import { ClearCompletedTodosButton } from './components/ClearCompletedTodosButton';
import { ErrorNotification } from './components/ErrorNotification';

const getVisibleTodos = (todos: Todo[], todoFilter: TodoFilters) => {
  let visibleTodos = [...todos];

  if (todoFilter !== TodoFilters.All) {
    switch (todoFilter) {
      case TodoFilters.Completed:
        visibleTodos = visibleTodos.filter(todo => todo.completed);
        break;
      case TodoFilters.Active:
        visibleTodos = visibleTodos.filter(todo => !todo.completed);
        break;
      default:
        break;
    }
  }

  return visibleTodos;
};

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<ErrorMessage>(
    ErrorMessage.WithoutError,
  );
  const [todoFilter, setTodoFilter] = useState<TodoFilters>(TodoFilters.All);
  // **** block add
  const [query, setQuery] = useState('');
  const [tempTodo, setTempTodo] = useState<Todo | null>(null);
  const [isDisabled, setIsDisabled] = useState(false);
  // **** block delete
  const [loadingTodoIds, setLoadingTodoIds] = useState<number[]>([]);

  useEffect(() => {
    getTodos()
      .then(todosFromServer => {
        setTodos(todosFromServer);
      })
      .catch(() => setErrorMessage(ErrorMessage.UnableLoadTodos))
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (errorMessage) {
      timer = setTimeout(() => {
        setErrorMessage(ErrorMessage.WithoutError);
      }, 3000);
    }

    return () => clearTimeout(timer);
  }, [errorMessage]);

  const visibleTodos: Todo[] = getVisibleTodos(todos, todoFilter);

  const activeTodos = todos.filter(todo => !todo.completed);

  const visibleFooter = todos.length !== 0;

  // **** block add
  const inputRef = useRef<HTMLInputElement>(null);

  const handleQuery = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setErrorMessage(ErrorMessage.WithoutError);

      setTimeout(() => {
        setErrorMessage(ErrorMessage.EmptyTitle);
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
        setTempTodo(null);
        setIsDisabled(false);
        setQuery('');
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.UnableAddTodo);
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

  const handleDeleteTodo = (todo: Todo) => {
    setLoadingTodoIds(prev => [...prev, todo.id]);

    deleteTodos(todo.id)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(currentTodo => currentTodo.id !== todo.id),
        );
      })
      .catch(() => {
        setErrorMessage(ErrorMessage.WithoutError);
        setTimeout(() => {
          setErrorMessage(ErrorMessage.UnableDeleteTodo);
        }, 0);
      })
      .finally(() => {
        setLoadingTodoIds(prev => prev.filter(id => id !== todo.id));
        inputRef.current?.focus();
      });
  };

  const completedTodo = todos.filter(todo => todo.completed);

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
        {!loading && (
          <>
            <section className="todoapp__main" data-cy="TodoList">
              {visibleTodos.map(todo => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isLoading={loadingTodoIds.includes(todo.id)}
                  onDelete={handleDeleteTodo}
                />
              ))}
              {tempTodo && <TodoItem todo={tempTodo} isLoading={true} />}
            </section>

            {visibleFooter && (
              <footer className="todoapp__footer" data-cy="Footer">
                <span className="todo-count" data-cy="TodosCounter">
                  {activeTodos.length} items left
                </span>

                <StatusTodo
                  todoFilter={todoFilter}
                  onTodoFilter={setTodoFilter}
                />

                <ClearCompletedTodosButton
                  completedTodo={completedTodo}
                  onDeleteTodo={handleDeleteTodo}
                />
              </footer>
            )}
          </>
        )}
      </div>
      <ErrorNotification
        errorMessage={errorMessage}
        onSetErrorMessage={setErrorMessage}
      />
    </div>
  );
};
