export type TransportMode = 'truck' | 'rail'
export type UserRole = 'operator' | 'admin'

export interface PipeReference {
  id: string
  name: string
  diameterMm: number
  wallThicknessMm: number
  lengthM: number
  unitWeightT: number
}

export interface TransportReference {
  id: string
  name: string
  mode: TransportMode
  payloadT: number
  innerWidthM: number
  innerHeightM: number
  innerLengthM: number
  notes?: string
}

export interface OrderInput {
  diameterMm: number
  wallThicknessMm: number
  lengthM: number
  unitWeightT: number
  quantity: number
  priorityMode: TransportMode
}

export interface CapacityOverrideRule {
  transportId: string
  diameterMm: number
  wallThicknessMm: number
  lengthM: number
  maxPipes: number
  sourceLabel: string
}

export type CapacitySource = 'reference' | 'estimated'
export type LimitingFactor = 'reference' | 'weight' | 'geometry' | 'infeasible'

export interface TransportCapacityAssessment {
  transport: TransportReference
  isFeasible: boolean
  unitCapacity: number
  geometryCapacity: number
  weightCapacity: number
  longitudinalSlots: number
  crossSectionCapacity: number
  source: CapacitySource
  limitingFactor: LimitingFactor
  reason?: string
}

export interface TransportAllocation {
  transportId: string
  transportName: string
  count: number
  unitCapacity: number
  mode: TransportMode
  source: CapacitySource
  limitingFactor: LimitingFactor
}

export interface ModePlan {
  mode: TransportMode
  totalUnits: number
  totalCapacity: number
  overfill: number
  allocations: TransportAllocation[]
  assessments: TransportCapacityAssessment[]
}

export interface PlanningResult {
  errors: string[]
  assessments: TransportCapacityAssessment[]
  alternatives: ModePlan[]
  recommendedPlan: ModePlan | null
}
