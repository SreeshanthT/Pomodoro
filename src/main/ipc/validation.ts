import { z } from 'zod'

// Runtime validation for IPC payloads. TypeScript's parameter types on ipcMain.handle callbacks
// are compile-time only — a compromised or misbehaving renderer can send anything over the wire,
// so every field here is re-checked at the boundary rather than trusted from the type annotation.

const idSchema = z.string().trim().min(1).max(200)

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)')

const subtaskSchema = z.object({
  id: z.string().min(1).max(200),
  title: z.string().trim().min(1).max(500),
  completed: z.boolean()
})

const recurrenceSchema = z.enum(['daily', 'weekly'])

const newTaskSchema = z.object({
  title: z.string().trim().min(1).max(500),
  dueDate: isoDateSchema,
  notes: z.string().max(5000).optional(),
  estimatedPomodoros: z.number().int().min(1).max(99).optional(),
  priority: z.boolean().optional(),
  recurrence: recurrenceSchema.nullable().optional(),
  projectId: idSchema.nullable().optional(),
  subtasks: z.array(subtaskSchema).max(200).optional()
})

const taskUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(500),
    notes: z.string().max(5000),
    dueDate: isoDateSchema,
    completed: z.boolean(),
    completedAt: z.string().nullable(),
    estimatedPomodoros: z.number().int().min(1).max(99),
    completedPomodoros: z.number().int().min(0).max(100_000),
    priority: z.boolean(),
    subtasks: z.array(subtaskSchema).max(200),
    recurrence: recurrenceSchema.nullable(),
    projectId: idSchema.nullable(),
    order: z.number().finite()
  })
  .partial()

const completeRecurringSchema = z.object({
  id: idSchema,
  completedAt: z.string().min(1),
  nextOccurrence: newTaskSchema
})

const newProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex color')
})

export const taskSchemas = {
  id: idSchema,
  newTask: newTaskSchema,
  taskUpdate: taskUpdateSchema,
  completeRecurring: completeRecurringSchema
}

export const projectSchemas = {
  id: idSchema,
  newProject: newProjectSchema
}
