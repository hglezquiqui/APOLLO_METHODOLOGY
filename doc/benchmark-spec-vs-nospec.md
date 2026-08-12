# Reporte de Benchmark: Implementación sin spec vs con spec

## Resumen ejecutivo

Se compararon dos estrategias de notificación de vencimiento de contratos:

- Implementación sin spec: lógica previa (recordatorios por ventana de 24h con días fijos, sin supresión por renovación efectiva).
- Implementación con spec: lógica alineada a la especificación (anual 30 días, mensual 7 días, UTC, supresión por renovación efectiva, catch-up y deduplicación permanente por evento).

Resultado general:

- La implementación con spec fue más rápida en los tres tamaños de muestra.
- La implementación sin spec envió notificaciones a contratos ya renovados (incumplimiento funcional).
- Ambas evitaron duplicados en la segunda corrida del mismo día dentro del escenario simulado.

## Alcance y método

- Script ejecutado: scripts/benchmark-spec-vs-nospec.cjs
- Entorno: ejecución local Node.js
- Tamaños evaluados: 1,000; 10,000; 100,000 contratos simulados
- Métricas:
  - Tiempo de ejecución por corrida (ms)
  - Total de notificaciones emitidas
  - Duplicados en segunda corrida del mismo día
  - Envíos a contratos renovados

## Resultados

| Tamaño dataset | Implementación | Run 1 (ms) | Run 2 mismo día (ms) | Notificaciones Run 1 | Duplicados mismo día | Envíos a renovados |
|---|---:|---:|---:|---:|---:|---:|
| 1,000 | sin spec | 10.51 | 7.22 | 600 | 0 | 150 |
| 1,000 | con spec | 2.70 | 1.86 | 650 | 0 | 0 |
| 10,000 | sin spec | 56.69 | 44.76 | 6000 | 0 | 1500 |
| 10,000 | con spec | 22.52 | 15.24 | 6500 | 0 | 0 |
| 100,000 | sin spec | 455.88 | 421.96 | 60000 | 0 | 15000 |
| 100,000 | con spec | 180.21 | 180.60 | 65000 | 0 | 0 |

## Hallazgos

1. Rendimiento
- Con spec mostró menor latencia en todos los tamaños.
- La brecha crece con el volumen (100k: 455.88 ms vs 180.21 ms en Run 1).

2. Correctitud funcional
- Sin spec notificó contratos con renovación efectiva (150, 1500, 15000 respectivamente).
- Con spec evitó por completo esos envíos (0 en todos los casos).

3. Idempotencia mismo día
- Ambas implementaciones no reemitieron notificaciones en la segunda corrida del mismo día en este escenario.

4. Volumen de notificaciones
- Con spec emitió más notificaciones en la primera corrida debido a la política de catch-up definida en la especificación.

## Interpretación

- La implementación con spec no solo cumple reglas de negocio críticas (especialmente supresión por renovación), también escala mejor en tiempo de proceso bajo esta simulación.
- La implementación sin spec presenta riesgo operativo por falsos positivos de notificación a contratos renovados.

## Limitaciones

- Este benchmark usa simulación sintética de datos y lógica comparativa, no replay completo de tráfico productivo.
- Los resultados de tiempo pueden variar según hardware, versión de Node.js y carga de sistema.

## Recomendaciones

1. Mantener la implementación con spec como baseline.
2. Incluir este benchmark en validaciones de regresión para cambios futuros en reglas de recordatorio.
3. Complementar con benchmark contra commits reales (antes/después) para trazabilidad de release.

## Evidencia de ejecución

Comando ejecutado:

node .\\scripts\\benchmark-spec-vs-nospec.cjs
