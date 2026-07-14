# 🚀 Деплой на Vercel — подробная инструкция

Эта инструкция проведёт вас от нуля до публичной ссылки `https://your-app.vercel.app` за ~15 минут.

---

## 📋 Что нужно

1. **GitHub-аккаунт** (бесплатно) — https://github.com/signup
2. **Vercel-аккаунт** (бесплатно) — https://vercel.com/signup
3. **Этот проект** (ZIP-архив или клонированный репозиторий)

> 💡 **GitHub обязателен** для удобного деплоя на Vercel. Это "облако для кода" — Vercel берёт ваш код оттуда и публикует. Каждый раз когда вы меняете код на GitHub, Vercel автоматически переопубликовывает приложение.

---

## 📌 ЧАСТЬ 1: Создать GitHub-аккаунт

### Шаг 1.1. Регистрация
1. Откройте https://github.com/signup
2. Введите:
   - **Email** — ваш email
   - **Password** — пароль
   - **Username** — английскими буквами, например `ivan-fart` или `your-name`
3. Решите капчу
4. Подтвердите email (придёт письмо с кодом)

### Шаг 1.2. Выберите план
- Выберите **Free** (бесплатный) — этого достаточно

### Шаг 1.3. Создайте новый репозиторий
1. После входа нажмите **`+`** в правом верхнем углу → **New repository**
2. Заполните:
   - **Repository name**: `fart-counter`
   - **Description**: `💨 Fart Counter PWA — offline tracker`
   - **Visibility**: ✅ **Public** (чтобы Vercel бесплатно деплоил)
   - **Add a README file**: ✅ галочку поставьте
3. Нажмите **Create repository**

🎉 Вы создали репозиторий! URL будет: `https://github.com/ВАШ-USERNAME/fart-counter`

---

## 📌 ЧАСТЬ 2: Загрузить код в GitHub

Есть 2 способа — выберите удобный.

### 🅰️ Способ A: Через веб-интерфейс GitHub (ПРОЩЕ, без установки)

1. **Скачайте ZIP-архив** проекта с песочницы (я его уже собрал — `fart-counter.zip` в папке `download/`)
2. **Распакуйте** ZIP у себя на компьютере
3. На вашем GitHub-репозитории нажмите **`Add file`** → **`Upload files`**
4. **Перетащите все файлы** из распакованной папки в окно GitHub
   - ⚠️ **ВАЖНО:** не загружайте папку `node_modules` — она не нужна (Vercel установит сам)
   - Не загружайте `.next/`, `dev.log`, `*.db`
5. Внизу в **Commit changes**:
   - **Commit message**: `Initial commit — Fart Counter PWA v2.0`
   - Нажмите **Commit changes**
6. Дождитесь загрузки (1-2 минуты)

### 🅱️ Способ B: Через Git CLI (если умеете терминал)

```bash
# Установите Git: https://git-scm.com/downloads

# Распакуйте ZIP в папку fart-counter
cd fart-counter

# Инициализируйте git
git init
git add .
git commit -m "Initial commit — Fart Counter PWA v2.0"

# Привяжите к GitHub (замените ВАШ-USERNAME)
git branch -M main
git remote add origin https://github.com/ВАШ-USERNAME/fart-counter.git
git push -u origin main
```

---

## 📌 ЧАСТЬ 3: Создать Vercel-аккаунт и задеплоить

### Шаг 3.1. Регистрация на Vercel
1. Откройте https://vercel.com/signup
2. Нажмите **Continue with GitHub** (вход через GitHub — самый простой)
3. Авторизуйте Vercel (разрешите доступ к вашему GitHub)
4. Заполните профиль:
   - **Name**: ваше имя
   - **Team name**: можно оставить по умолчанию (ваш username)

### Шаг 3.2. Импорт репозитория
1. На дашборде Vercel нажмите **`Add New...`** → **`Project`**
2. В разделе **Import Git Repository** найдите ваш репозиторий `fart-counter`
3. Нажмите **Import**

### Шаг 3.3. Настройка проекта
Vercel автоматически определит Next.js. Проверьте настройки:

| Поле | Значение |
|------|----------|
| **Framework Preset** | Next.js (авто) |
| **Build Command** | `next build` (авто) |
| **Output Directory** | `.next` (авто) |
| **Install Command** | `bun install` (или `npm install`) |

> ⚠️ **Если Vercel ругается на bun**: поменяйте Install Command на `npm install`

4. Нажмите **Deploy**

### Шаг 3.4. Ждите сборки (~2-3 минуты)
- Vercel покажет лог сборки
- Когда увидите **"Congratulations!"** — готово! 🎉
- Ваша ссылка: `https://fart-counter-ВАШ-USERNAME.vercel.app` (или похожая)

---

## 📌 ЧАСТЬ 4: Подключить свой домен (опционально)

Если хотите красивую ссылку типа `fartcounter.app`:

1. Купите домен на [Namecheap](https://www.namecheap.com) (~$10/год) или [Reg.ru](https://www.reg.ru)
2. На Vercel: **Settings** → **Domains** → **Add Domain**
3. Введите ваш домен → **Add**
4. Vercel даст DNS-записи — добавьте их в панель регистратора домена
5. Подождите 5-30 минут — DNS обновится

---

## 📌 ЧАСТЬ 5: Обновления (когда меняете код)

После деплоя обновлять приложение **очень просто**:

### Если используете веб-интерфейс GitHub:
1. На GitHub откройте нужный файл → иконка карандаша ✏️ → измените → **Commit**
2. Vercel **автоматически** увидит изменение и переопубликует за 1-2 минуты

### Если используете Git CLI:
```bash
git add .
git commit -m "Fix: something"
git push
```
Vercel автоматически задеплоит.

---

## ❓ Частые вопросы

### Q: GitHub обязателен?
**A:** Для Vercel — да, но есть альтернатива:
- Можно загрузить ZIP прямо на Vercel через их CLI: `vercel --prod`
- Но это менее удобно, чем через GitHub (нет авто-обновлений)

### Q: Это правда бесплатно?
**A:** Да, на Free плане:
- **Vercel**: 100 ГБ трафика/месяц, безлимитные деплои
- **GitHub**: безлимит публичных репозиториев

### Q: А из России работает?
**A:** Да, Vercel и GitHub доступны из РФ. Оплата не нужна (Free план).

### Q: Что если не работает на телефоне?
**A:** PWA устанавливается так:
- **Android (Chrome)**: откройте ссылку → меню (⋮) → "Добавить на главный экран"
- **iPhone (Safari)**: откройте ссылку → Поделиться → "На экран Домой"

### Q: Как удалить проект?
**A:** Vercel → Settings → Advanced → Delete Project. На GitHub: Settings → Delete this repository.

---

## 🆘 Если что-то не получается

### Ошибки сборки на Vercel
1. Зайдите в **Deployments** → последний деплой → **Logs**
2. Найдите красную ошибку
3. Частые причины:
   - `Module not found` — забыл загрузить какой-то файл на GitHub
   - `Type error` — проблема в TypeScript коде (можно временно отключить через `typescript: { ignoreBuildErrors: true }` в next.config.ts — уже включено)

### Приложение не открывается
1. Проверьте URL: `https://[имя-проекта].vercel.app`
2. Если 404 — проект не задеплоился, смотрите логи
3. Если белый экран — откройте DevTools (F12) → Console, смотрите ошибки

### Нужна помощь?
- Vercel docs: https://vercel.com/docs
- GitHub docs: https://docs.github.com
- Next.js docs: https://nextjs.org/docs

---

## ✅ Чек-лист готовности

- [ ] GitHub-аккаунт создан
- [ ] Репозиторий `fart-counter` создан (Public)
- [ ] Код загружен в репозиторий (БЕЗ node_modules)
- [ ] Vercel-аккаунт создан (через GitHub)
- [ ] Проект импортирован на Vercel
- [ ] Деплой завершён успешно
- [ ] Приложение открывается по ссылке `*.vercel.app`
- [ ] Тест на телефоне: открыть ссылку → "Добавить на главный экран"

**После прохождения чек-листа у вас будет постоянная публичная ссылка на приложение!** 🎉
