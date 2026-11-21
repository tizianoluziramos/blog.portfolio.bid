---
title: "Inscryption NoBars: More Game, Fewer Black Bars"
date: 2026-11-21 17:56:53
description: "Remove Inscryption's black bars with a BepInEx mod that adjusts camera framing while preserving the game's pixel-rendering pipeline."
categories:
  - Projects
tags:
  - Inscryption
  - Game Modding
  - BepInEx
  - Unity
  - C#
---

<img src="/images/inscryption-nobars-banner.webp" alt="Official Inscryption game logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Inscryption's atmosphere deserves more screen space than a pair of black bars. [Inscryption NoBars](https://github.com/tizianoluziramos/inscryption-noblackbars-mod) is a BepInEx mod that fills the game viewport and adjusts camera framing, with attention to the pixel rendering and interface scaling that make a simple stretch-to-fit approach look wrong.

<!--more-->

## What is Inscryption NoBars?

Inscryption NoBars is a C# plugin for Inscryption, loaded through BepInEx. It uses Harmony patches to change how the game's cameras fill the window.

The main patch runs after `PixelCamera.LateUpdate`, letting the game calculate its normal view before the mod adjusts the viewport and projection. Instead of replacing the rendering pipeline, it works with the game's existing pixel scale and camera settings.

The default framing mode aims to preserve the horizontal composition while revealing more of the world vertically. The mod also leaves cameras used for screen-space UI alone, so removing the bars does not automatically enlarge or resample the interface.

## What it supports

- **A full-window game viewport**, rather than the camera's original letterboxed rectangle.
- **Two framing modes**, with horizontal preservation as the default.
- **Orthographic and perspective camera adjustments**, including field-of-view handling.
- **Render-target scale alignment in the default mode**, intended to avoid dropped pixel rows and stretched output.
- **Optional patching of the game's 2D/GBC cameras**, plus a fallback for other letterboxed cameras.
- **A BepInEx configuration file**, with framing, compatibility, painting-resolution, and debug options.

The source, changelog, and packaged download are available in the [repository](https://github.com/tizianoluziramos/inscryption-noblackbars-mod).

## Getting started

### 1. Install the mod loader

You need an existing Inscryption installation and **BepInExPack for Inscryption 5.4.1902**, the dependency listed by the project.

Follow the [BepInExPack installation instructions](https://thunderstore.io/c/inscryption/p/BepInEx/BepInExPack_Inscryption/) for the game. Launch it once to check that the loader works, then close the game before installing the plugin.

### 2. Download the plugin ZIP

Download `InscryptionNoBars.zip` from the project's [Latest Build release](https://github.com/tizianoluziramos/inscryption-noblackbars-mod/releases/tag/latest).

That release is marked as a **prerelease**. Choose the installable ZIP, not GitHub's automatically generated source-code archive.

### 3. Extract it into the plugins folder

Inside the game installation, create `BepInEx/plugins/InscryptionNoBars/` and extract the archive's contents there:

```text
BepInEx/plugins/InscryptionNoBars/
├── manifest.json
├── icon.png
└── InscryptionNoBars.dll
```

Keep the DLL directly inside that folder rather than accidentally adding another nested copy of the directory. The package is a plugin; it does not replace the game's executable.

### 4. Launch and check the result

Start Inscryption and check the camera framing at your normal display resolution. Try the menus, a gameplay scene, and a change of window size.

The plugin identifies itself as `InscryptionNoBars`. Its startup messages use the `[NoBars]` prefix and report whether the `PixelCamera` patch was applied. If the bars remain, check `BepInEx/LogOutput.log` for missing types, initialization errors, or conflicts with another camera mod.

## Why filling the viewport is not just stretching the picture

The source describes a specific problem with taller windows: the game's reference-resolution logic caps its aspect ratio around **1.75:1**, leaving some screen rows outside the camera viewport.

Simply expanding that viewport can stretch the existing image or disturb the integer pixel scaling. NoBars also adjusts the camera projection and, in its default mode, realigns the internal render target with the expanded viewport.

For perspective cameras, it tracks the field of view the game authored instead of multiplying the previous frame's adjusted value repeatedly. That lets camera transitions and window-size changes work without a progressively exaggerated zoom.

UI cameras are handled separately. Their viewport affects Unity's canvas scaling, so the mod skips them while allowing the world camera to fill the newly available space.

## Useful configuration

After the plugin first loads, its settings are stored at:

```text
BepInEx/config/inscryption.nobars.cfg
```

Some of the main defaults are:

| Section | Setting | Default | Purpose |
| --- | --- | --- | --- |
| `Framing` | `Mode` | `PreserveHorizontal` | Keeps the horizontal framing while expanding the vertical view where needed. |
| `Framing` | `PatchGbcCameras` | `true` | Applies the patch to the 2D/GBC cameras as well. |
| `Framing` | `MaxExpansion` | `1.6` | Limits the vertical-view expansion. |
| `Compatibility` | `ForceFullRectOnUnpatchedCameras` | `true` | Enables a fallback for cameras not handled by the main patch. |
| `Debug` | `Enabled` | `false` | Enables detailed diagnostic logging. |

For the standard framing behavior, the relevant configuration looks like:

```ini
[Framing]
Mode = PreserveHorizontal
PatchGbcCameras = true
MaxExpansion = 1.6
```

The alternative, `PreserveVertical`, keeps the vertical view rather than applying the default vertical expansion. The source notes that this mode can trade pixel sharpness for that framing choice, and some 2D scenes may reveal empty space.

Start with the defaults. If a GBC scene becomes misaligned, try `PatchGbcCameras = false`. The expansion cap also means extreme window shapes should be checked rather than assuming every aspect ratio will preserve the same composition.

The plugin refreshes its settings when BepInEx reloads the configuration. For a straightforward manual edit, close the game, change the file, and restart.

## Building from source

The repository's build workflow uses **.NET SDK 8**. From a checkout of the project:

```bash
dotnet build InscryptionNoBars.sln -c Release
```

The installable archive is generated at:

```text
InscryptionNoBars/bin/Release/InscryptionNoBars.zip
```

The build packages the plugin DLL, manifest, and icon together. You do not need to copy the game's own assemblies into the plugins folder.

## Try the framing that suits your display

The change is focused: use more of the screen without turning the whole game into a stretched image. Check your preferred resolution and the scenes you actually play, especially if you use other camera or UI mods.

To remove NoBars, close the game and remove its dedicated folder from `BepInEx/plugins/`. Leave the mod loader and other plugins in place if you still use them.

If that sounds useful, the [Inscryption NoBars repository](https://github.com/tizianoluziramos/inscryption-noblackbars-mod) has the source, changelog, and current download.
