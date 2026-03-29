import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Statistic,
  Typography,
  message,
} from 'antd'
import { useEffect } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { capacityOverrideRules } from '../mockData'
import { makeZodResolver } from '../formResolvers'
import {
  pipeCatalogFormSchema,
  transportCatalogFormSchema,
} from '../schemas'
import type { PipeReference, TransportMode, TransportReference } from '../types'

interface DirectoryPageProps {
  pipeCatalog: PipeReference[]
  transportCatalog: TransportReference[]
  adminLocked: boolean
  createPipeDraft: () => PipeReference
  createTransportDraft: (mode: TransportMode) => TransportReference
  onSavePipeCatalog: (catalog: PipeReference[]) => void
  onSaveTransportCatalog: (catalog: TransportReference[]) => void
}

export function DirectoryPage({
  pipeCatalog,
  transportCatalog,
  adminLocked,
  createPipeDraft,
  createTransportDraft,
  onSavePipeCatalog,
  onSaveTransportCatalog,
}: DirectoryPageProps) {
  const [messageApi, messageContext] = message.useMessage()

  const pipeForm = useForm<{ pipes: PipeReference[] }>({
    defaultValues: { pipes: pipeCatalog },
    mode: 'onChange',
    resolver: makeZodResolver(pipeCatalogFormSchema),
  })
  const transportForm = useForm<{ transports: TransportReference[] }>({
    defaultValues: { transports: transportCatalog },
    mode: 'onChange',
    resolver: makeZodResolver(transportCatalogFormSchema),
  })

  const pipeFields = useFieldArray({
    control: pipeForm.control,
    name: 'pipes',
    keyName: 'fieldKey',
  })
  const transportFields = useFieldArray({
    control: transportForm.control,
    name: 'transports',
    keyName: 'fieldKey',
  })

  useEffect(() => {
    pipeForm.reset({ pipes: pipeCatalog })
  }, [pipeCatalog, pipeForm])

  useEffect(() => {
    transportForm.reset({ transports: transportCatalog })
  }, [transportCatalog, transportForm])

  function savePipes(values: { pipes: PipeReference[] }) {
    onSavePipeCatalog(values.pipes)
    messageApi.success('Справочник труб сохранен')
  }

  function saveTransports(values: { transports: TransportReference[] }) {
    onSaveTransportCatalog(values.transports)
    messageApi.success('Справочник транспорта сохранен')
  }

  return (
    <section className="page-stack">
      {messageContext}

      <Card bordered={false} className="page-card">
        <Space direction="vertical" size={4}>
          <Typography.Text className="panel-kicker">
            Подсистема редактирования
          </Typography.Text>
          <Typography.Title level={2}>Справочники</Typography.Title>
          <Typography.Paragraph className="page-muted">
            Система хранит шаблоны труб и параметры транспорта, используемые при
            расчёте отгрузки и демонстрации тестовых сценариев.
          </Typography.Paragraph>
        </Space>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card bordered={false} className="page-card stat-card">
            <Statistic title="Шаблоны труб" value={pipeCatalog.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="page-card stat-card">
            <Statistic title="Единиц транспорта" value={transportCatalog.length} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} className="page-card stat-card">
            <Statistic title="Нормативные кейсы" value={capacityOverrideRules.length} />
          </Card>
        </Col>
      </Row>

      {adminLocked ? (
        <>
          <Alert
            showIcon
            type="warning"
            message="Редактирование заблокировано"
            description="Просмотр справочников доступен, но изменение и сохранение записей разрешено только администратору."
          />

          <div className="directory-grid">
            <Card bordered={false} className="page-card">
              <Space direction="vertical" size={16} className="full-width">
                <div className="panel-header">
                  <div>
                    <Typography.Text className="panel-kicker">
                      Справочник труб
                    </Typography.Text>
                    <Typography.Title level={3}>Параметры сортамента</Typography.Title>
                  </div>
                </div>

                {pipeCatalog.map((pipe) => (
                  <Card
                    key={pipe.id}
                    className="nested-card"
                    size="small"
                    title={pipe.name}
                  >
                    <Descriptions
                      bordered
                      column={1}
                      items={[
                        {
                          key: 'diameterMm',
                          label: 'Диаметр',
                          children: `${pipe.diameterMm} мм`,
                        },
                        {
                          key: 'wallThicknessMm',
                          label: 'Толщина стенки',
                          children: `${pipe.wallThicknessMm} мм`,
                        },
                        {
                          key: 'lengthM',
                          label: 'Длина',
                          children: `${pipe.lengthM} м`,
                        },
                        {
                          key: 'unitWeightT',
                          label: 'Масса',
                          children: `${pipe.unitWeightT} т`,
                        },
                      ]}
                    />
                  </Card>
                ))}
              </Space>
            </Card>

            <Card bordered={false} className="page-card">
              <Space direction="vertical" size={16} className="full-width">
                <div className="panel-header">
                  <div>
                    <Typography.Text className="panel-kicker">
                      Справочник транспорта
                    </Typography.Text>
                    <Typography.Title level={3}>
                      Параметры кузова и вагона
                    </Typography.Title>
                  </div>
                </div>

                {transportCatalog.map((transport) => (
                  <Card
                    key={transport.id}
                    className="nested-card"
                    size="small"
                    title={transport.name}
                  >
                    <Descriptions
                      bordered
                      column={1}
                      items={[
                        {
                          key: 'mode',
                          label: 'Тип',
                          children:
                            transport.mode === 'rail'
                              ? 'ЖД транспорт'
                              : 'Автотранспорт',
                        },
                        {
                          key: 'payloadT',
                          label: 'Грузоподъемность',
                          children: `${transport.payloadT} т`,
                        },
                        {
                          key: 'innerWidthM',
                          label: 'Ширина',
                          children: `${transport.innerWidthM} м`,
                        },
                        {
                          key: 'innerHeightM',
                          label: 'Высота',
                          children: `${transport.innerHeightM} м`,
                        },
                        {
                          key: 'innerLengthM',
                          label: 'Длина',
                          children: `${transport.innerLengthM} м`,
                        },
                        {
                          key: 'notes',
                          label: 'Примечание',
                          children: transport.notes || 'Без примечания',
                        },
                      ]}
                    />
                  </Card>
                ))}
              </Space>
            </Card>
          </div>
        </>
      ) : (
        <div className="directory-grid">
          <Card bordered={false} className="page-card">
            <Space direction="vertical" size={20} className="full-width">
              <div className="panel-header">
                <div>
                  <Typography.Text className="panel-kicker">
                    Справочник труб
                  </Typography.Text>
                  <Typography.Title level={3}>Параметры сортамента</Typography.Title>
                </div>
                <Space wrap>
                  <Button onClick={() => pipeFields.append(createPipeDraft())}>
                    Добавить трубу
                  </Button>
                  <Button onClick={() => pipeForm.reset({ pipes: pipeCatalog })}>
                    Сбросить
                  </Button>
                  <Button type="primary" onClick={pipeForm.handleSubmit(savePipes)}>
                    Сохранить
                  </Button>
                </Space>
              </div>

              <Form layout="vertical">
                <Space direction="vertical" size={16} className="full-width">
                  {pipeFields.fields.map((field, index) => (
                    <Card
                      key={field.fieldKey}
                      className="nested-card"
                      size="small"
                      title={`Труба ${index + 1}`}
                      extra={
                        <Button
                          danger
                          type="link"
                          onClick={() => pipeFields.remove(index)}
                        >
                          Удалить
                        </Button>
                      }
                    >
                      <Row gutter={[16, 0]}>
                        <Col span={24}>
                          <Controller
                            control={pipeForm.control}
                            name={`pipes.${index}.name`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Название"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <Input
                                  value={controllerField.value}
                                  onChange={controllerField.onChange}
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={12}>
                          <Controller
                            control={pipeForm.control}
                            name={`pipes.${index}.diameterMm`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Диаметр, мм"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={1}
                                  precision={0}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={12}>
                          <Controller
                            control={pipeForm.control}
                            name={`pipes.${index}.wallThicknessMm`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Толщина стенки, мм"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={1}
                                  precision={0}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={12}>
                          <Controller
                            control={pipeForm.control}
                            name={`pipes.${index}.lengthM`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Длина, м"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={0.1}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={12}>
                          <Controller
                            control={pipeForm.control}
                            name={`pipes.${index}.unitWeightT`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Масса, т"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={0.001}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </Form>
            </Space>
          </Card>

          <Card bordered={false} className="page-card">
            <Space direction="vertical" size={20} className="full-width">
              <div className="panel-header">
                <div>
                  <Typography.Text className="panel-kicker">
                    Справочник транспорта
                  </Typography.Text>
                  <Typography.Title level={3}>
                    Параметры кузова и вагона
                  </Typography.Title>
                </div>
                <Space wrap>
                  <Button onClick={() => transportFields.append(createTransportDraft('rail'))}>
                    Добавить ЖД
                  </Button>
                  <Button
                    onClick={() =>
                      transportFields.append(createTransportDraft('truck'))
                    }
                  >
                    Добавить авто
                  </Button>
                  <Button
                    onClick={() =>
                      transportForm.reset({ transports: transportCatalog })
                    }
                  >
                    Сбросить
                  </Button>
                  <Button
                    type="primary"
                    onClick={transportForm.handleSubmit(saveTransports)}
                  >
                    Сохранить
                  </Button>
                </Space>
              </div>

              <Form layout="vertical">
                <Space direction="vertical" size={16} className="full-width">
                  {transportFields.fields.map((field, index) => (
                    <Card
                      key={field.fieldKey}
                      className="nested-card"
                      size="small"
                      title={`Транспорт ${index + 1}`}
                      extra={
                        <Button
                          danger
                          type="link"
                          onClick={() => transportFields.remove(index)}
                        >
                          Удалить
                        </Button>
                      }
                    >
                      <Row gutter={[16, 0]}>
                        <Col span={24}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.name`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Название"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <Input
                                  value={controllerField.value}
                                  onChange={controllerField.onChange}
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={12}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.mode`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Тип транспорта"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <Select
                                  options={[
                                    { label: 'ЖД', value: 'rail' },
                                    { label: 'Авто', value: 'truck' },
                                  ]}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value as TransportMode)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={12}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.payloadT`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Грузоподъемность, т"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={1}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={8}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.innerWidthM`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Ширина, м"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={0.1}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={8}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.innerHeightM`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Высота, м"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={0.1}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col xs={24} md={8}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.innerLengthM`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Длина, м"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <InputNumber
                                  min={0.1}
                                  precision={3}
                                  style={{ width: '100%' }}
                                  value={controllerField.value}
                                  onChange={(value) =>
                                    controllerField.onChange(value ?? 0)
                                  }
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>

                        <Col span={24}>
                          <Controller
                            control={transportForm.control}
                            name={`transports.${index}.notes`}
                            render={({ field: controllerField, fieldState }) => (
                              <Form.Item
                                help={fieldState.error?.message}
                                label="Примечание"
                                validateStatus={fieldState.error ? 'error' : ''}
                              >
                                <Input
                                  value={controllerField.value}
                                  onChange={controllerField.onChange}
                                />
                              </Form.Item>
                            )}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </Form>
            </Space>
          </Card>
        </div>
      )}
    </section>
  )
}
