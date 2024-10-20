<p align="center">
<h1 align="center">three-iges-loader</h1>
</p>
<p align="center">
<a href="https://www.npmjs.com/package/three-iges-loader"><img src="https://img.shields.io/npm/v/three-iges-loader?label=latest" alt="npm version" /></a>
<a href="https://github.com/Konsept-Design/three-iges-loader/blob/main/LICENSE" rel="nofollow"><img src="https://img.shields.io/npm/l/three-iges-loader" alt="license" /></a>
<a href="https://github.com/Konsept-Design/three-iges-loader/actions?query=branch%3Amain" rel="nofollow"><img src="https://github.com/Konsept-Design/three-iges-loader/actions/workflows/main.yml/badge.svg?event=push&branch=main" alt="build status" /></a>
<a href="https://github.com/Konsept-Design/three-iges-loader" rel="nofollow"><img src="https://img.shields.io/github/stars/Konsept-Design/three-iges-loader" alt="stars"></a>
</p>

**IGESLoader** is an IGES file loader for Three.js.

> [!WARNING]
> This package is currently in active development and may not be stable. Use with caution.

> [!NOTE]
> Currently, only a limited number of 'entity' types are parsed (mainly to be able to display points/lines/curves).

## Install

```bash
pnpm add three-iges-loader three
```

## Usage

```js
import * as THREE from "three";
import { IGESLoader } from "three-iges-loader";

const loader = new IGESLoader();

const iges_file_path = "/file.iges";

loader.load(
  // resource URL
  iges_file_path,
  // called when load is complete
  function (object) {
    sceneGeometry.add(object);
  },
  // called when loading is in progress
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("Error: " + error);
  }
);
```

## Author

Alex Marinov - Konsept Design Limited
