---
title: "TelegramFS: A Telegram Channel as a Windows Drive"
date: 2026-11-21 15:25:02
categories:
  - Projects
tags:
  - TelegramFS
  - Telegram
  - Windows
  - C++
  - Filesystems
---

<img src="/images/telegram-banner.webp" alt="Telegram logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Telegram can hold files, but browsing messages is not the same as browsing a filesystem. [TelegramFS](https://github.com/tizianoluziramos/TelegramFS) connects those two worlds: it mounts a private Telegram channel as a Windows drive, so you can work with files through File Explorer instead of hunting through a chat history.

<!--more-->

## What is TelegramFS?

TelegramFS is a C++20 application for Windows x64. It uses [WinFsp](https://github.com/winfsp/winfsp) to expose a filesystem to Windows and Telegram's TDLib to communicate with your account.

The result is a drive with a familiar letter—`T:` by default—backed by a private Telegram channel. You authenticate, choose a channel, and mount it. Windows gets the filesystem interface; TelegramFS handles the connection to Telegram and its local cache.

That distinction matters: this is a network-backed drive, not a replacement for the SSD in your machine. A familiar interface does not remove transfer time, connectivity requirements, or the need to check whether changes have actually reached the remote service.

## What it supports

- **A configurable drive letter**, with optional read-only mounting.
- **Memory and disk caching**, plus read-ahead for downloads.
- **Parallel transfers**, configurable from 1 to 16 uploads and downloads per direction.
- **Optional encryption**, with commands to initialize and restore a channel key.
- **Mounting at Windows sign-in**, when both startup registration and automatic mounting are enabled.
- **Read-only access to DriveInfinity channels**, configured separately from the main channel.

The project is licensed under Apache-2.0. Its source and build configuration are available in the [repository](https://github.com/tizianoluziramos/TelegramFS).

## Getting started on Windows

### 1. Install the prerequisites

You need Windows x64, [WinFsp](https://github.com/winfsp/winfsp/releases/latest) with its **Core** component, and the [Visual C++ Redistributable for x64](https://aka.ms/vs/17/release/vc_redist.x64.exe).

The repository's installation instructions point to the `TelegramFS-windows-x64` artifact under [GitHub Actions](https://github.com/tizianoluziramos/TelegramFS/actions). Download an available artifact, extract it, and open PowerShell in the folder containing `telegramfs.exe`. GitHub requires you to be signed in to download workflow artifacts.

### 2. Authenticate and select a channel

Obtain an API ID and API hash from **API development tools** at [my.telegram.org](https://my.telegram.org), then run:

```powershell
.\telegramfs.exe login
```

Follow the authentication prompts. Next, create a dedicated private channel:

```powershell
.\telegramfs.exe channel-create TelegramFS
```

You can also list existing channels:

```powershell
.\telegramfs.exe channels
```

Open the active configuration file:

```powershell
notepad (.\telegramfs.exe config)
```

Under `[telegram]`, replace `channel_id = 0` with your channel's ID, **including its minus sign**. Save the file.

### 3. Choose encryption deliberately

Check `[security]` before your first mount. At the time of writing, the README lists `encryption = false` as the default, while the bundled `telegramfs.toml` sets it to `true`. Do not assume which value your local configuration contains.

For a new encrypted volume, use a new channel and initialize its key before mounting:

```powershell
.\telegramfs.exe key-init
```

The command asks for a recovery password and uploads a password-protected recovery document. Keep that password somewhere safe, then make sure your configuration contains:

```toml
[security]
encryption = true
```

The project also provides `key-restore` to recover a channel key. Enabling encryption on an existing unencrypted volume is not an in-place conversion; the initialization command requires a new channel when no local key exists and a volume index is already present.

### 4. Mount the drive

```powershell
.\telegramfs.exe mount
```

The drive should appear under **This PC**, using `T:` unless you configured another available letter. To inspect its state or request synchronization:

```powershell
.\telegramfs.exe status
.\telegramfs.exe sync
```

When you are done:

```powershell
.\telegramfs.exe unmount
```

Unmount and remount to apply configuration changes.

## A local save is not necessarily a completed upload

One setting worth understanding before copying anything important is `cache.write_back`.

| Setting | What a successful flush confirms |
| --- | --- |
| `write_back = true` | The change has been saved locally. |
| `write_back = false` | Telegram has confirmed the remote save. |

Write-back is enabled by default. That means an application finishing a save does **not** necessarily mean the upload has finished.

Use `status` to inspect `pending_local_changes`. While mounted, `sync` requests synchronization; its “Sync requested” response is not a completion receipt. An unmount can also leave local writes queued for the next mount, so pay attention to its output before removing local data or moving to another machine.

## Useful configuration

The documented defaults include four simultaneous transfers per direction, a 64 MiB memory cache, a 10 GiB disk cache, and a 60-second change polling interval.

Those are configuration choices, not performance guarantees. Increasing concurrency will not necessarily make a slow connection faster, and cached reads do not make every file available offline.

For automatic mounting at sign-in, set `filesystem.auto_mount = true` and run:

```powershell
.\telegramfs.exe startup enable
```

Both steps are required. For experiments where you do not want to modify the channel, use `filesystem.read_only = true`.

## Try it with disposable files first

Start with a dedicated channel and files you can afford to lose. Check the copy, synchronization, and recovery workflow before relying on it for anything important.

A private channel is not the same thing as application-level encryption, and neither replaces an independent backup. Telegram's availability, account restrictions, and service limits still apply.

TelegramFS makes an interesting connection between messaging and everyday file access: the interface is a Windows drive, but the backing store is a Telegram channel.

If that sounds useful, the [TelegramFS repository](https://github.com/tizianoluziramos/TelegramFS) has the source, installation instructions, and current configuration reference.
