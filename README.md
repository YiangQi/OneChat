<div align="center">
  <img width="160" src="./resource/img/logo.ico" />
  <p align="center"><strong>Ask once, get answers from many</strong></p>


[English] | [简体中文](README_ZH-CN.md)

</div>

**OneChat**, as the name suggests, is a tool that can simultaneously converse with multiple online large-model websites. OneChat can send your question to multiple AI pages at once, helping you discover the best answers.
Not only that, OneChat also supports one-click controls for showing or hiding all pages' sidebars, showing or hiding input boxes, starting new conversations, uploading files, quickly locating items in the conversation list, and more.

## Screenshots

| Light Theme | Dark Theme |
|--|--|
| ![white_theme](./resource/screenshots/white_theme_zh.png) | ![dark_theme](./resource/screenshots/dark_theme_zh.png) |

## 🔥 Features

- Send a question to multiple pages with one click
- Open all pages' login windows with one click
- Show or hide all pages' sidebars with one click
- Show or hide all pages' input boxes with one click
- Upload images or files with one click
- Jump to the previous or next question with one click
- Input content is synchronized to all pages' input boxes in real time
- Choose freely to send messages to the currently active page
- Sidebar shows the current AI conversation history
- Pages can be dragged to customize position and size

## Supported Model Websites

The model websites supported by OneChat can be configured dynamically via JSON. The configuration directory is the `online` folder in the application's root directory.
The `online.json` file in that folder is the model configuration file; if you want to add a custom site model, you can refer to this configuration.

Currently supported models include:

- ChatGPT
- ChatGLM
- Claude
- DeepSeek
- DouBao
- Gemini
- Kimi
- Grok
- TongYi
- YuanBao

OneChat also supports adding other large-model websites dynamically; after modifying the `online.json` configuration, restart the application for the changes to take effect.

## How to Add a New Model Site

- Create a new model directory under the `online` folder, using the format `{provider}_{model}`, for example `openai_chatgpt`. The directory name format is not strictly required, but it keeps things consistent.
- The model directory must contain two files: `inject.js` and `logo.png` (the model's icon).
- `inject.js` should override the interface methods from `inject_template.js` to implement the injection script for operating the model website.
- Add the model configuration option in `online.json` in `online.js`, using the following format:

  ```json
  {
    "name": "ChatGPT",
    "url": "https://chat.openai.com/",
    "icon": "openai_chatgpt/logo.png",
    "script": "openai_chatgpt/inject.js"
  }
  ```

Where:
- `name` is the model's display name shown in OneChat's sidebar
- `url` is the model website's conversation address
- `icon` is the path to the model's logo
- `script` is the path to the model injection script

Due to limited personal time, contributions of new model site configurations are welcome.

## Privacy

OneChat does not read any of your personal information. All login and personal data for model websites are stored in the tool's `webcache` folder in the application's root directory. If needed, you can manually delete that folder to clear personal data.

Inside the `webcache` directory there is a `WebView` folder which stores data in separate subfolders named by each model website's domain; you can delete the specific site's folder under `WebView` to reset that website's data.

## Build

- The OneChat client code is built with Qt 5.15.2 and MSVC2019_64.
- OneChat uses the third-party library [QCefView](https://github.com/CefView/QCefView) as the browser engine and includes some adjustments for certain QCefView features, using CEF version 122.
  You can refer to the forked repository here: https://github.com/YiangQi/QCefView/tree/onechat (branch `onechat`).
  The `qcefview` under `3rdparty` in OneChat was built from that fork.
- At runtime, it is necessary to package the corresponding CefView module in the debug/release directory; you can directly copy it from GitHub.
- If you want to run the release version, please first copy the build/debug/onlinedirectory to the build/releasedirectory; otherwise, the website list will be missing at runtime.