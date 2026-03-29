import type { FieldErrors, Resolver } from 'react-hook-form'
import { ZodError, type ZodType } from 'zod'

function setNestedError(
  target: Record<string, unknown>,
  path: Array<string | number>,
  value: { type: string; message: string },
) {
  let cursor: Record<string, unknown> = target

  path.forEach((segment, index) => {
    const key = String(segment)
    const isLast = index === path.length - 1

    if (isLast) {
      cursor[key] = value
      return
    }

    if (!(key in cursor)) {
      const nextSegment = path[index + 1]
      cursor[key] = typeof nextSegment === 'number' ? [] : {}
    }

    cursor = cursor[key] as Record<string, unknown>
  })
}

function toFieldErrors<TFieldValues extends Record<string, unknown>>(
  error: ZodError,
) {
  const errors: Record<string, unknown> = {}

  for (const issue of error.issues) {
    const normalizedPath = issue.path.filter(
      (segment): segment is string | number =>
        typeof segment === 'string' || typeof segment === 'number',
    )
    const path = normalizedPath.length > 0 ? normalizedPath : ['root']
    setNestedError(errors, path, {
      type: issue.code,
      message: issue.message,
    })
  }

  return errors as FieldErrors<TFieldValues>
}

export function makeZodResolver<TFieldValues extends Record<string, unknown>>(
  schema: ZodType<TFieldValues>,
): Resolver<TFieldValues> {
  return (values) => {
    const result = schema.safeParse(values)

    if (result.success) {
      return {
        values: result.data,
        errors: {},
      }
    }

    return {
      values: {} as never,
      errors: toFieldErrors<TFieldValues>(result.error),
    }
  }
}
