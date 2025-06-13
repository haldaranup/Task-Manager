import TaskList from '@/components/TaskList';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Task Manager</h1>
        <TaskList />
      </div>
    </main>
  );
}
