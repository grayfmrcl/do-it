import Database from 'better-sqlite3';
import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Initialize database
const db = new Database('doit.db');

// Create tables if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

// Prepare statements
const createTask = db.prepare(`INSERT INTO tasks (title, description) VALUES (?, ?)`);
const getTasks = db.prepare(`SELECT * FROM tasks`);
const getTaskById = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
const updateTask = db.prepare(`UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?`);
const deleteTask = db.prepare(`DELETE FROM tasks WHERE id = ?`);

app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Do-It API!' });
});

app.get('/tasks', (req: Request, res: Response) => {
  try {
    const tasks = getTasks.all();
    return res.json(tasks);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to get tasks' });
  }
});

app.get('/tasks/:id', (req: Request, res: Response) => {
  try {
    const task = getTaskById.get(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(task);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to get task' });
  }
});

app.post('/tasks', (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const result = createTask.run(title, description);
    const newTask = getTaskById.get(result.lastInsertRowid)
    return res.json(newTask);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to create tasks' });
  }
});

app.patch('/tasks/:id', (req: Request, res: Response) => {
  try {
    const { title, description, completed } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    const result = updateTask.run(title, description, completed ? 1 : 0, req.params.id)
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to update tasks' });
  }
});

app.delete('/tasks/:id', (req: Request, res: Response) => {
  try {
    const result = deleteTask.run(req.params.id)
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Task not found' });
  }
  return res.json({ message: 'Task deleted successfully' })
  } catch(error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to delete tasks'});
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});