import { z } from 'zod'

const positiveNumber = (label: string) =>
  z
    .number({ error: `${label} обязательно` })
    .refine((value) => Number.isFinite(value), `${label} должно быть числом`)
    .positive(`${label} должно быть больше 0`)

const positiveInteger = (label: string) =>
  z
    .number({ error: `${label} обязательно` })
    .refine((value) => Number.isFinite(value), `${label} должно быть числом`)
    .int(`${label} должно быть целым числом`)
    .positive(`${label} должно быть больше 0`)

const nonEmptyString = (label: string) =>
  z.string().trim().min(1, `${label} обязательно`)

export const orderSchema = z
  .object({
    diameterMm: positiveInteger('Диаметр'),
    wallThicknessMm: positiveInteger('Толщина стенки'),
    lengthM: positiveNumber('Длина трубы'),
    unitWeightT: positiveNumber('Масса одной трубы'),
    quantity: positiveInteger('Количество труб'),
    priorityMode: z.enum(['rail', 'truck']),
  })
  .superRefine((value, context) => {
    if (value.wallThicknessMm * 2 >= value.diameterMm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wallThicknessMm'],
        message:
          'Толщина стенки слишком велика относительно наружного диаметра трубы.',
      })
    }
  })

export const pipeReferenceSchema = z
  .object({
    id: nonEmptyString('ID'),
    name: nonEmptyString('Название'),
    diameterMm: positiveInteger('Диаметр'),
    wallThicknessMm: positiveInteger('Толщина стенки'),
    lengthM: positiveNumber('Длина'),
    unitWeightT: positiveNumber('Масса'),
  })
  .superRefine((value, context) => {
    if (value.wallThicknessMm * 2 >= value.diameterMm) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['wallThicknessMm'],
        message:
          'Толщина стенки слишком велика относительно наружного диаметра трубы.',
      })
    }
  })

export const transportReferenceSchema = z.object({
  id: nonEmptyString('ID'),
  name: nonEmptyString('Название'),
  mode: z.enum(['rail', 'truck']),
  payloadT: positiveNumber('Грузоподъемность'),
  innerWidthM: positiveNumber('Ширина'),
  innerHeightM: positiveNumber('Высота'),
  innerLengthM: positiveNumber('Длина'),
  notes: z.string().optional(),
})

export const pipeCatalogFormSchema = z.object({
  pipes: z.array(pipeReferenceSchema).min(1, 'Добавьте хотя бы одну трубу.'),
})

export const transportCatalogFormSchema = z.object({
  transports: z
    .array(transportReferenceSchema)
    .min(1, 'Добавьте хотя бы один тип транспорта.'),
})
