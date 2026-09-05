---
title: Introducing Madrid
description: Why a calm Mac notes app matters when AI is everywhere, and what “no performance” means when you need to think.
pubDate: 2026-05-15
author: Leonardo Lemos
tags:
  - product
  - essay
---

Let me tell you about a problem I think we’re quietly living with: software that won’t leave you alone.

You open a notes app to write one sentence, maybe two, and within minutes the product is on stage again. A chip in the margin asks if you’d like help. A coach mark reminds you about a feature you dismissed yesterday. Your blank page becomes an audition for the assistant, not a place to think. You came to write; the app came to perform.

I call that **performative software**. And I’ve been building the opposite.

## Stop Before You Assume You Know What This Is About

You’ve heard “AI notes” before. I’ll bet good money your brain jumped to one of the following: a chat panel that drafts paragraphs for you, autocomplete that rewrites your voice, or a product that treats every pause as an invitation to generate.

That’s understandable. That’s also the wrong frame.

What I’m interested in is **assistive** use, not **performative** use. There’s a meaningful difference between the two.

The first is consumption dressed up as help. The tool writes _at_ you, nudges you to try again, and measures success by how often you click “accept”. Useful for some tasks, sure. But it doesn’t leave you with a writing surface that stays yours.

The second is bounded work you asked for. Transcription. Metadata when you paste a link. Speech turned into blocks you can cut, reorder, and rewrite until they sound like you. The AI does a job and hands the result back. You remain the author. That’s the shape I care about.

## When AI Helps (And When It Should Wait)

Transcription is the easy example. You record something, a lecture, a meeting you already had, a voice memo you don’t want to lose, and you get text you can edit. Nothing insists you keep the first draft. Nothing nags you to “try the assistant again” five minutes after you said no.

That’s how assistive capture works in Madrid: record, transcribe, **study notes** you edit. It’s a deliberate action: command palette or menu, not a background sales pitch for more AI while you’re mid-thought. You can keep the original recording when upload succeeds. You can work offline and let jobs drain when you’re back online. You can delete everything and start over. The surface doesn’t perform helpfulness on your behalf.

What I do _not_ want is software that writes for me by default, or that treats my attention as a resource to harvest. If the environment keeps interrupting, the cost isn’t just time. It’s the thread you were holding. For me, that cost is especially sharp, and I want to be clear about why.

## A Quiet Room

Humans need a place to quiet down and write out their thoughts without an app performing for them.

I mean something specific by **no performance, no nudges**: the phrases on the [Madrid homepage](/) because they’re the design brief, not marketing filler.

No feeds. Your vault isn’t a timeline of engagement; there’s nothing to scroll past before you reach your own work.

No coach marks on a timer. Features don’t pop up to remind you that you haven’t tried them yet.

No guilt mechanics. If you use a daily note, it’s a note titled with today’s date on your machine, not a streak you’re failing.

No AI in the margins while you type. Optional capture waits until you ask for it.

Calm chrome. On Mac, Madrid uses a darker, blurred sidebar and a writing surface that steps back: glass and restraint instead of loud defaults.

The app should feel like it leaves the room when you pause. Madrid steps back when you stop. That’s the bar.

## Why I Built Another Notes App

I have ADHD. I’m not offering Madrid as a treatment or a medical product; I’m being honest about why small environmental choices compound for me. Focus, for me, is less about willpower and more about whether the tool gets out of the way: visually, morally, and behaviourally.

I tried a lot of notes software. Many of them were ugly in a way that pulled my eyes sideways: busy sidebars, shouty empty states, interfaces that felt like dashboards pretending to be notebooks. Others were aesthetically fine but **morally loud**: always surfacing the next feature, the next assistant, the next reason to click something other than the sentence I was writing.

I wanted serif calm on a Mac. A native app with offline-first notes on the device, sync when I subscribe, and a surface that doesn’t fight me while I think. I couldn’t find exactly that, so I built Madrid.

And I know this sounds like “yet another notes app”. It is, but the point isn’t novelty. It’s subtraction.

## What Madrid Actually Is

Madrid is a Mac app for writing and linking notes. Your vault lives on your device first; with a subscription, notes sync and back up while you’re signed in. There’s no free tier: [download from GitHub Releases](https://github.com/mrlemoos/madrid/releases/latest), sign in, and subscribe in Settings when you’re ready. [Pricing](/pricing) is on the site if you want the numbers before you install.

Under that sentence, the features exist to serve the philosophy, not the other way around.

You type `@` to link to another note. You open the note graph when you want to see how ideas connect; you use backlinks when you want the reverse view. Headings, lists, tables, and emoji live behind the command palette (⌘K), not a toolbar parade. Paste a URL on its own line for a link preview when the page offers useful metadata; if not, you still get a link. Mermaid in fenced code blocks. Inline PDFs and images with Madrid Pro.

Today’s note is optional: turn on ⌘D in Settings if you want a dated page for the day, with a long local date as the title, not gamification.

Small details matter here. Typewriter-style caret alignment stops after you scroll away on purpose, so background updates (link previews, layout tweaks) don’t snap the viewport back to the cursor while you’re reading somewhere else. That’s the kind of thing that sounds trivial until you’ve had an app yank you around during a long thought.

None of this is revolutionary. It’s fewer performances, more room for your sentences.

## What Comes Next

This post is the introduction. I’ll follow it with shorter pieces, one feature at a time, on the Mac chrome, offline-first vault, linking, link previews, assistive capture, today’s note, and the editor details that stay out of your way. Same voice, less scope each time.

If the idea resonates, [try Madrid on your Mac](https://github.com/mrlemoos/madrid/releases/latest). Think without the feed, and write without the app putting on a show. I built it because I needed a quiet place to think. Maybe you do too.

For more of this sort of thing (design systems, engineering judgement, the occasional rant), my main blog lives at [mrlemoos.dev](https://mrlemoos.dev/blog).

To everyone in this kingdom and beyond, Leo
