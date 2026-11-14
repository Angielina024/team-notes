# User stories

## 1. Створення нотатки
As a team member, I want to create a note with a title, text and tags,
so that my ideas are saved in one place.

- Given я увійшов, When я заповнюю заголовок і натискаю «Зберегти», Then відкривається сторінка нової нотатки.
- Given я лишив заголовок порожнім, When я натискаю «Зберегти», Then бачу «Вкажи заголовок», а введений текст не зник.

## 2. Фільтр за тегом
As a team member, I want to filter notes by tag, so that I quickly find everything about one project.

- Given у мене 3 нотатки з тегом «робота» і 2 з «дім», When я натискаю «#робота», Then бачу лише 3 нотатки.
- Given фільтр увімкнено, When я натискаю «скинути», Then бачу всі нотатки.

## 3. Видалення нотатки
As an author, I want to delete my note, so that outdated information does not confuse the team.

- Given я автор нотатки, When я натискаю «Видалити», Then нотатка зникає зі списку.
- Given нотатка належить іншому, When я надсилаю запит на її видалення, Then отримую 404 і нотатка лишається.