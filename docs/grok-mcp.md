# Grok через MCP — подключение и тест (этап 8, docs/lead-flow.md)

Сервер: Supabase Edge Function `grok-mcp` (`supabase/functions/grok-mcp/index.ts`). Протокол — MCP, транспорт Streamable HTTP, без сессий (`supabase/functions/_shared/mcp.ts`, тесты `supabase/tests/mcp.test.ts`). Официальный Supabase MCP **не используем** — у него доступ ко всему проекту.

## Что умеет сервер
| Инструмент | Что делает |
|---|---|
| `ping` | проверка связи: `pong` и время сервера |
| `list_pending_analyses(limit)` | до 10 компаний со статусом «ждёт анализа» (старые первыми): правила анализа, данные компании **без e-mail, имени и телефона клиента**, и что автопроверка уже проверила. Компании переходят в «в работе» на 2 часа |
| `save_analysis(id, …)` | анализ **одной** компании: только поля Grok (Befund-строки по непроверенным пунктам, место в Google-поиске, ответы ИИ, каталоги, рекомендации, Belege). Полей Places (отзывы, рейтинг, Maps, техника сайта) нет. Сохраняет, публикует отчёт, клиенту — письмо «Ihre vollständige Analyse ist fertig» |

Защита: ключ `GROK_MCP_KEY` (не короче 24 символов) в адресе `?key=…` или в заголовке `Authorization: Bearer …`. Каждый вызов пишется в таблицу `grok_mcp_log` (видит только команда).

## Подготовка (один раз)
1. Секрет (длинный случайный, например 40 символов):
   `npx supabase secrets set --project-ref bmajnndqvpemerecvjfz GROK_MCP_KEY=<ключ>`
2. Деплой: `npx supabase functions deploy grok-mcp --project-ref bmajnndqvpemerecvjfz` (в `config.toml` уже `verify_jwt = false`).
3. `analysis.sql` выполнить ещё раз (таблица `grok_mcp_log`).
4. Проверка без Grok:
   ```bash
   curl -s -X POST 'https://bmajnndqvpemerecvjfz.supabase.co/functions/v1/grok-mcp?key=<ключ>' \
     -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"ping","arguments":{}}}'
   ```
   Ответ с `"pong": true` — сервер работает. Можно и через MCP Inspector: `npx -y @modelcontextprotocol/inspector` → Streamable HTTP → тот же адрес.

## Тест в Grok (~30 минут)
1. grok.com/connectors → **New Connector** → **Custom** → имя «RAG», адрес:
   `https://bmajnndqvpemerecvjfz.supabase.co/functions/v1/grok-mcp?key=<ключ>`
2. Записать:
   - [ ] подключился ли коннектор и видит ли Grok три инструмента;
   - [ ] какой вход Grok предлагает (ничего / OAuth / поле для токена). Если есть поле для заголовка — лучше ключ туда, а из адреса убрать;
   - [ ] в чате: «Вызови ping в коннекторе RAG» → ответ `pong`;
   - [ ] grok.com/automations: видит ли автоматизация коннектор; минимальный интервал;
   - [ ] пробный запуск на 1–2 компаниях (зарегистрировать тестовую компанию не из таблиц → она в «Analysen» в статусе «Wartet»): сколько компаний проходит за запуск, как выглядит отчёт, пришло ли письмо.
3. Результаты теста — в `docs/lead-flow.md` (раздел «Требует проверки» → «Grok и MCP»).

## Текст автоматизации Grok (2 раза в день, например 9:00 и 15:00)
```
Вызови в коннекторе RAG инструмент list_pending_analyses (limit 5).
Если список пуст — ничего не делай и закончи.
Иначе для КАЖДОЙ компании из списка проверь её строго по правилам из поля «rules» и вызови save_analysis с её id.
Пункты из «Schon automatisch geprüft» не проверяй и не повторяй.
В конце коротко напиши: сколько компаний сохранено, какие не удалось и почему.
```

## Если не получится
- **Grok не подключает коннектор / нет инструментов** → проверить curl из п. 4 и журнал `grok_mcp_log`; если в журнале пусто — Grok до сервера не доходит (адрес, ключ).
- **Автоматизация не видит коннектор** → сотрудник 1–2 раза в день пишет тот же текст в обычный чат Grok с коннектором.
- **MCP вообще не работает** → план B уже есть: админка → «Analysen» → «Aufgabe für die KI erstellen» → ответ вставить обратно.
