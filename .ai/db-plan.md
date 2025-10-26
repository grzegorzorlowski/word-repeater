# Schema bazy danych dla WordRepeater

## 1. Tabele i kolumny

#### users

This table is managed by Supabase Auth

- **id**: UUID, Primary Key, domyślnie generowany (np. przy użyciu `uuid_generate_v4()`).
- **email**: CITEXT, not null, unikalny, z ograniczeniem CHECK walidującym format (wyrażenie regularne może być użyte).
- **hashed_password**: TEXT, not null.
- **created_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` (czas UTC).
- **updated_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` (czas UTC).
- **deleted_at**: TIMESTAMPTZ, nullable, służy do soft delete.

#### flashcards
- **id**: UUID, Primary Key, domyślnie generowany (np. przy użyciu `uuid_generate_v4()`).
- **user_id**: UUID, not null, Foreign Key odnoszący się do `users(id)`.
- **content**: TEXT, not null — zawiera treść fiszki (np. pytanie/odpowiedź); struktura może być rozbudowywana w przyszłości.

- **metadata**: JSONB, nullable — dodatkowe informacje (np. tagi, kategorie, odnośniki do multimediów).
- **created_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` (czas UTC).
- **updated_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` (czas UTC).
- **deleted_at**: TIMESTAMPTZ, nullable, służy do soft delete.

#### audit_logs
- **id**: UUID, Primary Key, domyślnie generowany (np. przy użyciu `uuid_generate_v4()`).
- **user_id**: UUID, nullable, Foreign Key odnoszący się do `users(id)` — wskazuje użytkownika, który wywołał akcję (jeśli dotyczy).
- **action**: TEXT, not null — opis akcji logowanej.
- **occurred_at**: TIMESTAMPTZ, not null, domyślnie ustawiane na `now()` — używane do partycjonowania według czasu.

## 2. Relacje między tabelami

- **users** ↔ **flashcards**: relacja 1 do wielu (jeden użytkownik może posiadać wiele fiszek).
- **users** ↔ **audit_logs**: relacja 1 do wielu (jeden użytkownik może mieć wiele wpisów w logach audytu).

## 3. Indeksy i ograniczenia

- **Tabela `users`:**
  - Unikalny indeks na kolumnie `email` (używając typu CITEXT dla nieczułości na wielkość liter).
  - Ograniczenie CHECK na `email` do walidacji formatu (np. przy użyciu regex).
  - Częściowy indeks na `deleted_at IS NULL`, optymalizujący zapytania dotyczące aktywnych użytkowników.

- **Tabela `flashcards`:**
  - Indeks na kolumnie `user_id` dla poprawy wydajności połączeń (JOIN) oraz zapytań dotyczących konkretnych użytkowników.
  - Częściowy indeks na `deleted_at IS NULL`, optymalizujący zapytania dotyczące aktywnych fiszek.
  - Przygotowanie struktury pod przyszły GIN indeks dla kolumny `metadata`, w przypadku implementacji pełnotekstowego wyszukiwania lub zaawansowanych wyszukiwań w formacie JSONB.

- **Tabela `audit_logs`:**
  - Indeks na kolumnie `occurred_at` wspierający partycjonowanie oraz zapytania związane z czasem.
  - Indeks na kolumnie `user_id` w przypadku częstego filtrowania według użytkownika.
  - Dla dużych ilości danych: implementacja partycjonowania tabeli (np. partycje miesięczne) w oparciu o `occurred_at`.

## 4. Zasady PostgreSQL – Row-Level Security (RLS)

- **Tabela `flashcards`:**
  - Włączenie RLS z polityką dla standardowych użytkowników: umożliwienie dostępu tylko do wierszy, gdzie `flashcards.user_id = current_setting('app.current_user_id')::uuid` (lub wykorzystanie podobnego mechanizmu opartego na zmiennych sesyjnych).
  - Osobna polityka dla administratorów: umożliwienie pełnego dostępu do danych.

- **Tabela `users`:**
  - Możliwość włączenia RLS, jeżeli jest potrzebne do interfejsów administracyjnych.

## 5. Dodatkowe uwagi projektowe

- Wszystkie identyfikatory są typu UUID, co zapewnia spójność i skalowalność.
- Soft delete jest realizowane przez kolumnę `deleted_at` w tabelach `users` i `flashcards`.
- Kolumny `created_at` i `updated_at` domyślnie ustawiane są przy tworzeniu i modyfikacji rekordu na `now()` (czas UTC).
- Migracje bazy danych powinny być wykonywane transakcyjnie, aby zapewnić spójność danych.
- Struktura bazy jest przygotowana do przyszłych rozszerzeń, m.in. dodania pełnotekstowego wyszukiwania oraz bardziej szczegółowych logów audytu.
- Model jest jednotenantowy – wszelkie dane są dostępne aplikacyjnie zgodnie z rolą użytkownika, bez konieczności stosowania mechanizmów wielotenantowości.