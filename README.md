# nugget-app

![plot](./assets/images/screenshot.png)

<p align='center'>

<a href="#"><img alt="GitHub Repo stars" src="https://img.shields.io/github/stars/cartesiancs/nugget-app?style=for-the-badge" /></a>
&nbsp;
<a href="https://discord.gg/SvBypMTF8j"><img alt="GitHub Repo stars" src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" /></a>

</p>

English | [한국어](./docs/README.ko.md)

<hr/>

Video editing software focused on motion effects and versatility.

In addition to basic cut editing and animation, sound mixing, extension external library, project management, and text editing features, we provide many functions.

Also, it provides layer-based editing. It is different from track-based editing. It has the advantage of being easy to add multiple effects to each asset.

> [!IMPORTANT]
> 📢 <strong>Currently, the 0.4.0 version is being refactored.</strong> It can be a little unstable.

## Features

- Cut Edit
- Audio mixing
- Re-position animation, Keyframe
- Add Text
- External Extension
- and more...

## Installation

First, install dependencies.

```
npm install
```

and, **Download** ffmpeg and ffprobe into the "./bin" folder. There's a version for Mac and a version for Windows separately. Compatible binary files can be downloaded from https://github.com/cartesiancs/ffmpeg4nugget

next, **Permission** grant is required. Please enter the command below to grant permission for bin folder.

`chmod -R 777 bin`

## Running

```
npm run dev
npm run start
```
