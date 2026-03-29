import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  Row,
  Select,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd'
import { Controller, type Control, type FormState } from 'react-hook-form'
import { formatLimitingFactor } from '../algorithm'
import {
  formatMode,
  formatNumber,
  priorityDescriptions,
  scenarios,
} from '../appShared'
import type {
  OrderInput,
  PipeReference,
  PlanningResult,
  TransportCapacityAssessment,
  TransportMode,
} from '../types'

interface WorkspacePageProps {
  control: Control<OrderInput>
  formState: FormState<OrderInput>
  pipeCatalog: PipeReference[]
  selectedPipeValue: string
  selectedPipe: PipeReference | null
  order: OrderInput
  recommendedWeight: number
  planning: PlanningResult
  onApplyPipeTemplate: (pipeId: string) => void
  onApplyScenario: (index: number) => void
  onApplyRecommendedWeight: () => void
}

const fieldErrorOrder: Array<keyof OrderInput> = [
  'diameterMm',
  'wallThicknessMm',
  'lengthM',
  'unitWeightT',
  'quantity',
]

export function WorkspacePage({
  control,
  formState,
  pipeCatalog,
  selectedPipeValue,
  selectedPipe,
  order,
  recommendedWeight,
  planning,
  onApplyPipeTemplate,
  onApplyScenario,
  onApplyRecommendedWeight,
}: WorkspacePageProps) {
  const validationMessages = fieldErrorOrder
    .map((field) => formState.errors[field]?.message)
    .filter((message): message is string => Boolean(message))

  const assessmentColumns = [
    {
      title: 'Транспорт',
      key: 'transport',
      render: (_: unknown, assessment: TransportCapacityAssessment) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>{assessment.transport.name}</Typography.Text>
          <Typography.Text type="secondary">
            {formatMode(assessment.transport.mode)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Вместимость',
      key: 'capacity',
      render: (_: unknown, assessment: TransportCapacityAssessment) => (
        <Space direction="vertical" size={2}>
          <Typography.Text strong>
            {assessment.isFeasible ? assessment.unitCapacity : 0}
          </Typography.Text>
          <Typography.Text type="secondary">
            Габариты {assessment.geometryCapacity} / вес {assessment.weightCapacity}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Ограничение',
      key: 'limit',
      render: (_: unknown, assessment: TransportCapacityAssessment) => (
        <Space direction="vertical" size={6}>
          <Tag color={assessment.source === 'reference' ? 'blue' : 'default'}>
            {assessment.source === 'reference' ? 'Норматив' : 'Расчет'}
          </Tag>
          <Typography.Text>
            {formatLimitingFactor(assessment.limitingFactor)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Примечание',
      dataIndex: 'reason',
      key: 'reason',
      render: (value: string | undefined) => value ?? 'Без пояснения',
    },
  ]

  return (
    <section className="page-stack">
      <Card bordered={false} className="page-card">
        <Space direction="vertical" size={4}>
          <Typography.Text className="panel-kicker">
            Рабочее место пользователя
          </Typography.Text>
          <Typography.Title level={2}>Расчет заказа</Typography.Title>
          <Typography.Paragraph className="page-muted">
            {priorityDescriptions[order.priorityMode]}
          </Typography.Paragraph>
        </Space>
      </Card>

      <div className="page-grid">
        <Card bordered={false} className="page-card">
          <Space direction="vertical" size={20} className="full-width">
            <div className="scenario-grid">
              {scenarios.map((scenario, index) => (
                <Button
                  key={scenario.id}
                  block
                  className="scenario-button"
                  onClick={() => onApplyScenario(index)}
                >
                  <Space direction="vertical" size={4} className="full-width">
                    <Typography.Text strong>{scenario.title}</Typography.Text>
                    <Typography.Text type="secondary">
                      {scenario.description}
                    </Typography.Text>
                  </Space>
                </Button>
              ))}
            </div>

            {validationMessages.length > 0 ? (
              <Alert
                showIcon
                type="error"
                message="Проверьте поля формы"
                description={
                  <ul className="alert-list">
                    {validationMessages.map((message) => (
                      <li key={message}>{message}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            <Form layout="vertical">
              <Row gutter={[16, 0]}>
                <Col xs={24} md={12}>
                  <Form.Item label="Шаблон трубы">
                    <Select
                      options={[
                        ...pipeCatalog.map((pipe) => ({
                          label: pipe.name,
                          value: pipe.id,
                        })),
                        {
                          label: 'Пользовательский ввод',
                          value: 'custom',
                        },
                      ]}
                      value={selectedPipeValue}
                      onChange={onApplyPipeTemplate}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="diameterMm"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        help={fieldState.error?.message}
                        label="Диаметр, мм"
                        validateStatus={fieldState.error ? 'error' : ''}
                      >
                        <InputNumber
                          min={1}
                          precision={0}
                          style={{ width: '100%' }}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="wallThicknessMm"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        help={fieldState.error?.message}
                        label="Толщина стенки, мм"
                        validateStatus={fieldState.error ? 'error' : ''}
                      >
                        <InputNumber
                          min={1}
                          precision={0}
                          style={{ width: '100%' }}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="lengthM"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        help={fieldState.error?.message}
                        label="Длина трубы, м"
                        validateStatus={fieldState.error ? 'error' : ''}
                      >
                        <InputNumber
                          min={0.1}
                          precision={3}
                          style={{ width: '100%' }}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="unitWeightT"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        help={fieldState.error?.message}
                        label="Масса одной трубы, т"
                        validateStatus={fieldState.error ? 'error' : ''}
                      >
                        <InputNumber
                          min={0.001}
                          precision={3}
                          style={{ width: '100%' }}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col xs={24} md={12}>
                  <Controller
                    control={control}
                    name="quantity"
                    render={({ field, fieldState }) => (
                      <Form.Item
                        help={fieldState.error?.message}
                        label="Количество труб"
                        validateStatus={fieldState.error ? 'error' : ''}
                      >
                        <InputNumber
                          min={1}
                          precision={0}
                          style={{ width: '100%' }}
                          value={field.value}
                          onChange={(value) => field.onChange(value ?? 0)}
                        />
                      </Form.Item>
                    )}
                  />
                </Col>

                <Col span={24}>
                  <Controller
                    control={control}
                    name="priorityMode"
                    render={({ field }) => (
                      <Form.Item label="Приоритетный вид транспорта">
                        <Segmented
                          block
                          options={[
                            { label: 'ЖД транспорт', value: 'rail' },
                            { label: 'Автотранспорт', value: 'truck' },
                          ]}
                          value={field.value}
                          onChange={(value) =>
                            field.onChange(value as TransportMode)
                          }
                        />
                      </Form.Item>
                    )}
                  />
                </Col>
              </Row>
            </Form>

            <Space wrap>
              <Button type="primary" onClick={onApplyRecommendedWeight}>
                Подставить расчетный вес
              </Button>
              <Tag color="cyan">
                Расчетный вес: {formatNumber(recommendedWeight, 3)} т
              </Tag>
              {selectedPipe ? (
                <Tag color="geekblue">Шаблон: {selectedPipe.name}</Tag>
              ) : (
                <Tag>Пользовательский ввод</Tag>
              )}
            </Space>

            <Card size="small" className="nested-card">
              <Space direction="vertical" size={8}>
                <Typography.Text className="panel-kicker">
                  Логика расчета
                </Typography.Text>
                <Typography.Paragraph className="page-muted">
                  Система сначала ищет справочный норматив загрузки для стандартной
                  еврофуры и вагона. Если точного норматива нет, используется
                  расчет по габаритам и грузоподъемности. Затем выбирается план с
                  минимальным числом единиц транспорта и минимальным резервом по
                  вместимости.
                </Typography.Paragraph>
              </Space>
            </Card>
          </Space>
        </Card>

        <Card bordered={false} className="page-card">
          <Space direction="vertical" size={20} className="full-width">
            <div className="panel-header">
              <div>
                <Typography.Text className="panel-kicker">
                  Результат алгоритма
                </Typography.Text>
                <Typography.Title level={2}>Оптимальный план</Typography.Title>
              </div>
              <Tag color="blue">Требуется: {formatNumber(order.quantity)} труб</Tag>
            </div>

            {planning.errors.length > 0 ? (
              <Alert
                showIcon
                type="error"
                message="Расчет не завершен"
                description={
                  <ul className="alert-list">
                    {planning.errors.map((error) => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                }
              />
            ) : null}

            {planning.recommendedPlan ? (
              <Card className="nested-card" size="small">
                <Space direction="vertical" size={16} className="full-width">
                  <div className="panel-header">
                    <div>
                      <Typography.Text className="panel-kicker">
                        Основная рекомендация
                      </Typography.Text>
                      <Typography.Title level={3}>
                        {formatMode(planning.recommendedPlan.mode)}
                      </Typography.Title>
                    </div>
                    <Tag color="success">
                      {planning.recommendedPlan.totalUnits} ед.
                    </Tag>
                  </div>

                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Единиц транспорта"
                        value={planning.recommendedPlan.totalUnits}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Совокупная вместимость"
                        value={planning.recommendedPlan.totalCapacity}
                      />
                    </Col>
                    <Col xs={24} sm={8}>
                      <Statistic
                        title="Излишек мест"
                        value={planning.recommendedPlan.overfill}
                      />
                    </Col>
                  </Row>

                  <Descriptions
                    bordered
                    column={1}
                    items={planning.recommendedPlan.allocations.map((allocation) => ({
                      key: allocation.transportId,
                      label: allocation.transportName,
                      children: (
                        <Space direction="vertical" size={2}>
                          <Typography.Text>
                            {allocation.count} ед. x {allocation.unitCapacity} труб
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            Ограничение:{' '}
                            {formatLimitingFactor(allocation.limitingFactor)}
                          </Typography.Text>
                        </Space>
                      ),
                    }))}
                  />
                </Space>
              </Card>
            ) : null}

            <Divider style={{ margin: 0 }} />

            <Space direction="vertical" size={12} className="full-width">
              <Typography.Title level={4}>Альтернативы</Typography.Title>
              <div className="alternative-grid">
                {planning.alternatives.map((plan) => (
                  <Card
                    key={plan.mode}
                    className={
                      planning.recommendedPlan?.mode === plan.mode
                        ? 'nested-card nested-card--selected'
                        : 'nested-card'
                    }
                    size="small"
                  >
                    <Space direction="vertical" size={10} className="full-width">
                      <div className="panel-header">
                        <Typography.Text strong>{formatMode(plan.mode)}</Typography.Text>
                        <Tag>{plan.totalUnits} ед.</Tag>
                      </div>
                      <Typography.Text type="secondary">
                        Вместимость {plan.totalCapacity} труб, резерв {plan.overfill}{' '}
                        труб.
                      </Typography.Text>
                      <Space wrap>
                        {plan.allocations.map((allocation) => (
                          <Tag key={allocation.transportId}>
                            {allocation.transportName}: {allocation.count}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Card>
                ))}
              </div>
            </Space>

            <Divider style={{ margin: 0 }} />

            <Space direction="vertical" size={12} className="full-width">
              <Typography.Title level={4}>Оценка транспорта</Typography.Title>
              <Table
                columns={assessmentColumns}
                dataSource={planning.assessments}
                pagination={false}
                rowKey={(item) => item.transport.id}
                scroll={{ x: 760 }}
                size="small"
              />
            </Space>
          </Space>
        </Card>
      </div>
    </section>
  )
}
