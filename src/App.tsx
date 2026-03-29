import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  ConfigProvider,
  Layout,
  Segmented,
  Space,
  Typography,
} from 'antd'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { useForm, useWatch } from 'react-hook-form'
import './App.css'
import { estimatePipeUnitWeightTons, planOrder } from './algorithm'
import {
  createPipeReference,
  createTransportReference,
  findMatchingPipeTemplate,
  initialOrder,
  loadStoredState,
  scenarios,
  STORAGE_KEYS,
} from './appShared'
import { makeZodResolver } from './formResolvers'
import {
  capacityOverrideRules,
  initialPipeReferences,
  initialTransportReferences,
} from './mockData'
import { DirectoryPage } from './pages/DirectoryPage'
import { WorkspacePage } from './pages/WorkspacePage'
import { orderSchema } from './schemas'
import type { OrderInput, PipeReference, TransportReference, UserRole } from './types'

const routeOptions = [
  {
    label: 'Рабочее место пользователя',
    hint: 'Расчет заказа и подбор оптимального транспорта',
    value: '/workspace',
  },
  {
    label: 'Подсистема редактирования',
    hint: 'Управление справочниками труб и транспорта',
    value: '/directories',
  },
]

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [role, setRole] = useState<UserRole>(() =>
    loadStoredState<UserRole>(STORAGE_KEYS.role, 'operator'),
  )
  const [pipeCatalog, setPipeCatalog] = useState<PipeReference[]>(() =>
    loadStoredState(STORAGE_KEYS.pipes, initialPipeReferences),
  )
  const [transportCatalog, setTransportCatalog] = useState<TransportReference[]>(
    () => loadStoredState(STORAGE_KEYS.transports, initialTransportReferences),
  )

  const orderForm = useForm<OrderInput>({
    defaultValues: initialOrder,
    mode: 'onChange',
    reValidateMode: 'onChange',
    resolver: makeZodResolver(orderSchema),
  })

  const orderValues = useWatch({
    control: orderForm.control,
    defaultValue: initialOrder,
  }) as OrderInput

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.role, JSON.stringify(role))
  }, [role])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.pipes, JSON.stringify(pipeCatalog))
  }, [pipeCatalog])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.transports, JSON.stringify(transportCatalog))
  }, [transportCatalog])

  const recommendedWeight = useMemo(
    () =>
      estimatePipeUnitWeightTons({
        diameterMm: orderValues.diameterMm,
        wallThicknessMm: orderValues.wallThicknessMm,
        lengthM: orderValues.lengthM,
      }),
    [orderValues.diameterMm, orderValues.lengthM, orderValues.wallThicknessMm],
  )

  const planning = useMemo(
    () => planOrder(orderValues, transportCatalog, capacityOverrideRules),
    [orderValues, transportCatalog],
  )

  const selectedPipe = findMatchingPipeTemplate(pipeCatalog, orderValues)
  const selectedPipeValue = selectedPipe?.id ?? 'custom'
  const adminLocked = role !== 'admin'
  const currentRoute =
    location.pathname.startsWith('/directories') ? '/directories' : '/workspace'

  function applyPipeTemplate(pipeId: string) {
    if (pipeId === 'custom') {
      return
    }

    const nextPipe = pipeCatalog.find((pipe) => pipe.id === pipeId)
    if (!nextPipe) {
      return
    }

    orderForm.reset({
      ...orderValues,
      diameterMm: nextPipe.diameterMm,
      wallThicknessMm: nextPipe.wallThicknessMm,
      lengthM: nextPipe.lengthM,
      unitWeightT: nextPipe.unitWeightT,
    })
  }

  function applyScenario(index: number) {
    const scenario = scenarios[index]
    if (!scenario) {
      return
    }

    orderForm.reset(scenario.order)
  }

  function applyRecommendedWeight() {
    orderForm.setValue('unitWeightT', recommendedWeight, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
  }

  function savePipeCatalog(nextCatalog: PipeReference[]) {
    setPipeCatalog(nextCatalog)
  }

  function saveTransportCatalog(nextCatalog: TransportReference[]) {
    setTransportCatalog(nextCatalog)
  }

  function navigateToRoute(route: string) {
    if (route === currentRoute) {
      return
    }

    navigate(route)
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1f78b4',
          borderRadius: 18,
          fontFamily: "'Segoe UI', 'Trebuchet MS', sans-serif",
        },
      }}
    >
      <Layout className="app-shell">
        <Card bordered={false} className="hero-card">
          <div className="hero-panel">
            <div className="hero-copy">
              <Typography.Text className="eyebrow">
                Прототип системы оптимальной отгрузки
              </Typography.Text>
              <Typography.Title level={1}>
                Расчет транспорта для трубного заказа
              </Typography.Title>
              <Typography.Paragraph>
                Веб-прототип помогает рассчитать минимально достаточное количество
                транспорта для отгрузки трубного заказа, сравнить варианты по ЖД
                и автотранспорту, а также управлять справочниками сортамента и
                характеристик перевозки.
              </Typography.Paragraph>
            </div>

            <Space direction="vertical" size={16} className="hero-actions">
              <Typography.Text strong>Роль пользователя</Typography.Text>
              <Segmented
                block
                options={[
                  { label: 'Оператор', value: 'operator' },
                  { label: 'Администратор', value: 'admin' },
                ]}
                value={role}
                onChange={(value) => setRole(value as UserRole)}
              />
            </Space>
          </div>
        </Card>

        <Card bordered={false} className="route-nav-card">
          <div className="route-nav">
            {routeOptions.map((option) => (
              <Button
                key={option.value}
                className={
                  currentRoute === option.value
                    ? 'route-button is-active'
                    : 'route-button'
                }
                type={currentRoute === option.value ? 'primary' : 'default'}
                onClick={() => navigateToRoute(option.value)}
              >
                <Space direction="vertical" size={2} className="full-width">
                  <span className="route-button__label">{option.label}</span>
                  <span className="route-button__hint">{option.hint}</span>
                </Space>
              </Button>
            ))}
          </div>
        </Card>

        <div className="app-content">
          <Routes>
            <Route path="/" element={<Navigate replace to="/workspace" />} />
            <Route
              path="/workspace"
              element={
                <WorkspacePage
                  control={orderForm.control}
                  formState={orderForm.formState}
                  onApplyPipeTemplate={applyPipeTemplate}
                  onApplyRecommendedWeight={applyRecommendedWeight}
                  onApplyScenario={applyScenario}
                  order={orderValues}
                  pipeCatalog={pipeCatalog}
                  planning={planning}
                  recommendedWeight={recommendedWeight}
                  selectedPipe={selectedPipe}
                  selectedPipeValue={selectedPipeValue}
                />
              }
            />
            <Route
              path="/directories"
              element={
                <DirectoryPage
                  adminLocked={adminLocked}
                  createPipeDraft={() => createPipeReference('Новая труба', 530, 8, 11)}
                  createTransportDraft={createTransportReference}
                  onSavePipeCatalog={savePipeCatalog}
                  onSaveTransportCatalog={saveTransportCatalog}
                  pipeCatalog={pipeCatalog}
                  transportCatalog={transportCatalog}
                />
              }
            />
            <Route path="*" element={<Navigate replace to="/workspace" />} />
          </Routes>
        </div>
      </Layout>
    </ConfigProvider>
  )
}

export default App
