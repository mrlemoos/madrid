---
title: Bringing journal to Madrid
description: 'A calm view for notes titled like dates: a calendar, timeline, and one tap back to today when you have wandered months away.'
pubDate: 2026-05-22
author: Leonardo Lemos
tags:
  - product
draft: true
---

If you name notes the way you name days (e.g. "15 April 2026", "May 5 2003", "5th of May, 2003"), they are easy to write and easy to search for. They are less easy to _see_ as a diary. A title is a string in a list; a diary is something you skim across weeks and months.

**Journal** is that second view. It gathers notes whose titles parse as real calendar dates, then lays them out in a month grid and a scrollable timeline so you can move through time without treating your vault like a spreadsheet.

![Journal in Madrid: May 2026 in the calendar; dots mark days with entries; the “All entries” timeline lists dated notes beside it.](/journal-screenshot.png)

## What counts as a journal note

Madrid uses natural-language date parsing on the title. If the title resolves to a calendar day, the note appears in Journal. That covers common shapes people actually type (numeric dates, month names, ordinals), and the long British-style daily title Madrid uses for **today’s note** (for example **4 March 2026**).

Titles that are ordinary phrases stay in the sidebar only. **Untitled Note** never appears here on purpose.

## The calendar

The left panel is a familiar month view. Days that have at least one journal note show a small dot under the number. The dot follows your theme so it stays legible in light and dark mode.

Pick a day and the list on the right filters to that date. Pick the same day again to clear the filter and see the full timeline. When you have paged to another month, a **Go to today** control appears: one action jumps you back to this month and selects today’s local date so the list lines up with “right now”.

## The list

The right panel is a virtualised list of entries, newest dates first. Each row shows the resolved day and the note title; open a note in one click and you are back in the editor.

Long journals stay smooth: only the rows on screen are rendered, so scrolling stays light even if you have been writing for years.

## How to open Journal

- **Command palette (⌘K)**: choose **Open journal** when you have at least one date-titled note.
- **Sidebar**: when the same condition is met, **Journal** sits below **Settings** with a calendar icon.

If you have never used a date in a title, the entry points stay hidden. The feature does not nag you to start; it appears when your vault already speaks that language.

## Why a separate surface

You can already open today’s note with a shortcut, search by title, and link days together. Journal does not replace any of that. It answers a narrower question: **what did I file under dates, and when?** For some people that is occasional; for others it is the backbone of the vault. Either way, it is a view that keeps the rest of Madrid quiet: glass, typography, and your words, while the calendar does the navigation.
