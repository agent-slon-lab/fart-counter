# 📦 Инструкция: Загрузка проекта на GitHub

Полное пошаговое руководство — от создания аккаунта до публикации кода.

---

## 📋 ЧАСТЬ 1: Создать GitHub-аккаунт

### Шаг 1. Регистрация
1. Откройте https://github.com/signup
2. Заполните поля:
   - **Email** — ваш email
   - **Password** — пароль (минимум 15 символов ИЛИ 8 с цифрой и буквой)
   - **Username** — английскими буквами, например `ivan-petrov`
3. Нажмите **Create account**
4. Придёт письмо с кодом на email — введите его
5. Выберите **Free** план (бесплатный, достаточно для всего)
6. Пройдите опрос (можно пропустить, нажимая Skip)

🎉 Готово, у вас есть GitHub-аккаунт!

---

## 📋 ЧАСТЬ 2: Создать репозиторий

### Шаг 1. Создание
1. После входа откройте https://github.com/new
2. Заполните:
   - **Repository name**: `fart-counter` (строго английскими буквами, через дефис)
   - **Description** (опц.): `💨 Fart Counter PWA — offline tracker`
   - **Visibility**: ☑️ **Public** (обязательно Public для бесплатного Vercel)
   - ☑️ **Add a README file** — поставьте галочку
3. Нажмите зелёную кнопку **Create repository**

🎉 Репозиторий создан! URL: `https://github.com/ВАШ-USERNAME/fart-counter`

---

## 📋 ЧАСТЬ 3: Скачать ZIP с песочницы

### Шаг 1. Скачать архив
В интерфейсе песочницы (слева от превью):
1. Найдите папку **`download`**
2. Скачайте файл **`fart-counter.zip`** (~450 KB)

### Шаг 2. Распаковать
Распакуйте ZIP в любую папку на компьютере, например:
- **Windows**: `C:\Users\ВЫ\fart-counter\`
- **macOS**: `/Users/ВЫ/fart-counter/`
- **Linux**: `/home/ВЫ/fart-counter/`

После распаковки внутри должны быть файлы:
```
fart-counter/
├── package.json
├── vercel.json
├── next.config.ts
├── README.md
├── DEPLOY.md
├── GITHUB.md ← этот файл
├── CHANGELOG.md
├── .gitignore
├── .env.example
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── version.json
│   ├── icon-192.png
│   ├── icon-512.png
│   └── ...
└── src/
    ├── app/
    ├── components/
    ├── lib/
    └── hooks/
```

---

## 📋 ЧАСТЬ 4: Загрузить файлы на GitHub

Есть 2 способа. Выберите удобный.

---

### 🅰️ Способ A: Через веб-интерфейс GitHub (ПРОЩЕ, без установки)

#### Шаг 1. Открыть страницу загрузки
1. Откройте ваш репозиторий: `https://github.com/ВАШ-USERNAME/fart-counter`
2. Нажмите на синюю ссылку **`uploading an existing file`** (в центре экрана)
   - ИЛИ нажмите кнопку **`Add file`** → **`Upload files`**

#### Шаг 2. Перетащить файлы
1. Откроется страница **"Add file"**
2. Откройте папку с распакованным проектом у себя на компьютере
3. **Выделите все файлы и папки** внутри `fart-counter/` (Ctrl+A / Cmd+A)
4. **Перетащите** их в окно GitHub (где написано "drag files here")
5. Дождитесь загрузки (1-3 минуты)

#### ⚠️ ВАЖНО: Не загружайте эти файлы!
Если они есть — **удалите из загрузки**:
- ❌ `node_modules/` (папка) — Vercel установит сам
- ❌ `.next/` (папка) — временная сборка
- ❌ `dev.log`, `server.log` — логи
- ❌ `*.db`, `*.db-journal` — файлы базы данных
- ❌ `download/` (папка) — сам ZIP лежит тут, не нужен
- ❌ `tool-results/`, `agent-browser*` — мусор песочницы
- ❌ `skills/`, `examples/`, `mini-services/` — не нужны в проде

**Что нужно загрузить (ОБЯЗАТЕЛЬНО):**
- ✅ `package.json`
- ✅ `vercel.json`
- ✅ `next.config.ts`
- ✅ `tsconfig.json`
- ✅ `tailwind.config.ts`
- ✅ `postcss.config.mjs`
- ✅ `components.json`
- ✅ `eslint.config.mjs`
- ✅ `README.md`, `DEPLOY.md`, `GITHUB.md`, `CHANGELOG.md`
- ✅ `.gitignore`
- ✅ `.env.example`
- ✅ вся папка `public/`
- ✅ вся папка `src/`
- ✅ `bun.lock` (если есть)

#### Шаг 3. Зафиксировать изменения
1. Прокрутите вниз до **"Commit changes"**
2. В поле **Commit message** напишите:
   ```
   Initial commit — Fart Counter v1.0.0
   ```
3. В поле **Description** (опц.) можно добавить:
   ```
   First release of the Fart Counter PWA.
   7 languages, 23 achievements, 14 sounds, 100 facts.
   ```
4. Выберите ☑️ **Commit directly to the `main` branch**
5. Нажмите зелёную кнопку **Commit changes**

🎉 Файлы загружены на GitHub!

---

### 🅱️ Способ B: Через Git CLI (если умеете терминал)

#### Шаг 1. Установить Git
- **Windows**: скачать с https://git-scm.com/downloads и установить
- **macOS**: `brew install git` или установить Xcode Command Line Tools
- **Linux**: `sudo apt install git`

#### Шаг 2. Настроить Git (один раз)
```bash
git config --global user.name "Ваше Имя"
git config --global user.email "ваш@email.com"
```

#### Шаг 3. Перейти в папку проекта
```bash
cd /путь/к/fart-counter
```

#### Шаг 4. Инициализировать и залить
```bash
# Инициализировать git
git init

# Добавить все файлы (кроме тех что в .gitignore)
git add .

# Зафиксировать
git commit -m "Initial commit — Fart Counter v1.0.0"

# Привязать к GitHub (замените ВАШ-USERNAME)
git branch -M main
git remote add origin https://github.com/ВАШ-USERNAME/fart-counter.git

# Залить
git push -u origin main
```

Если попросит логин — используйте **GitHub Personal Access Token**:
1. Откройте https://github.com/settings/tokens
2. **Generate new token (classic)** → выберите scope `repo`
3. Скопируйте токен
4. При `git push` введите логин и пароль = токен

---

## 📋 ЧАСТЬ 5: Проверить, что всё загрузилось

Откройте ваш репозиторий: `https://github.com/ВАШ-USERNAME/fart-counter`

Должны видеть:
- ✅ Список файлов: `package.json`, `vercel.json`, `src/`, `public/` и т.д.
- ✅ `README.md` отображается внизу страницы (с описанием)
- ✅ Никаких `node_modules/`, `.next/` в списке

### Какая структура должна быть на GitHub:

```
fart-counter/
├── .env.example
├── .gitignore
├── CHANGELOG.md
├── DEPLOY.md
├── GITHUB.md
├── README.md ← отображается на главной странице репозитория
├── bun.lock
├── components.json
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── vercel.json
├── public/
│   ├── apple-touch-icon.png
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon.svg
│   ├── manifest.json
│   ├── robots.txt
│   ├── sw.js
│   └── version.json
└── src/
    ├── app/
    │   ├── api/
    │   ├── landing/
    │   ├── globals.css
    │   ├── layout.tsx
    │   └── page.tsx
    ├── components/
    │   ├── app/
    │   ├── pwa/
    │   └── ui/
    ├── hooks/
    └── lib/
        ├── achievements.ts
        ├── db.ts
        ├── export.ts
        ├── facts.ts
        ├── facts-*.json
        ├── haptics.ts
        ├── i18n.ts
        ├── i18n-extra.json
        ├── notifications.ts
        ├── qr.ts
        ├── sounds.ts
        ├── store.ts
        ├── utils.ts
        └── version.ts
```

---

## 📋 ЧАСТЬ 6: Создать первый Release (опционально, но рекомендуется)

Releases — это официальные версии вашего приложения с тегами.

### Шаг 1. Создать release
1. В репозитории нажмите **`Releases`** (справа от количества файлов)
2. Нажмите **`Create a new release`**
3. Заполните:
   - **Choose a tag**: введите `v1.0.0` → нажмите **Create new tag: v1.0.0 on publish**
   - **Release title**: `Fart Counter v1.0.0 — First Release 🎉`
   - **Description**: скопируйте содержимое `CHANGELOG.md` для версии 1.0.0
4. ☑️ **Set as the latest release**
5. Нажмите **Publish release**

🎉 Release создан! Теперь у вас есть `https://github.com/ВАШ-USERNAME/fart-counter/releases/tag/v1.0.0`

---

## 📋 ЧАСТЬ 7: Как обновлять код потом

### Через веб-интерфейс GitHub:
1. Откройте нужный файл на GitHub
2. Нажмите иконку карандаша ✏️ (в правом верхнем углу файла)
3. Внесите изменения
4. Внизу → **Commit changes** → напишите что изменили → **Commit**

### Через Git CLI:
```bash
cd /путь/к/fart-counter

# Внесли изменения в файлах...

git add .
git commit -m "Fix: что-то исправил"
git push
```

### Когда делаете новый релиз (v1.1.0 и т.д.):
1. Обновите версию в 6 местах (см. конец CHANGELOG.md)
2. Закоммитьте с сообщением `Release v1.1.0`
3. Создайте новый Release на GitHub с тегом `v1.1.0`

---

## ❓ Частые вопросы

### Q: Файл слишком большой для загрузки на GitHub
**A:** GitHub ограничивает файлы 100 MB. Если `bun.lock` или другой файл слишком большой — добавьте его в `.gitignore`. Большие бинарные файлы лучше через Git LFS, но для этого проекта не нужно.

### Q: Я случайно загрузил node_modules
**A:** Удалить через GitHub:
1. Откройте папку `node_modules` на GitHub
2. Удалите каждый файл (через корзину в правом углу файла)
3. Commit с сообщением `Remove node_modules`
4. Добавьте `node_modules/` в `.gitignore` (если ещё не там)

### Q: Хочу сделать репозиторий Private (приватный)
**A:** Можно, но тогда Vercel Free не сможет бесплатно деплоить. Для приватных репозиториев нужен Vercel Pro. Для вашего приложения лучше Public.

### Q: Как удалить коммит
**A:** Через веб-интерфейс нельзя. Через Git CLI:
```bash
git log --oneline  # найти номер коммита
git revert HEAD     # отменить последний
git push
```

### Q: Не могу загрузить — пишет "too many files"
**A:** Загружайте частями по 50-100 файлов. GitHub принимает до 100 файлов за раз через веб.

---

## ✅ Чек-лист

- [ ] Создал GitHub-аккаунт
- [ ] Создал репозиторий `fart-counter` (Public)
- [ ] Скачал `fart-counter.zip` с песочницы
- [ ] Распаковал
- [ ] Загрузил файлы на GitHub (без `node_modules`)
- [ ] Проверил, что `README.md` отображается на главной странице
- [ ] Создал первый Release `v1.0.0`
- [ ] Готов переходить к DEPLOY.md (деплой на Vercel)

---

**После завершения всех шагов ваш код будет на GitHub и готов к публикации на Vercel!** 🎉
