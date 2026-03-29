import type {
  CapacityOverrideRule,
  LimitingFactor,
  ModePlan,
  OrderInput,
  PlanningResult,
  TransportAllocation,
  TransportCapacityAssessment,
  TransportMode,
  TransportReference,
} from './types'

const STEEL_DENSITY_KG_M3 = 7850
const EPSILON = 1e-6

export function estimatePipeUnitWeightTons(input: {
  diameterMm: number
  wallThicknessMm: number
  lengthM: number
}) {
  const outerDiameterM = input.diameterMm / 1000
  const wallM = input.wallThicknessMm / 1000
  const innerDiameterM = Math.max(outerDiameterM - wallM * 2, 0)
  const metalArea =
    (Math.PI / 4) *
    (outerDiameterM * outerDiameterM - innerDiameterM * innerDiameterM)
  const volumeM3 = metalArea * input.lengthM
  const weightKg = volumeM3 * STEEL_DENSITY_KG_M3

  return Number((weightKg / 1000).toFixed(3))
}

function calculateCirclePackingCapacity(
  widthM: number,
  heightM: number,
  pipeDiameterM: number,
) {
  if (pipeDiameterM <= 0) {
    return 0
  }

  const gridCapacity =
    Math.floor(widthM / pipeDiameterM) * Math.floor(heightM / pipeDiameterM)

  if (widthM + EPSILON < pipeDiameterM || heightM + EPSILON < pipeDiameterM) {
    return 0
  }

  const verticalStep = pipeDiameterM * Math.sqrt(3) * 0.5
  const rows =
    heightM <= pipeDiameterM
      ? 1
      : 1 + Math.floor((heightM - pipeDiameterM) / verticalStep + EPSILON)

  let hexCapacity = 0

  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const isOffsetRow = rowIndex % 2 === 1
    const effectiveWidth = isOffsetRow ? widthM - pipeDiameterM / 2 : widthM
    const rowCapacity =
      effectiveWidth + EPSILON < pipeDiameterM
        ? 0
        : Math.floor(effectiveWidth / pipeDiameterM + EPSILON)

    hexCapacity += rowCapacity
  }

  return Math.max(gridCapacity, hexCapacity)
}

function findReferenceCapacity(
  transport: TransportReference,
  order: OrderInput,
  rules: CapacityOverrideRule[],
) {
  return (
    rules.find(
      (rule) =>
        rule.transportId === transport.id &&
        Math.abs(rule.diameterMm - order.diameterMm) < EPSILON &&
        Math.abs(rule.wallThicknessMm - order.wallThicknessMm) < EPSILON &&
        Math.abs(rule.lengthM - order.lengthM) < EPSILON,
    ) ?? null
  )
}

function assessTransport(
  transport: TransportReference,
  order: OrderInput,
  rules: CapacityOverrideRule[],
): TransportCapacityAssessment {
  const pipeDiameterM = order.diameterMm / 1000
  const weightCapacity = Math.floor(transport.payloadT / order.unitWeightT)

  if (order.lengthM > transport.innerLengthM + EPSILON) {
    return {
      transport,
      isFeasible: false,
      unitCapacity: 0,
      geometryCapacity: 0,
      weightCapacity,
      longitudinalSlots: 0,
      crossSectionCapacity: 0,
      source: 'estimated',
      limitingFactor: 'infeasible',
      reason: 'Длина трубы больше полезной длины транспорта.',
    }
  }

  if (pipeDiameterM > transport.innerWidthM + EPSILON) {
    return {
      transport,
      isFeasible: false,
      unitCapacity: 0,
      geometryCapacity: 0,
      weightCapacity,
      longitudinalSlots: 0,
      crossSectionCapacity: 0,
      source: 'estimated',
      limitingFactor: 'infeasible',
      reason: 'Диаметр трубы не проходит по ширине полезного пространства.',
    }
  }

  if (pipeDiameterM > transport.innerHeightM + EPSILON) {
    return {
      transport,
      isFeasible: false,
      unitCapacity: 0,
      geometryCapacity: 0,
      weightCapacity,
      longitudinalSlots: 0,
      crossSectionCapacity: 0,
      source: 'estimated',
      limitingFactor: 'infeasible',
      reason: 'Диаметр трубы не проходит по высоте полезного пространства.',
    }
  }

  const longitudinalSlots = Math.max(
    1,
    Math.floor(transport.innerLengthM / order.lengthM + EPSILON),
  )
  const crossSectionCapacity = calculateCirclePackingCapacity(
    transport.innerWidthM,
    transport.innerHeightM,
    pipeDiameterM,
  )
  const geometryCapacity = crossSectionCapacity * longitudinalSlots

  if (weightCapacity <= 0) {
    return {
      transport,
      isFeasible: false,
      unitCapacity: 0,
      geometryCapacity,
      weightCapacity,
      longitudinalSlots,
      crossSectionCapacity,
      source: 'estimated',
      limitingFactor: 'infeasible',
      reason: 'Грузоподъемность транспорта меньше массы одной трубы.',
    }
  }

  const referenceCapacity = findReferenceCapacity(transport, order, rules)

  if (referenceCapacity) {
    const unitCapacity = Math.min(referenceCapacity.maxPipes, weightCapacity)

    return {
      transport,
      isFeasible: unitCapacity > 0,
      unitCapacity,
      geometryCapacity,
      weightCapacity,
      longitudinalSlots,
      crossSectionCapacity,
      source: 'reference',
      limitingFactor: 'reference',
      reason:
        unitCapacity > 0
          ? `Использован справочный норматив: ${referenceCapacity.sourceLabel}.`
          : 'По справочному нормативу и грузоподъемности загрузка невозможна.',
    }
  }

  const unitCapacity = Math.min(geometryCapacity, weightCapacity)
  const limitingFactor: LimitingFactor =
    unitCapacity === 0
      ? 'infeasible'
      : weightCapacity <= geometryCapacity
        ? 'weight'
        : 'geometry'

  return {
    transport,
    isFeasible: unitCapacity > 0,
    unitCapacity,
    geometryCapacity,
    weightCapacity,
    longitudinalSlots,
    crossSectionCapacity,
    source: 'estimated',
    limitingFactor,
    reason:
      unitCapacity > 0
        ? 'Использована расчетная оценка по габаритам и грузоподъемности.'
        : 'Для данного транспорта не удалось получить положительную вместимость.',
  }
}

function buildModePlan(
  mode: TransportMode,
  assessments: TransportCapacityAssessment[],
  quantity: number,
) {
  const feasible = assessments
    .filter((assessment) => assessment.isFeasible && assessment.unitCapacity > 0)
    .sort(
      (left, right) =>
        right.unitCapacity - left.unitCapacity ||
        left.transport.name.localeCompare(right.transport.name, 'ru'),
    )

  if (feasible.length === 0) {
    return null
  }

  const maxCapacity = Math.max(
    ...feasible.map((assessment) => assessment.unitCapacity),
  )
  const limit = quantity + maxCapacity
  const capacityMap = new Map(
    feasible.map((assessment) => [assessment.transport.id, assessment.unitCapacity]),
  )

  const dp: Array<
    | {
        units: number
        previous: number
        transportId: string
      }
    | undefined
  > = Array.from({ length: limit + 1 })

  dp[0] = { units: 0, previous: -1, transportId: '' }

  for (let filled = 0; filled <= limit; filled += 1) {
    const state = dp[filled]
    if (!state) {
      continue
    }

    for (const assessment of feasible) {
      const next = Math.min(limit, filled + assessment.unitCapacity)
      const candidateUnits = state.units + 1
      const existing = dp[next]

      if (
        !existing ||
        candidateUnits < existing.units ||
        (candidateUnits === existing.units &&
          assessment.unitCapacity > (capacityMap.get(existing.transportId) ?? 0))
      ) {
        dp[next] = {
          units: candidateUnits,
          previous: filled,
          transportId: assessment.transport.id,
        }
      }
    }
  }

  let bestFilled = -1

  for (let filled = quantity; filled <= limit; filled += 1) {
    if (!dp[filled]) {
      continue
    }

    if (bestFilled === -1) {
      bestFilled = filled
      continue
    }

    const current = dp[filled]!
    const best = dp[bestFilled]!

    if (
      current.units < best.units ||
      (current.units === best.units && filled < bestFilled)
    ) {
      bestFilled = filled
    }
  }

  if (bestFilled === -1) {
    return null
  }

  const counts = new Map<string, number>()
  let cursor = bestFilled

  while (cursor > 0) {
    const state = dp[cursor]
    if (!state) {
      break
    }

    counts.set(state.transportId, (counts.get(state.transportId) ?? 0) + 1)
    cursor = state.previous
  }

  const allocations: TransportAllocation[] = feasible
    .filter((assessment) => counts.has(assessment.transport.id))
    .map((assessment) => ({
      transportId: assessment.transport.id,
      transportName: assessment.transport.name,
      count: counts.get(assessment.transport.id) ?? 0,
      unitCapacity: assessment.unitCapacity,
      mode,
      source: assessment.source,
      limitingFactor: assessment.limitingFactor,
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        right.unitCapacity - left.unitCapacity ||
        left.transportName.localeCompare(right.transportName, 'ru'),
    )

  const totalUnits = allocations.reduce(
    (sum, allocation) => sum + allocation.count,
    0,
  )

  return {
    mode,
    totalUnits,
    totalCapacity: bestFilled,
    overfill: bestFilled - quantity,
    allocations,
    assessments,
  } satisfies ModePlan
}

function validateOrder(order: OrderInput) {
  const errors: string[] = []

  if (!Number.isFinite(order.diameterMm) || order.diameterMm <= 0) {
    errors.push('Диаметр трубы должен быть больше 0 мм.')
  }

  if (!Number.isFinite(order.wallThicknessMm) || order.wallThicknessMm <= 0) {
    errors.push('Толщина стенки должна быть больше 0 мм.')
  }

  if (order.wallThicknessMm * 2 >= order.diameterMm) {
    errors.push(
      'Толщина стенки слишком велика относительно наружного диаметра трубы.',
    )
  }

  if (!Number.isFinite(order.lengthM) || order.lengthM <= 0) {
    errors.push('Длина трубы должна быть больше 0 м.')
  }

  if (!Number.isFinite(order.unitWeightT) || order.unitWeightT <= 0) {
    errors.push('Масса одной трубы должна быть больше 0 т.')
  }

  if (
    !Number.isFinite(order.quantity) ||
    !Number.isInteger(order.quantity) ||
    order.quantity <= 0
  ) {
    errors.push('Количество труб должно быть целым положительным числом.')
  }

  return errors
}

export function planOrder(
  order: OrderInput,
  transports: TransportReference[],
  rules: CapacityOverrideRule[],
): PlanningResult {
  const errors = validateOrder(order)

  if (errors.length > 0) {
    return {
      errors,
      assessments: [],
      alternatives: [],
      recommendedPlan: null,
    }
  }

  const assessments = transports.map((transport) =>
    assessTransport(transport, order, rules),
  )

  const modePlans = (['rail', 'truck'] as TransportMode[])
    .map((mode) =>
      buildModePlan(
        mode,
        assessments.filter((assessment) => assessment.transport.mode === mode),
        order.quantity,
      ),
    )
    .filter((plan): plan is ModePlan => plan !== null)
    .sort((left, right) => {
      if (left.totalUnits !== right.totalUnits) {
        return left.totalUnits - right.totalUnits
      }

      if (left.mode !== right.mode) {
        return left.mode === order.priorityMode ? -1 : 1
      }

      return left.overfill - right.overfill
    })

  if (modePlans.length === 0) {
    return {
      errors: [
        'Ни один транспорт не подходит под текущие параметры заказа. Проверьте длину, диаметр, массу и справочники.',
      ],
      assessments,
      alternatives: [],
      recommendedPlan: null,
    }
  }

  return {
    errors: [],
    assessments,
    alternatives: modePlans,
    recommendedPlan: modePlans[0],
  }
}

export function formatLimitingFactor(value: LimitingFactor) {
  switch (value) {
    case 'reference':
      return 'справочник'
    case 'weight':
      return 'грузоподъемность'
    case 'geometry':
      return 'габариты'
    case 'infeasible':
      return 'недоступно'
    default:
      return value
  }
}
