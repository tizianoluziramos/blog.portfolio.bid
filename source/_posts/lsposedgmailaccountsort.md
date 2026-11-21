---
title: "Gmail Account Sort: Alphabetical Accounts with LSPosed"
date: 2026-11-21 16:49:43
description: "Sort Gmail's account switcher alphabetically by email address with an LSPosed module for Android."
categories:
  - Projects
tags:
  - Gmail
  - Android
  - LSPosed
  - Java
---

<img src="/images/gmail-banner.webp" alt="Gmail logo centered on a calm dark blue background" width="1600" height="700" style="width: 100%; height: auto;">

Switching between several Gmail accounts is easier when the list has a predictable order. [Gmail Account Sort](https://github.com/tizianoluziramos/lsposedgmailaccountsort) is an LSPosed module that sorts accounts alphabetically by email address in Gmail's account switcher, without replacing the app or changing how you select an account.

<!--more-->

## What is Gmail Account Sort?

Gmail Account Sort is a Java module for Android that runs through LSPosed. It hooks Gmail's account-switcher code and reorders account rows before they are displayed.

The goal is deliberately narrow: keep Gmail's familiar interface, but make the account list easier to scan. Sorting is case-insensitive and uses email addresses rather than display names. The active account, avatars, and account-selection behavior are preserved.

This is not a standalone email client or a setting you can enable in an unmodified Gmail installation. You need a device with a working LSPosed setup; installing the APK alone does not activate the module.

## What it supports

- **Alphabetical ordering by email address**, with case-insensitive comparison.
- **Both classic and Bento account switchers**, covering the two layouts described in the repository.
- **Preservation of account rows and avatars**, rather than replacing them with a separate menu.
- **The existing active account and switching behavior**, without signing you into a different account automatically.
- **Gmail-only scope**, targeting the Android package `com.google.android.gm`.

The source, build workflow, and downloadable APKs are available in the [repository](https://github.com/tizianoluziramos/lsposedgmailaccountsort).

## Getting started on Android

### 1. Check the prerequisites

You need Gmail and an already working LSPosed installation with its manager available. Setting up the underlying framework is separate from installing this module.

Check your Gmail version before proceeding. The repository currently lists:

| Gmail version | Documented support |
| --- | --- |
| `2026.11.02.1015914183.Release` | Supported. |
| `2026.11.09.1019722178.Release` and above | Listed as supported; later updates can still change Gmail's internals. |

These are Gmail version strings, not module version numbers. Support for a newer version should not be treated as a guarantee that every future Gmail update will work.

### 2. Install the module

Download the APK from the project's [latest release](https://github.com/tizianoluziramos/lsposedgmailaccountsort/releases/latest). The release asset is named `app-release.apk`, while the README refers to the module APK as `GmailAccountSort.apk`.

Install it on your Android device. If Android asks for permission to install apps from the browser or file manager you are using, allow it only for a download you trust.

### 3. Enable it for Gmail only

Open **LSPosed Manager**, find **Gmail Account Sort**, and enable the module.

In its target-application list, select **Gmail** as the only target. The module is designed for Gmail's main process, not for sorting accounts across every Google app or Android's system settings.

There is no separate account-order configuration screen to open. Activation and scope are managed through LSPosed.

### 4. Restart Gmail and check the switcher

Force stop Gmail from Android's app settings, then open it again. Open the account switcher and check that the alternative accounts appear in alphabetical order by email address.

Try switching to another account as well. The intended result is the same Gmail account-selection workflow, with a more predictable list—not a change to the account you were already using.

## A Gmail update can change compatibility

The module relies on internal Gmail classes and methods rather than a public account-sorting API. Its current implementation contains separate mappings for the November 2 and November 9 builds listed above, choosing a mapping based on Gmail's version.

That makes compatibility more specific than simply supporting “Gmail on Android.” A later build can rename or restructure the code that the module hooks, even if the visible account switcher looks similar.

Classic and Bento hooks are installed separately. If one layout stops sorting after an update, check the module's logs rather than assuming that enabling it again will fix a changed internal implementation.

Useful log messages are prefixed with `[GmailAccountSort]` and include:

- `Unsupported Gmail version` when no version mapping is selected.
- `Classic account selector ready` or `Bento account selector ready` when the corresponding hooks are installed.
- `Classic account selector unavailable` or `Bento account selector unavailable` when hook setup fails.

If you report a problem, include the Gmail version, module version, and relevant log lines. Redact email addresses or other personal information before sharing logs or screenshots.

## Building from source

The documented build requirements are **Android SDK 35**, **JDK 17**, and **Gradle 8.9**. The repository includes the Gradle wrapper, so use it from a checkout of the project.

On Windows:

```powershell
.\gradlew.bat :app:assembleRelease
```

On Linux or macOS:

```bash
./gradlew :app:assembleRelease
```

The documented output path is `app/build/outputs/apk/release/app-release.apk`. Release signing depends on a local `keystore.properties` file and keystore; an installable release build needs to be signed.

For a locally signed debug build without release-signing configuration, use `:app:assembleDebug` instead. Its output is `app/build/outputs/apk/debug/app-debug.apk`. A debug APK may not install over a release APK signed with a different key.

The project's [GitHub Actions workflow](https://github.com/tizianoluziramos/lsposedgmailaccountsort/actions) also uploads APK artifacts. It builds a signed release when signing secrets are available and a debug APK otherwise. GitHub requires you to be signed in to download workflow artifacts.

## Keep the change scoped

Start by checking the switcher with your existing accounts; there is no need to remove and re-add accounts to establish a new order. If you want to undo the change, disable the module in LSPosed, then force stop and reopen Gmail.

Gmail Account Sort is an independent project, not an official Gmail feature. Keep its scope limited to Gmail and recheck behavior after app updates.

The idea is small but practical: leave the email client alone and give its account list a predictable order. If that would make your daily account switching easier, the [Gmail Account Sort repository](https://github.com/tizianoluziramos/lsposedgmailaccountsort) has the source, current compatibility notes, and downloads.