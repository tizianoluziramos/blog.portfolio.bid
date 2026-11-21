---
title: "GooglePhotosFS: Google Photos as a Windows Drive"
date: 2026-11-21 16:23:23
categories:
  - Projects
tags:
  - GooglePhotosFS
  - Google Photos
  - Windows
  - Go
  - Filesystems
---

<img src="/images/googlephotos-banner.webp" alt="Google Photos logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Google Photos is useful for keeping a media library in the cloud, but sometimes a drive letter is a more convenient way to access it. [GooglePhotosFS](https://github.com/tizianoluziramos/GooglePhotosFS) mounts that library as a Windows drive, bringing your photos and videos into File Explorer.

<!--more-->

## What is GooglePhotosFS?

GooglePhotosFS is a Go application that uses [WinFsp](https://github.com/winfsp/winfsp) to expose Google Photos as a filesystem on Windows 10 or 11 x64.

The drive uses `P:` by default. After authenticating your account, you can browse media through Windows rather than downloading everything through a browser first. A local SQLite index keeps track of the library, while the application handles remote requests and transfers.

Like [TelegramFS](/2026/11/21/telegramfs/), this is a network-backed filesystem—not a local disk with cloud storage magically attached. Downloads still depend on the connection, uploads take time, and a filesystem view does not turn Google Photos into a general-purpose replacement for an SSD.

## What it supports

- **A configurable drive letter**, with an optional read-only mount.
- **Multiple library views:** flat, calendar, month, year, and paths derived from media descriptions.
- **A local SQLite library index**, with synchronization against Google Photos.
- **Media downloads and uploads**, both through the filesystem and dedicated CLI commands.
- **Metadata, SHA-1 hashes, and storage quota information** through the CLI.
- **Local staging for writes**, with background upload processing and recovery of valid pending uploads on a later writable mount.

The source, build script, and packaged Windows downloads are available in the [repository](https://github.com/tizianoluziramos/GooglePhotosFS).

## Getting started on Windows

### 1. Install the prerequisites

You need **Windows 10 or 11 x64** and [WinFsp](https://github.com/winfsp/winfsp/releases/latest) with its **Core** component.

Download `GooglePhotosFS-windows-x64.zip` from the project's [releases](https://github.com/tizianoluziramos/GooglePhotosFS/releases/latest), extract it, and open PowerShell in the folder containing `googlephotosfs.exe`.

### 2. Authenticate your account

Start the manual configuration flow:

```powershell
.\googlephotosfs.exe config manual
```

Follow the prompt to open [Google's sign-in page](https://accounts.google.com/EmbeddedSetup), sign in, and find the `oauth_token` cookie for `accounts.google.com` in your browser's developer tools. Paste its value into the **local CLI prompt**, not into a website, issue, or chat.

The wizard also asks about the optional Pixel XL upload profile and the library view. For a first run, leave that profile disabled and use the default `flat` view.

**Treat the cookie and saved `auth_data` as credentials.** The application saves authentication data in its TOML configuration; do not publish that file or include its contents in screenshots or bug reports.

On Windows, use `manual` mode. The separate `config auto` browser sign-in implementation currently requires Linux.

### 3. Choose a safe first configuration

Open the active configuration file:

```powershell
notepad (.\googlephotosfs.exe config path)
```

For your first mount, consider changing the existing `[filesystem]` settings to:

```toml
[filesystem]
mount_point = "P:"
root = ""
read_only = true
```

The default is writable, so set `read_only` explicitly if you only want to explore the library. Keep `P:` or choose another available drive letter, then save the file.

### 4. Mount the drive

```powershell
.\googlephotosfs.exe mount
```

Open `P:` in File Explorer. To inspect the library or check storage quota from PowerShell:

```powershell
.\googlephotosfs.exe ls
.\googlephotosfs.exe about
```

To refresh the local library index:

```powershell
.\googlephotosfs.exe sync
```

When you are done:

```powershell
.\googlephotosfs.exe unmount
```

Unmount and remount after changing settings. If you later want uploads or other modifications, switch `filesystem.read_only` to `false` deliberately.

## A local save is not necessarily a completed upload

Windows applications can write incrementally, but GooglePhotosFS uploads complete media items. It stages writes locally and schedules an upload when the last writer closes the file.

| Operation | What it means |
| --- | --- |
| A successful filesystem flush | The staged file has been synchronized to local disk. |
| The last writer closes | A dirty staged file becomes eligible for background upload. |
| `googlephotosfs sync` | The library index is refreshed; this is not an upload-queue completion check. |

Failed uploads can remain staged for retry. Valid saved pending-upload records are restored on a later writable mount using the matching account and mount configuration.

Do not delete the pending files or assume that finishing a copy in Explorer proves the media has reached Google Photos. Check the result in Google Photos itself before removing your original copy. Editing an existing item can also require a complete upload rather than an in-place remote update.

## Useful configuration

The active TOML file contains separate `[filesystem]` and `[google_photos]` sections. These are some of the settings worth knowing:

| Setting | Default | Purpose |
| --- | --- | --- |
| `filesystem.mount_point` | `"P:"` | Selects the drive letter. |
| `filesystem.read_only` | `false` | Blocks modifications when set to `true`. |
| `filesystem.root` | `""` | Restricts the view to a virtual subpath when configured. |
| `google_photos.list_mode` | `"flat"` | Chooses how media is organized in the filesystem. |
| `google_photos.download_cache` | `false` | Controls whether CLI downloads use the download-cache path. |
| `google_photos.cache_db_path` | `""` | Uses an automatically selected account-specific SQLite index when empty. |

The date-based views organize media using its capture timestamp. The `description_path` view derives virtual folders from path tags in media descriptions; those folders are not ordinary local directories or Google Photos albums.

The `unlimited_upload` option changes the device profile used for requests. Its name is **not a guarantee of unlimited storage**: Google controls quota, account eligibility, and service behavior. Keep the default `false` unless you understand that setting and its implications.

For a focused CLI download, use a remote filename shown by `ls`:

```powershell
.\googlephotosfs.exe get "example.jpg" ".\downloaded-example.jpg"
```

The destination must not already exist. You can also inspect an item's metadata:

```powershell
.\googlephotosfs.exe metadata "example.jpg"
```

### Building from source

If you prefer building the executable yourself, install **Go 1.25 or later** and run this from a checkout of the GooglePhotosFS repository:

```powershell
.\build.ps1
```

The default output directory is `dist/`. You still need WinFsp Core to mount the resulting executable's drive.

## Try it with disposable files first

Start read-only, then use a few backed-up photos or videos to test uploads and modifications. Do not treat this as a generic disk for arbitrary files or your only backup.

In the default flat view, deleting a media item can move the actual Google Photos item to the trash—not just remove a local shortcut. Other views can have different path-removal behavior, so understand the selected mode before deleting anything.

GooglePhotosFS is an independent project, not an official Google Photos desktop client. It uses Google's mobile authentication and service endpoints, so changes on Google's side can affect compatibility. Account restrictions and storage limits still apply.

The idea is straightforward: keep the remote media library, but give it a familiar filesystem interface. If that sounds useful, the [GooglePhotosFS repository](https://github.com/tizianoluziramos/GooglePhotosFS) has the source, current instructions, and downloads.