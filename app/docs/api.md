# Team Notes API

Базова адреса: `/api`. Формат: JSON, UTF-8.
Автентифікація: cookie `session` (HttpOnly), яку ставлять `/api/auth/register` і `/api/auth/login`.
Без неї будь-який ендпоінт нотаток відповідає `401`.

## Ресурс Note

```json
{
  "id": "uuid",
  "authorId": "uuid",
  "title": "string, 1–120",
  "body": "string, до 10 000",
  "status": "draft | published | archived",
  "tags": ["string, до 30 символів, нижній регістр; до 10 тегів"],
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601"
}
```

## Ендпоінти

| Метод і шлях | Що робить | Успіх | Помилки |
|---|---|---|---|
| `GET /api/notes?tag=&page=&limit=` | мої нотатки, найновіші першими | `200` `{ items, page, limit, total }` | `400` невалідні параметри |
| `POST /api/notes` | створити | `201` + `Location` | `415`, `400`, `422` |
| `GET /api/notes/{id}` | одна нотатка (моя або опублікована) | `200` | TODO |
| `PATCH /api/notes/{id}` | TODO | TODO | TODO |
| `DELETE /api/notes/{id}` | TODO | TODO | TODO |

## Пагінація

TODO: які параметри, значення за замовчуванням, максимальний `limit`.

## Формат помилки

```json
{ "status": 422, "message": "Validation failed", "issues": [{ "path": "title", "message": "Title is required" }] }
```

Чужа нотатка відповідає `404`, а не `403`: API не розкриває, що вона існує.

## Сумісність

- Нові поля у відповідях можуть з'являтися без попередження — клієнт має ігнорувати невідомі поля.
- Видалення або перейменування поля — лише в новій версії API.
