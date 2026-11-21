---
title: "rFactor: A Game-Wide Reverse-Engineering Project"
date: 2026-11-21 17:30:09
description: "Explore a game-wide rFactor reverse-engineering project organized across Git submodules for tools, libraries, plugins, and documentation."
categories:
  - Projects
tags:
  - rFactor
  - Reverse Engineering
  - C++
  - C
  - Windows
  - Game Preservation
---

<img src="/images/rfactor-banner.webp" alt="rFactor emblem centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

A racing simulator is more than its main executable. Graphics configuration, video playback, telemetry plugins, networking tools, and documentation all contribute to the experience. The [rFactor project](https://github.com/fuckyourfactor/rFactor) brings those pieces together in a game-wide reverse-engineering effort, using linked repositories to organize work across the original rFactor ecosystem.

<!--more-->

## What is the rFactor project?

This project focuses on the original **rFactor 1**, not rFactor 2. The top-level repository acts as an umbrella around the game's directory structure, with separate repositories for individual components.

That organization matters: browsing only the root repository misses much of the source. Its `.gitmodules` file connects configuration utilities, compatibility libraries, plugins, a hosting diagnostic, a memory-addressing utility, and the help system.

The scope is the game and its supporting software, rather than a single mod or plugin. The current public checkout, however, should not be confused with an official engine-source release or a completely source-built replacement: the root still contains `rFactor.exe` as a binary, along with Miles audio binaries, and the components document different levels of reconstruction.

## What it covers

- **Graphics configuration**, through an independently written Win32 implementation of `rF Config.exe`.
- **Video and setup compatibility libraries**, with separate projects for `binkw32.dll` and `dsetup.dll`.
- **Telemetry and lap-time plugins**, including shared-memory data export and the delta-best plugin.
- **Supporting Windows utilities**, including HostingTest and a reconstruction of the 4GB Patch tool.
- **The game's help documentation**, with HTML sources, a table of contents, and a CHM build workflow.
- **A coordinated checkout**, where the parent repository records specific revisions of its subprojects.

Some parts are independent reconstructions; others are existing plugin forks or preserved documentation and binaries. Looking at those distinctions is more useful than treating every file as having the same origin or completion status.

## Getting started with the source

### 1. Clone the submodules too

Use Git's recursive checkout:

```bash
git clone --recurse-submodules https://github.com/fuckyourfactor/rFactor.git
cd rFactor
```

A normal clone without submodule initialization leaves the linked projects unpopulated. Downloading the parent repository as a ZIP does not assemble those repositories either.

### 2. Initialize an existing checkout

If you already cloned the parent:

```bash
git submodule update --init --recursive
```

This retrieves the revisions recorded by the parent. Avoid adding `--remote` unless you deliberately want to move beyond those pinned revisions and evaluate a different combination of components.

### 3. Inspect the recorded versions

Before building or comparing behavior:

```bash
git submodule status --recursive
```

The output identifies the component commits. Keep that information with test results or bug reports, since two checkouts of the same parent layout can behave differently after local submodule changes.

Read the relevant component's README, build files, and workflow before running anything. There is no single root build command that turns this entire tree into a newly compiled game.

## Why the game-wide view matters

Reverse engineering an older game is not just about finding the main loop. Supporting tools, media libraries, configuration formats, telemetry interfaces, and documentation are part of what makes the software understandable and maintainable.

This repository makes those relationships visible. The parent provides the map, while the subprojects hold much of the implementation and their own compatibility notes.

If you want to explore the work, start with the [rFactor umbrella repository](https://github.com/fuckyourfactor/rFactor), initialize its submodules, and follow the component that interests you. Read it as a coordinated game-wide reconstruction effort, while checking the actual source and documented status before assuming a particular subsystem is complete.
