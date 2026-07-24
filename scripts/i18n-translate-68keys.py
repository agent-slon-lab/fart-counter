#!/usr/bin/env python3
"""
Translate 68 missing i18n keys into ES, PT, DE, FR, HI and add them to
/home/z/my-project/src/lib/i18n-extra.json.

Preserves alphabetical key ordering and 2-space indentation of the original file.
"""

import json
from pathlib import Path

EXTRA_PATH = Path("/home/z/my-project/src/lib/i18n-extra.json")

# 68 keys × 5 languages.
# Conventions:
#   ES: «...», informal "tú", Latin Spanish, noun "pedos", verb "tirar pedos"
#   PT: "...", Brazilian Portuguese, "você", noun "peidos", verb "peidar"
#   DE: „...", informal "du", noun "Furze", verb "furzen"
#   FR: « ... », informal "tu", noun "pets", verb "pèter"
#   HI: '...', informal "तुम", noun "पूक", verb "पूक करना"

NEW_KEYS = {
    # ---------------------------------------------------------------- ES
    "es": {
        # --- Misc
        "load_data": "Cargar datos",
        "save_data": "Guardar datos",
        "shop_apply": "Aplicar",
        "shop_applied": "✓ Aplicado",
        # --- Food XP
        "food_xp_entry": "¡+5 XP por registrar comida!",
        "food_xp_bonus": "🎉 ¡+20 XP por 3 comidas diferentes!",
        "food_xp_diary": "📝 ¡+10 XP por llenar el diario!",
        # --- My Foods
        "food_my_foods": "Mis comidas",
        "food_my_foods_hint": "Comidas guardadas — no tienes que volver a escribirlas",
        "food_no_my_foods": "Aún no hay nada. Añade tu propia comida aquí abajo 👇",
        "food_delete_my_food": "Quitar de la lista",
        "food_custom_saved": "Guardado en «Mis comidas»",
        # --- Food warnings
        "food_warning_title": "¡Alerta! 💨",
        "food_warning_subtitle": "Después de «{food}» promediaste {n} pedos en 24h. ¡Ya van {times} veces!",
        "food_warn_1": "¡No vayas a una cita hoy! 💔",
        "food_warn_2": "¡Cierra puertas y ventanas! 🚪",
        "food_warn_3": "¡Prepara ropa interior de repuesto! 🩲",
        "food_warn_4": "¡Avísale a tu familia — ellos también van a sufrir! 👨‍👩‍👧",
        "food_warn_5": "¿Ascensor? Ni lo pienses. ¡Usa las escaleras! 🪜",
        "food_warn_6": "¡Aléjate de cualquier llama abierta! 🔥",
        "food_warn_7": "¡Cita con el sofá cancelada! 🛋️",
        "food_warn_8": "¡Esconde encendedores y cerillas! 💥",
        "food_warn_9": "¡Corre mientras puedas! 🏃",
        "food_warn_10": "¡Nada de ascensores llenos de gente! 🛗",
        "food_warn_11": "¡Cancela todas las reuniones y viajes! ✈️",
        "food_warn_12": "¡Ventilador a máxima potencia! 🌀",
        "food_add_anyway": "¡Añadir igual!",
        "food_chicken_out": "Mejor no 😅",
        "food_warning_low": "Mala idea, pero sobrevivirás...",
        "food_warning_mid": "¿En serio? ¡Tú te lo buscas!",
        "food_warning_high": "¡Evacuación! ¡Sal por tu vida!",
        # --- Cycles
        "cycles_today": "Hoy",
        "cycles_avg_label": "media",
        "cycles_total_label": "total",
        "cycles_share": "cuota",
        "cycles_peak_vs_low": "Tiras {n}× más pedos en {peak} que en {low}",
        "cycles_no_peak_yet": "Bastante parejo — aún sin pico claro",
        "cycles_records_count": "registros",
        "cycles_days_count": "días con registros",
        "cycles_this_week": "Esta semana",
        "cycles_last_week": "Semana pasada",
        "cycles_vs_last_week": "vs semana pasada",
        # --- Trend
        "trend_this_month": "Este mes",
        "trend_last_month": "Mes pasado",
        "trend_delta_up": "{n} más",
        "trend_delta_down": "{n} menos",
        "trend_delta_same": "igual",
        "trend_pct_up": "+{pct}% vs mes pasado",
        "trend_pct_down": "−{pct}% vs mes pasado",
        "trend_30days": "Últimos 30 días",
        "trend_7days": "Últimos 7 días",
        "trend_daily_avg": "Media diaria",
        "trend_best_day": "Mejor día",
        "trend_worst_day": "Peor día",
        # --- Hourly
        "hourly_section": "Hora del día",
        "hourly_desc": "Cuándo tiras más pedos",
        "hourly_morning": "Mañana 6-12",
        "hourly_afternoon": "Tarde 12-18",
        "hourly_evening": "Noche 18-24",
        "hourly_night": "Madrugada 0-6",
        "hourly_peak": "Pico de actividad",
        "hourly_peak_at": "Más a menudo {period}",
        "hourly_no_data": "Añade algunos pedos a distintas horas para ver el patrón",
        # --- AI insights
        "ai_section": "Insights de IA",
        "ai_desc": "Patrones que detecté en tus datos",
        "ai_no_insights": "Aún no hay suficientes datos. Sigue registrando pedos y comidas — ¡aquí aparecerán descubrimientos!",
        "ai_insight_weekday": "📅 Los {day} promedias {n} pedos — tu día más activo",
        "ai_insight_hour": "🕐 Tiras más pedos {period} — {pct}% de todos tus pedos",
        "ai_insight_streak": "🔥 Llevas una racha de {n} días — ¡sigue así!",
        "ai_insight_food": "🥄 Después de «{food}» promedias {n} pedos en 24h — cuidado",
        "ai_insight_improvement": "📉 Este mes tienes {n} pedos menos que el pasado. ¡Bien!",
        "ai_insight_increase": "📈 Este mes tienes {n} pedos más — ¿cambio de dieta?",
        "ai_insight_mood": "😊 En días con ánimo «{mood}» promedias {n} pedos",
        "ai_insight_weekend": "🏖️ Los fines de semana tiras {pct}% más pedos que entre semana",
        "ai_insight_weekday_more": "💼 Entre semana tiras {pct}% más pedos que los fines de semana",
        "ai_insight_norm": "✅ Tu media es {n} pedos/día — dentro de la norma médica (10-20)",
        "ai_insight_above_norm": "⚠️ Estás por encima de la norma ({n}/día vs 10-20). Quizá revises tu dieta",
        "ai_insight_below_norm": "💤 Estás por debajo de la norma ({n}/día). ¡Aprieta más!",
        "ai_insight_silent_ratio": "🤫 {pct}% de tus pedos son silenciosos. ¡Un ninja de verdad!",
        "ai_insight_smelly_ratio": "💀 {pct}% de tus pedos son apestosos. ¡Pésames a quienes te rodean!",
        "ai_insight_time_consistency": "⏰ Tiras pedos de forma bastante uniforme durante el día",
        "ai_insights_count": "insights encontrados",
    },

    # ---------------------------------------------------------------- PT
    "pt": {
        # --- Misc
        "load_data": "Carregar dados",
        "save_data": "Salvar dados",
        "shop_apply": "Aplicar",
        "shop_applied": "✓ Aplicado",
        # --- Food XP
        "food_xp_entry": "+5 XP por registrar comida!",
        "food_xp_bonus": "🎉 +20 XP por 3 comidas diferentes!",
        "food_xp_diary": "📝 +10 XP por preencher o diário!",
        # --- My Foods
        "food_my_foods": "Minhas comidas",
        "food_my_foods_hint": "Comidas salvas — não precisa digitar de novo",
        "food_no_my_foods": "Ainda não tem nada. Adicione sua própria comida abaixo 👇",
        "food_delete_my_food": "Remover da lista",
        "food_custom_saved": "Salvo em \"Minhas comidas\"",
        # --- Food warnings
        "food_warning_title": "Alerta! 💨",
        "food_warning_subtitle": "Depois de \"{food}\" você teve em média {n} peidos em 24h. Já é {times} vezes!",
        "food_warn_1": "Não vá a um encontro hoje! 💔",
        "food_warn_2": "Tranque as portas e feche as janelas! 🚪",
        "food_warn_3": "Prepare uma roupa íntima reserva! 🩲",
        "food_warn_4": "Avise a família — eles também vão sofrer! 👨‍👩‍👧",
        "food_warn_5": "Elevador? Esqueça. Use as escadas! 🪜",
        "food_warn_6": "Fique longe de fogo aberto! 🔥",
        "food_warn_7": "Encontro com o sofá cancelado! 🛋️",
        "food_warn_8": "Esconda isqueiros e fósforos! 💥",
        "food_warn_9": "Corra enquanto ainda dá tempo! 🏃",
        "food_warn_10": "Nada de elevadores lotados! 🛗",
        "food_warn_11": "Cancele todas as reuniões e viagens! ✈️",
        "food_warn_12": "Ventilador no máximo! 🌀",
        "food_add_anyway": "Adicionar mesmo assim!",
        "food_chicken_out": "Melhor não 😅",
        "food_warning_low": "Idéia ruim, mas você sobrevive...",
        "food_warning_mid": "Sério? A culpa é sua!",
        "food_warning_high": "Evacuação! Corra por sua vida!",
        # --- Cycles
        "cycles_today": "Hoje",
        "cycles_avg_label": "média",
        "cycles_total_label": "total",
        "cycles_share": "parcela",
        "cycles_peak_vs_low": "Você peida {n}× mais em {peak} que em {low}",
        "cycles_no_peak_yet": "Bastante uniforme — sem pico claro ainda",
        "cycles_records_count": "registros",
        "cycles_days_count": "dias com registros",
        "cycles_this_week": "Esta semana",
        "cycles_last_week": "Semana passada",
        "cycles_vs_last_week": "vs semana passada",
        # --- Trend
        "trend_this_month": "Este mês",
        "trend_last_month": "Mês passado",
        "trend_delta_up": "{n} a mais",
        "trend_delta_down": "{n} a menos",
        "trend_delta_same": "igual",
        "trend_pct_up": "+{pct}% vs mês passado",
        "trend_pct_down": "−{pct}% vs mês passado",
        "trend_30days": "Últimos 30 dias",
        "trend_7days": "Últimos 7 dias",
        "trend_daily_avg": "Média diária",
        "trend_best_day": "Melhor dia",
        "trend_worst_day": "Pior dia",
        # --- Hourly
        "hourly_section": "Hora do dia",
        "hourly_desc": "Quando você peida mais",
        "hourly_morning": "Manhã 6-12",
        "hourly_afternoon": "Tarde 12-18",
        "hourly_evening": "Noite 18-24",
        "hourly_night": "Madrugada 0-6",
        "hourly_peak": "Pico de atividade",
        "hourly_peak_at": "Mais frequentemente {period}",
        "hourly_no_data": "Adicione alguns peidos em horários diferentes para ver o padrão",
        # --- AI insights
        "ai_section": "Insights de IA",
        "ai_desc": "Padrões que detectei nos seus dados",
        "ai_no_insights": "Ainda não há dados suficientes. Continue registrando peidos e comidas — os insights vão aparecer aqui!",
        "ai_insight_weekday": "📅 Aos {day} você tem em média {n} peidos — seu dia mais ativo",
        "ai_insight_hour": "🕐 Você peida mais {period} — {pct}% de todos os peidos",
        "ai_insight_streak": "🔥 Você está numa sequência de {n} dias — continue assim!",
        "ai_insight_food": "🥄 Depois de \"{food}\" você tem em média {n} peidos em 24h — cuidado",
        "ai_insight_improvement": "📉 Este mês você teve {n} peidos a menos que no passado. Legal!",
        "ai_insight_increase": "📈 Este mês você teve {n} peidos a mais — será que mudou a dieta?",
        "ai_insight_mood": "😊 Em dias com humor \"{mood}\" você tem em média {n} peidos",
        "ai_insight_weekend": "🏖️ Nos finais de semana você peida {pct}% a mais que em dias úteis",
        "ai_insight_weekday_more": "💼 Em dias úteis você peida {pct}% a mais que nos finais de semana",
        "ai_insight_norm": "✅ Sua média é {n} peidos/dia — dentro da norma médica (10-20)",
        "ai_insight_above_norm": "⚠️ Você está acima da norma ({n}/dia vs 10-20). Talvez repense a dieta",
        "ai_insight_below_norm": "💤 Você está abaixo da norma ({n}/dia). Force mais!",
        "ai_insight_silent_ratio": "🤫 {pct}% dos seus peidos são silenciosos. Um ninja de verdade!",
        "ai_insight_smelly_ratio": "💀 {pct}% dos seus peidos são fedorentos. Pêsames a quem está por perto!",
        "ai_insight_time_consistency": "⏰ Você peida de forma bem uniforme ao longo do dia",
        "ai_insights_count": "insights encontrados",
    },

    # ---------------------------------------------------------------- DE
    "de": {
        # --- Misc
        "load_data": "Daten laden",
        "save_data": "Daten speichern",
        "shop_apply": "Anwenden",
        "shop_applied": "✓ Angewendet",
        # --- Food XP
        "food_xp_entry": "+5 XP pro Lebensmittel-Eintrag!",
        "food_xp_bonus": "🎉 +20 XP für 3 verschiedene Lebensmittel!",
        "food_xp_diary": "📝 +10 XP fürs Ausfüllen des Tagebuchs!",
        # --- My Foods
        "food_my_foods": "Meine Lebensmittel",
        "food_my_foods_hint": "Gespeicherte Lebensmittel — nicht mehr neu eintippen",
        "food_no_my_foods": "Noch nichts hier. Füge dein eigenes Essen unten hinzu 👇",
        "food_delete_my_food": "Aus der Liste entfernen",
        "food_custom_saved": "Gespeichert unter „Meine Lebensmittel“",
        # --- Food warnings
        "food_warning_title": "Warnung! 💨",
        "food_warning_subtitle": "Nach „{food}“ hast du im Schnitt {n} Furze in 24h. Das ist schon {times} Mal!",
        "food_warn_1": "Geh heute nicht auf ein Date! 💔",
        "food_warn_2": "Türen abschließen und Fenster zu! 🚪",
        "food_warn_3": "Ersatzunterwäsche bereitlegen! 🩲",
        "food_warn_4": "Warne deine Familie — die leiden auch! 👨‍👩‍👧",
        "food_warn_5": "Aufzug? Vergiss es. Nimm die Treppe! 🪜",
        "food_warn_6": "Fern von offenen Flammen bleiben! 🔥",
        "food_warn_7": "Date mit dem Sofa fällt aus! 🛋️",
        "food_warn_8": "Versteck Feuerzeuge und Streichhölzer! 💥",
        "food_warn_9": "Renn, solange du noch kannst! 🏃",
        "food_warn_10": "Keine vollen Aufzüge! 🛗",
        "food_warn_11": "Sag alle Termine und Reisen ab! ✈️",
        "food_warn_12": "Ventilator auf Maximum! 🌀",
        "food_add_anyway": "Trotzdem hinzufügen!",
        "food_chicken_out": "Lieber nicht 😅",
        "food_warning_low": "Blöde Idee, aber du überlebst...",
        "food_warning_mid": "Ernsthaft? Selbst schuld!",
        "food_warning_high": "Evakuierung! Rette dein Leben!",
        # --- Cycles
        "cycles_today": "Heute",
        "cycles_avg_label": "Schnitt",
        "cycles_total_label": "gesamt",
        "cycles_share": "Anteil",
        "cycles_peak_vs_low": "Du furzt {n}× mehr am {peak} als am {low}",
        "cycles_no_peak_yet": "Ziemlich gleichmäßig — noch kein klarer Peak",
        "cycles_records_count": "Einträge",
        "cycles_days_count": "Tage mit Einträgen",
        "cycles_this_week": "Diese Woche",
        "cycles_last_week": "Letzte Woche",
        "cycles_vs_last_week": "vs letzte Woche",
        # --- Trend
        "trend_this_month": "Dieser Monat",
        "trend_last_month": "Letzter Monat",
        "trend_delta_up": "{n} mehr",
        "trend_delta_down": "{n} weniger",
        "trend_delta_same": "gleich",
        "trend_pct_up": "+{pct}% vs letzter Monat",
        "trend_pct_down": "−{pct}% vs letzter Monat",
        "trend_30days": "Letzte 30 Tage",
        "trend_7days": "Letzte 7 Tage",
        "trend_daily_avg": "Tagesdurchschnitt",
        "trend_best_day": "Bester Tag",
        "trend_worst_day": "Schlimmster Tag",
        # --- Hourly
        "hourly_section": "Tageszeit",
        "hourly_desc": "Wann du am meisten furzt",
        "hourly_morning": "Morgen 6-12",
        "hourly_afternoon": "Nachmittag 12-18",
        "hourly_evening": "Abend 18-24",
        "hourly_night": "Nacht 0-6",
        "hourly_peak": "Aktivitäts-Höhepunkt",
        "hourly_peak_at": "Am häufigsten {period}",
        "hourly_no_data": "Füge ein paar Furze zu verschiedenen Zeiten hinzu, um das Muster zu sehen",
        # --- AI insights
        "ai_section": "KI-Insights",
        "ai_desc": "Muster, die ich in deinen Daten gefunden habe",
        "ai_no_insights": "Noch nicht genug Daten. Weiterhin Furze und Essen eintragen — hier erscheinen dann Erkenntnisse!",
        "ai_insight_weekday": "📅 An {day} fürzt du im Schnitt {n} Mal — dein aktivster Tag",
        "ai_insight_hour": "🕐 Du furzt am meisten {period} — {pct}% aller Furze",
        "ai_insight_streak": "🔥 Du bist auf einer {n}-Tage-Serie — weiter so!",
        "ai_insight_food": "🥄 Nach „{food}“ fürzt du im Schnitt {n} Mal in 24h — Vorsicht",
        "ai_insight_improvement": "📉 Diesen Monat hast du {n} Furze weniger als letzten. Super!",
        "ai_insight_increase": "📈 Diesen Monat hast du {n} Furze mehr — vielleicht Diät geändert?",
        "ai_insight_mood": "😊 An Tagen mit Stimmung „{mood}“ fürzt du im Schnitt {n} Mal",
        "ai_insight_weekend": "🏖️ Am Wochenende furzt du {pct}% mehr als unter der Woche",
        "ai_insight_weekday_more": "💼 Unter der Woche furzt du {pct}% mehr als am Wochenende",
        "ai_insight_norm": "✅ Deine Rate ist {n} Furze/Tag — innerhalb der medizinischen Norm (10-20)",
        "ai_insight_above_norm": "⚠️ Du bist über der Norm ({n}/Tag vs 10-20). Vielleicht Diät überdenken",
        "ai_insight_below_norm": "💤 Du bist unter der Norm ({n}/Tag). Mehr drücken!",
        "ai_insight_silent_ratio": "🤫 {pct}% deiner Furze sind leise. Ein echter Ninja!",
        "ai_insight_smelly_ratio": "💀 {pct}% deiner Furze stinken. Beileid an alle in deiner Nähe!",
        "ai_insight_time_consistency": "⏰ Du furzt ziemlich gleichmäßig über den Tag verteilt",
        "ai_insights_count": "Insights gefunden",
    },

    # ---------------------------------------------------------------- FR
    "fr": {
        # --- Misc
        "load_data": "Charger les données",
        "save_data": "Enregistrer les données",
        "shop_apply": "Appliquer",
        "shop_applied": "✓ Appliqué",
        # --- Food XP
        "food_xp_entry": "+5 XP pour chaque repas saisi !",
        "food_xp_bonus": "🎉 +20 XP pour 3 aliments différents !",
        "food_xp_diary": "📝 +10 XP pour avoir rempli le journal !",
        # --- My Foods
        "food_my_foods": "Mes aliments",
        "food_my_foods_hint": "Aliments enregistrés — plus besoin de les retaper",
        "food_no_my_foods": "Rien ici pour l'instant. Ajoute ton propre aliment ci-dessous 👇",
        "food_delete_my_food": "Retirer de la liste",
        "food_custom_saved": "Enregistré dans « Mes aliments »",
        # --- Food warnings
        "food_warning_title": "Attention ! 💨",
        "food_warning_subtitle": "Après « {food} » tu as fait en moyenne {n} pets en 24h. C'est déjà {times} fois !",
        "food_warn_1": "Pas de rendez-vous aujourd'hui ! 💔",
        "food_warn_2": "Ferme portes et fenêtres ! 🚪",
        "food_warn_3": "Prépare des sous-vêtements de rechange ! 🩲",
        "food_warn_4": "Préviens ta famille — ils vont souffrir aussi ! 👨‍👩‍👧",
        "food_warn_5": "L'ascenseur ? Oublie. Prends l'escalier ! 🪜",
        "food_warn_6": "Reste loin des flammes nues ! 🔥",
        "food_warn_7": "Le date avec le canapé est annulé ! 🛋️",
        "food_warn_8": "Cache briquets et allumettes ! 💥",
        "food_warn_9": "Cours tant que tu le peux ! 🏃",
        "food_warn_10": "Pas d'ascenseurs bondés ! 🛗",
        "food_warn_11": "Annule toutes les réunions et les voyages ! ✈️",
        "food_warn_12": "Le ventilateur à fond ! 🌀",
        "food_add_anyway": "Ajouter quand même !",
        "food_chicken_out": "Mieux vaut pas 😅",
        "food_warning_low": "Idée moyenne, mais tu survivras...",
        "food_warning_mid": "Sérieux ? C'est sur toi !",
        "food_warning_high": "Évacuation ! Sauve-toi !",
        # --- Cycles
        "cycles_today": "Aujourd'hui",
        "cycles_avg_label": "moy.",
        "cycles_total_label": "total",
        "cycles_share": "part",
        "cycles_peak_vs_low": "Tu pètes {n}× plus le {peak} que le {low}",
        "cycles_no_peak_yet": "Plutôt régulier — pas encore de pic clair",
        "cycles_records_count": "entrées",
        "cycles_days_count": "jours avec entrées",
        "cycles_this_week": "Cette semaine",
        "cycles_last_week": "Semaine dernière",
        "cycles_vs_last_week": "vs semaine dernière",
        # --- Trend
        "trend_this_month": "Ce mois-ci",
        "trend_last_month": "Mois dernier",
        "trend_delta_up": "{n} de plus",
        "trend_delta_down": "{n} de moins",
        "trend_delta_same": "pareil",
        "trend_pct_up": "+{pct}% vs mois dernier",
        "trend_pct_down": "−{pct}% vs mois dernier",
        "trend_30days": "30 derniers jours",
        "trend_7days": "7 derniers jours",
        "trend_daily_avg": "Moyenne par jour",
        "trend_best_day": "Meilleur jour",
        "trend_worst_day": "Pire jour",
        # --- Hourly
        "hourly_section": "Heure du jour",
        "hourly_desc": "Quand tu pètes le plus",
        "hourly_morning": "Matin 6-12",
        "hourly_afternoon": "Après-midi 12-18",
        "hourly_evening": "Soir 18-24",
        "hourly_night": "Nuit 0-6",
        "hourly_peak": "Pic d'activité",
        "hourly_peak_at": "Le plus souvent {period}",
        "hourly_no_data": "Ajoute quelques pets à des heures différentes pour voir le pattern",
        # --- AI insights
        "ai_section": "Insights IA",
        "ai_desc": "Des motifs que j'ai repérés dans tes données",
        "ai_no_insights": "Pas encore assez de données. Continue à enregistrer pets et repas — des découvertes apparaîtront ici !",
        "ai_insight_weekday": "📅 Le {day} tu fais en moyenne {n} pets — ta journée la plus active",
        "ai_insight_hour": "🕐 Tu pètes le plus {period} — {pct}% de tous tes pets",
        "ai_insight_streak": "🔥 Tu es sur une série de {n} jours — continue !",
        "ai_insight_food": "🥄 Après « {food} » tu fais en moyenne {n} pets en 24h — attention",
        "ai_insight_improvement": "📉 Ce mois-ci tu as {n} pets de moins que le mois dernier. Bien !",
        "ai_insight_increase": "📈 Ce mois-ci tu as {n} pets de plus — un changement de régime ?",
        "ai_insight_mood": "😊 Les jours « {mood} » tu fais en moyenne {n} pets",
        "ai_insight_weekend": "🏖️ Tu pètes {pct}% plus le week-end qu'en semaine",
        "ai_insight_weekday_more": "💼 Tu pètes {pct}% plus en semaine que le week-end",
        "ai_insight_norm": "✅ Ta moyenne est de {n} pets/jour — dans la norme médicale (10-20)",
        "ai_insight_above_norm": "⚠️ Tu es au-dessus de la norme ({n}/jour vs 10-20). Peut-être revoir ton régime",
        "ai_insight_below_norm": "💤 Tu es sous la norme ({n}/jour). Pousse plus fort !",
        "ai_insight_silent_ratio": "🤫 {pct}% de tes pets sont silencieux. Un vrai ninja !",
        "ai_insight_smelly_ratio": "💀 {pct}% de tes pets sont puants. Condoléances à ton entourage !",
        "ai_insight_time_consistency": "⏰ Tu pètes de façon assez régulière tout au long de la journée",
        "ai_insights_count": "insights trouvés",
    },

    # ---------------------------------------------------------------- HI
    "hi": {
        # --- Misc
        "load_data": "डेटा लोड करें",
        "save_data": "डेटा सेव करें",
        "shop_apply": "लागू करें",
        "shop_applied": "✓ लागू हुआ",
        # --- Food XP
        "food_xp_entry": "खाना दर्ज करने पर +5 XP!",
        "food_xp_bonus": "🎉 3 अलग-अलग खानों पर +20 XP!",
        "food_xp_diary": "📝 डायरी भरने पर +10 XP!",
        # --- My Foods
        "food_my_foods": "मेरे खाने",
        "food_my_foods_hint": "सेव किए गए खाने — बार-बार टाइप करने की ज़रूरत नहीं",
        "food_no_my_foods": "अभी यहाँ कुछ नहीं है। नीचे अपना खाना जोड़ो 👇",
        "food_delete_my_food": "लिस्ट से हटाएँ",
        "food_custom_saved": "'मेरे खाने' में सेव हो गया",
        # --- Food warnings
        "food_warning_title": "चेतावनी! 💨",
        "food_warning_subtitle": "'{food}' के बाद तुम्हारा औसत 24 घंटे में {n} पूक था। अब तक {times} बार हो चुका!",
        "food_warn_1": "आज डेट पर मत जाना! 💔",
        "food_warn_2": "दरवाज़े बंद करो और खिड़कियाँ बंद करो! 🚪",
        "food_warn_3": "स्पेयर अंडरवियर तैयार रखो! 🩲",
        "food_warn_4": "परिवार को आगाह करो — उन्हें भी सहना पड़ेगा! 👨‍👩‍👧",
        "food_warn_5": "लिफ़्ट? भूल जाओ। सीढ़ियाँ चढ़ो! 🪜",
        "food_warn_6": "खुली आग से दूर रहो! 🔥",
        "food_warn_7": "सोफ़े के साथ डेट कैंसल! 🛋️",
        "food_warn_8": "लाइटर और माचिस छुपा दो! 💥",
        "food_warn_9": "जब तक समय है, भागो! 🏃",
        "food_warn_10": "भीड़ वाले लिफ़्ट नहीं! 🛗",
        "food_warn_11": "सारी मीटिंग्स और यात्राएँ कैंसल करो! ✈️",
        "food_warn_12": "पंखे को फुल स्पीड पर चलाओ! 🌀",
        "food_add_anyway": "फिर भी जोड़ो!",
        "food_chicken_out": "नहीं भी ठीक 😅",
        "food_warning_low": "मामूली आइडिया, पर तू बच जाएगा...",
        "food_warning_mid": "सच में? अपनी गलती!",
        "food_warning_high": "खाली करो! जान बचाओ!",
        # --- Cycles
        "cycles_today": "आज",
        "cycles_avg_label": "औसत",
        "cycles_total_label": "कुल",
        "cycles_share": "हिस्सा",
        "cycles_peak_vs_low": "तू {peak} को {low} से {n}× ज़्यादा पूक करता है",
        "cycles_no_peak_yet": "काफ़ी संतुलित — अभी कोई स्पष्ट पीक नहीं",
        "cycles_records_count": "रिकॉर्ड",
        "cycles_days_count": "रिकॉर्ड वाले दिन",
        "cycles_this_week": "इस हफ़्ते",
        "cycles_last_week": "पिछला हफ़्ता",
        "cycles_vs_last_week": "बनाम पिछला हफ़्ता",
        # --- Trend
        "trend_this_month": "इस महीने",
        "trend_last_month": "पिछला महीना",
        "trend_delta_up": "{n} ज़्यादा",
        "trend_delta_down": "{n} कम",
        "trend_delta_same": "वैसा ही",
        "trend_pct_up": "पिछले महीने से +{pct}%",
        "trend_pct_down": "पिछले महीने से −{pct}%",
        "trend_30days": "पिछले 30 दिन",
        "trend_7days": "पिछले 7 दिन",
        "trend_daily_avg": "दैनिक औसत",
        "trend_best_day": "सबसे अच्छा दिन",
        "trend_worst_day": "सबसे खराब दिन",
        # --- Hourly
        "hourly_section": "दिन का समय",
        "hourly_desc": "तू कब सबसे ज़्यादा पूक करता है",
        "hourly_morning": "सुबह 6-12",
        "hourly_afternoon": "दोपहर 12-18",
        "hourly_evening": "शाम 18-24",
        "hourly_night": "रात 0-6",
        "hourly_peak": "पीक एक्टिविटी",
        "hourly_peak_at": "सबसे ज़्यादा {period}",
        "hourly_no_data": "पैटर्न देखने के लिए अलग-अलग समय पर कुछ पूक जोड़ो",
        # --- AI insights
        "ai_section": "एआई इनसाइट्स",
        "ai_desc": "तुम्हारे डेटा में जो पैटर्न मैंने देखे",
        "ai_no_insights": "अभी इनसाइट्स के लिए काफ़ी डेटा नहीं। पूक और खाना दर्ज करते रहो — यहाँ खोजें दिखेंगी!",
        "ai_insight_weekday": "📅 {day} को तुम्हारा औसत {n} पूक है — तुम्हारा सबसे एक्टिव दिन",
        "ai_insight_hour": "🕐 तू {period} सबसे ज़्यादा पूक करता है — सारे पूकों का {pct}%",
        "ai_insight_streak": "🔥 तू {n} दिन की स्ट्रीक पर है — ऐसे ही जारी रख!",
        "ai_insight_food": "🥄 '{food}' के बाद तुम्हारा औसत 24 घंटे में {n} पूक है — सावधान",
        "ai_insight_improvement": "📉 इस महीने पिछले महीने से {n} पूक कम हैं। शाबाश!",
        "ai_insight_increase": "📈 इस महीने {n} पूक ज़्यादा हैं — शायद डाइट बदली?",
        "ai_insight_mood": "😊 '{mood}' मूड वाले दिनों में तुम्हारा औसत {n} पूक है",
        "ai_insight_weekend": "🏖️ तू वीकेंड पर वीकडे से {pct}% ज़्यादा पूक करता है",
        "ai_insight_weekday_more": "💼 तू वीकडे पर वीकेंड से {pct}% ज़्यादा पूक करता है",
        "ai_insight_norm": "✅ तुम्हारा औसत {n} पूक/दिन है — मेडिकल नॉर्म (10-20) के भीतर",
        "ai_insight_above_norm": "⚠️ तू नॉर्म से ऊपर है ({n}/दिन, नॉर्म 10-20)। डाइट दोबारा सोचो",
        "ai_insight_below_norm": "💤 तू नॉर्म से नीचे है ({n}/दिन)। और ज़ोर लगाओ!",
        "ai_insight_silent_ratio": "🤫 तुम्हारे {pct}% पूक साइलेंट हैं। असली निंजा!",
        "ai_insight_smelly_ratio": "💀 तुम्हारे {pct}% पूक बदबूदार हैं। आसपास वालों को सहधर्म!",
        "ai_insight_time_consistency": "⏰ तू पूरे दिन काफ़ी संतुलित तरीक़े से पूक करता है",
        "ai_insights_count": "इनसाइट्स मिलीं",
    },
}


def main() -> None:
    # Sanity: the task brief lists exactly 82 keys (despite the title saying 68).
    # 27 food + 11 cycles + 12 trend + 9 hourly + 19 ai + 4 misc = 82.
    expected_keys = set(NEW_KEYS["es"].keys())
    assert len(expected_keys) == 82, f"Expected 82 keys (per explicit list in task brief), got {len(expected_keys)}"
    for lang in ("pt", "de", "fr", "hi"):
        assert set(NEW_KEYS[lang].keys()) == expected_keys, f"Key set mismatch for {lang}"

    # Load existing JSON.
    raw = EXTRA_PATH.read_text(encoding="utf-8")
    data = json.loads(raw)

    # Ensure all 5 target languages exist.
    for lang in ("es", "pt", "de", "fr", "hi"):
        assert lang in data, f"Language {lang} missing from i18n-extra.json"

    # Insert new keys. Use a fresh dict to preserve insertion order = sorted.
    for lang, new_dict in NEW_KEYS.items():
        merged = dict(data[lang])
        for k, v in new_dict.items():
            if k in merged:
                raise RuntimeError(f"Key {k!r} already exists in {lang} — refusing to overwrite")
            merged[k] = v
        data[lang] = merged  # keep insertion order; will re-sort below

    # Rebuild: inner keys sorted alphabetically; outer keys in original order (es, pt, de, fr, hi).
    ordered_top = {lang: dict(sorted(data[lang].items())) for lang in ("es", "pt", "de", "fr", "hi")}
    out = json.dumps(ordered_top, ensure_ascii=False, indent=2) + "\n"

    EXTRA_PATH.write_text(out, encoding="utf-8")
    print(f"Wrote {EXTRA_PATH} ({len(out)} bytes)")
    for lang in ("es", "pt", "de", "fr", "hi"):
        print(f"  {lang}: {len(ordered_top[lang])} keys total")


if __name__ == "__main__":
    main()
