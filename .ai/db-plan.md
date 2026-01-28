# Schema bazy danych dla WordRepeater

## 1. Tabele i kolumny

#### Typy wyliczeniowe

- `rating`: ENUM (`again`, `hard`, `good`, `easy`).

#### users

This table is managed by Supabase Auth

- **id**: UUID, Primary Key, domyślnie generowany (np. przy użyciu `uuid_generate_v4()`).
- **email**: CITEXT, not null, unikalny, z ograniczeniem CHECK walidującym format.
- **hashed_password**: TEXT, not null.
- **created_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` (UTC).
- **updated_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` (UTC).
- **deleted_at**: TIMESTAMPTZ, nullable, służy do soft delete.

#### flashcards

- **id**: UUID, Primary Key, domyślnie generowany (`uuid_generate_v4()`).
- **user_id**: UUID, not null, Foreign Key → `users(id)`, ON DELETE CASCADE.
- **content**: TEXT, not null — treść fiszki.
- **metadata**: JSONB, nullable — dodatkowe informacje (np. tagi, kategorie).
- **created_at**: TIMESTAMPTZ, not null, domyślnie `now()` (UTC).
- **updated_at**: TIMESTAMPTZ, not null, domyślnie `now()` (UTC).
- **deleted_at**: TIMESTAMPTZ, nullable, służy do soft delete.

#### audit_logs

- **id**: UUID, Primary Key, domyślnie generowany (np. przy użyciu `uuid_generate_v4()`).
- **user_id**: UUID, nullable, Foreign Key odnoszący się do `users(id)` — wskazuje użytkownika, który wywołał akcję (jeśli dotyczy).
- **action**: TEXT, not null — opis akcji logowanej.
- **occurred_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` — używane do partycjonowania według czasu.

#### review_logs

- **id**: UUID, Primary Key, domyślnie generowany (np. przy użyciu `uuid_generate_v4()`).
- **user_id**: UUID, not null, Foreign Key → `users(id)`, ON DELETE CASCADE.
- **flashcard_id**: UUID, not null, Foreign Key → `flashcards(id)`, ON DELETE CASCADE.
- **rating**: rating enum (`again`, `hard`, `good`, `easy`), not null.
- **reviewed_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()`.

#### flashcard_schedule

- **flashcard_id**: UUID, Primary Key, Foreign Key → `flashcards(id)`, ON DELETE CASCADE.
- **user_id**: UUID, not null, Foreign Key → `users(id)`, ON DELETE CASCADE.
- **next_due**: TIMESTAMPTZ, not null — data i czas kolejnego przeglądu (UTC).
- **interval_days**: INTEGER, not null — bieżący interwał w dniach.
- **repetition_count**: INTEGER, not null, domyślnie 0 — liczba powtórzeń (0 = nowa fiszka).
- **ease_factor**: DOUBLE PRECISION, not null — współczynnik łatwości.

## 2. Relacje między tabelami

- **users** ↔ **review_logs**: 1 do wielu (jeden użytkownik może mieć wiele wpisów przeglądów).
- **flashcards** ↔ **review_logs**: 1 do wielu (jedna fiszka może mieć wiele wpisów przeglądów).

- **users** ↔ **flashcards**: 1 do wielu (jeden użytkownik może posiadać wiele fiszek).
- **flashcards** ↔ **flashcard_schedule**: 1 do 1 (jedna pozycja harmonogramu na fiszkę).
- **users** ↔ **flashcard_schedule**: 1 do wielu (jeden użytkownik może mieć wiele wpisów harmonogramu).
- **users** ↔ **audit_logs**: relacja 1 do wielu (jeden użytkownik może mieć wiele wpisów w logach audytu).

## 3. Indeksy i ograniczenia

- **Tabela `review_logs`:**
  - Indeks na `(user_id, reviewed_at)` dla szybkiego zliczania dziennych przeglądów.
  - Indeks na `flashcard_id` wspierający filtrowanie przeglądów konkretnej fiszki.

- **Tabela `users`:**
  - Unikalny indeks na `email`.
  - Ograniczenie CHECK na `email` do walidacji formatu (np. przy użyciu regex).
  - Częściowy indeks na `deleted_at IS NULL`.

- **Tabela `flashcards`:**
  - Indeks na `user_id`.
  - Częściowy indeks na `deleted_at IS NULL`.
  - Przygotowanie struktury pod przyszły GIN indeks dla kolumny `metadata`, w 
  przypadku implementacji pełnotekstowego wyszukiwania lub zaawansowanych wyszukiwań 
  w formacie JSONB.

- **Tabela `audit_logs`:**
  - Indeks na kolumnie `occurred_at` wspierający partycjonowanie oraz zapytania związane z czasem.
  - Indeks na kolumnie `user_id` w przypadku częstego filtrowania według użytkownika.
  - Dla dużych ilości danych: implementacja partycjonowania tabeli (np. partycje miesięczne) w oparciu o `occurred_at`.

- **Tabela `flashcard_schedule`:**
  - Indeks na kolumnach `(user_id, next_due)` dla szybkiego pobierania zaległych i nowych fiszek.

## 4. Zasady PostgreSQL – Row-Level Security (RLS)

- **flashcards:**
  - Włączona RLS.
  - Polityka SELECT/UPDATE/DELETE: `flashcards.user_id = current_setting('app.current_user_id')::uuid`.

- **flashcard_schedule:**
  - Włączona RLS.
  - Polityka SELECT/UPDATE/DELETE: `flashcard_schedule.user_id = current_setting('app.current_user_id')::uuid`.

## 5. Dodatkowe uwagi projektowe

- Wszystkie identyfikatory są typu UUID dla spójności i skalowalności.
- Oddzielenie danych SRS od tabeli `flashcards` umożliwia niezależne zarządzanie harmonogramem.
- Nowe fiszki są identyfikowane przez `repetition_count = 0`.
- Warstwa serwisu wymusza dzienny limit 50 nowych kart (`repetition_count = 0`); przegląd zaległych kart (next_due ≤ teraz) jest nieograniczony. Miks kart ustalany jest na podstawie `next_due` i `repetition_count`.
- Migracje bazodanowe powinny być wykonywane transakcyjnie.
- Tabela `flashcard_schedule` nie wymaga soft delete; zastąpienie lub reset interwału zarządzane w serwisie.