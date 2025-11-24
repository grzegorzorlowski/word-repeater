<conversation_summary>

<decisions>
1. Dashboard będzie głównym hubem z widocznymi CTA: „Generate”, „My Flashcards”, „Start Learning”.
2. Dashboard wyświetli liczbę flashcards zaplanowanych na dziś.
3. Lista flashcards będzie paginowana z parametrami `page` i `limit` zgodnie z API.
4. Filtry „source” (AI/manual) będą dostępne w formie komponentów typu „chips”.
5. Globalna nawigacja: Dashboard, Flashcards, Generate, Learn, Logout (nagłówek lub hamburger menu dla mobile).
6. Ekran „No flashcards to study today” będzie zawierał CTA do generowania lub tworzenia nowych.
7. Widok generowania flashcards: jedno pole tekstowe, licznik znaków, przycisk „Generate”, bez historii.
8. Widok akceptacji AI flashcards: pełnoekranowy, duże przyciski „Accept” i „Reject”, wyraźne Q&A, prosta nawigacja.
9. Dodanie komponentu loadera (spinner/skeleton) w widokach generacji i nauki.
10. Powtórzenie głównych CTA w globalnym menu dla spójności nawigacji.
</decisions>

<matched_recommendations>

1. Zaprojektować dashboard jako centralny punkt z CTA do głównych funkcji.
2. Użyć prostych przycisków „Previous/Next” lub numerowanych stron dla paginacji.
3. Zastosować komponenty typu „chips” do filtrowania źródła flashcards.
4. Zaprojektować prostą nawigację w nagłówku lub hamburger menu dla mobile.
5. Dodać CTA na ekranie „No flashcards to study today”.
6. Uprościć ekran generowania flashcards zgodnie z zakresem MVP.
7. Dedykowany pełnoekranowy widok dla akceptacji AI flashcards.
8. Dodanie spójnego komponentu loadera w kluczowych widokach.
9. Umieścić główne CTA zarówno na dashboardzie, jak i w globalnym menu.
10. Zapewnić komunikaty o stanie braku danych w widokach listy i sesji nauki.
    </matched_recommendations>

<ui_architecture_planning_summary>
**Główne wymagania dotyczące architektury UI:**

- Mobile-first, responsywne UI z prostą nawigacją.
- Spójny design system oparty na Tailwind i Shadcn/ui.
- Minimalistyczne ekrany zgodne z MVP (bez historii generacji, bez edycji przed akceptacją).

**Kluczowe widoki i przepływy użytkownika:**

- Dashboard (hub z CTA i liczbą flashcards na dziś).
- Generowanie flashcards (pole tekstowe, licznik, przycisk „Generate”).
- Akceptacja AI flashcards (pełnoekranowy widok z Accept/Reject).
- Lista flashcards (paginacja, filtry chips).
- Sesja nauki (kolejne flashcards, Show Answer, Remembered/Don’t Remember).
- Ekrany błędów i brak danych (np. „No flashcards to study today”).

**Strategia integracji z API i zarządzania stanem:**

- Wykorzystanie React Query do obsługi zapytań i cache.
- Paginacja i filtrowanie zgodne z parametrami API (`page`, `limit`, `source`).
- Obsługa JWT w nagłówkach dla autoryzacji.
- Komponenty loadera i obsługa błędów (retry, toast).

**Responsywność, dostępność i bezpieczeństwo:**

- Mobile-first layout z hamburger menu.
- WCAG AA: aria-labels, kontrast, obsługa klawiatury.
- Bezpieczne przechowywanie tokenów (HttpOnly cookies lub secure storage).
- HTTPS i zgodność z GDPR (linki do polityki prywatności, zgody).

**Nierozwiązane kwestie:**

- Brak szczegółów dotyczących design systemu (np. kolorystyka, typografia).
- Brak decyzji o strategii zarządzania stanem dla sesji nauki (lokalny vs globalny).
- Nieustalone komunikaty dla limitów generacji i błędów sieciowych (treść i styl).
  </ui_architecture_planning_summary>

<unresolved_issues>

1. Wybór konkretnej biblioteki do zarządzania stanem (React Query vs alternatywy).
2. Szczegóły dotyczące design systemu (paleta kolorów, komponenty bazowe).
3. Dokładne komunikaty i UX dla wyjątkowych stanów (np. przekroczenie limitu, błędy API).
4. Strategia dla obsługi sesji nauki offline lub w przypadku utraty połączenia.
   </unresolved_issues>

</conversation_summary>
