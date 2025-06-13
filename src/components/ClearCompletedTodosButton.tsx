import { Todo } from '../types/Todo';

type ClearCompletedTodosButtonProps = {
  completedTodo: Todo[];
  onDeleteTodo: (todo: Todo) => void;
};

export const ClearCompletedTodosButton = ({
  completedTodo,
  onDeleteTodo,
}: ClearCompletedTodosButtonProps) => {
  const availableCompletedTodo = completedTodo.length > 0;

  return (
    <button
      type="button"
      className="todoapp__clear-completed"
      data-cy="ClearCompletedButton"
      onClick={() => {
        completedTodo.forEach(todo => {
          onDeleteTodo(todo);
        });
      }}
      disabled={!availableCompletedTodo}
    >
      Clear completed
    </button>
  );
};
