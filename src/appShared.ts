import { estimatePipeUnitWeightTons } from './algorithm'
import { initialPipeReferences } from './mockData'
import type {
  OrderInput,
  PipeReference,
  TransportMode,
  TransportReference,
} from './types'

export const STORAGE_KEYS = {
  pipes: 'pipe-loading-pipes',
  transports: 'pipe-loading-transports',
  role: 'pipe-loading-role',
} as const

export const modeLabels: Record<TransportMode, string> = {
  rail: 'ЖД транспорт',
  truck: 'Автотранспорт',
}

export const priorityDescriptions: Record<TransportMode, string> = {
  rail: 'При равенстве по количеству единиц система предпочтет вагоны.',
  truck: 'При равенстве по количеству единиц система предпочтет машины.',
}

export function buildOrder(
  pipe: PipeReference,
  priorityMode: TransportMode,
  quantity: number,
): OrderInput {
  return {
    diameterMm: pipe.diameterMm,
    wallThicknessMm: pipe.wallThicknessMm,
    lengthM: pipe.lengthM,
    unitWeightT: pipe.unitWeightT,
    quantity,
    priorityMode,
  }
}

export const scenarios = [
  {
    id: 'scenario-1',
    title: '76 труб 426 x 8',
    description: 'Сценарий из задания. Приоритет отдан ЖД транспорту.',
    order: buildOrder(initialPipeReferences[2], 'rail', 76),
  },
  {
    id: 'scenario-2',
    title: '18 труб 1020 x 12',
    description: 'Проверка на крупном диаметре с альтернативой машинам.',
    order: buildOrder(initialPipeReferences[7], 'truck', 18),
  },
  {
    id: 'scenario-3',
    title: 'Некорректная длина',
    description:
      'Длина специально больше кузова и вагона для проверки ошибок ввода.',
    order: {
      diameterMm: 530,
      wallThicknessMm: 8,
      lengthM: 14.4,
      unitWeightT: estimatePipeUnitWeightTons({
        diameterMm: 530,
        wallThicknessMm: 8,
        lengthM: 14.4,
      }),
      quantity: 16,
      priorityMode: 'truck',
    } satisfies OrderInput,
  },
]

export const initialOrder = scenarios[0].order

export function loadStoredState<T>(key: string, fallback: T) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat('ru-RU', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatMode(mode: TransportMode) {
  return modeLabels[mode]
}

export function createPipeReference(
  name: string,
  diameterMm: number,
  wallThicknessMm: number,
  lengthM: number,
) {
  return {
    id: crypto.randomUUID(),
    name,
    diameterMm,
    wallThicknessMm,
    lengthM,
    unitWeightT: estimatePipeUnitWeightTons({
      diameterMm,
      wallThicknessMm,
      lengthM,
    }),
  } satisfies PipeReference
}

export function createTransportReference(mode: TransportMode) {
  return {
    id: crypto.randomUUID(),
    name:
      mode === 'rail' ? 'Новый ЖД транспорт' : 'Новый автомобильный транспорт',
    mode,
    payloadT: mode === 'rail' ? 60 : 40,
    innerWidthM: mode === 'rail' ? 2.9 : 2.45,
    innerHeightM: mode === 'rail' ? 2.1 : 2.4,
    innerLengthM: mode === 'rail' ? 12.2 : 13.6,
    notes: 'Пользовательская запись',
  } satisfies TransportReference
}

export function findMatchingPipeTemplate(
  pipes: PipeReference[],
  order: Pick<
    OrderInput,
    'diameterMm' | 'wallThicknessMm' | 'lengthM' | 'unitWeightT'
  >,
) {
  return (
    pipes.find(
      (pipe) =>
        pipe.diameterMm === order.diameterMm &&
        pipe.wallThicknessMm === order.wallThicknessMm &&
        pipe.lengthM === order.lengthM &&
        pipe.unitWeightT === order.unitWeightT,
    ) ?? null
  )
}
