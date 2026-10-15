import { TasksProvider } from "../state/useTasks";
import Board from "./Board";

export default function App() {
  return (
    <TasksProvider>
      <Board />
    </TasksProvider>
  );
}
