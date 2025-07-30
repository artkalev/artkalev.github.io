---
layout: post
title: "OpenUSD Exporter"
---

IMAGE HERE

I had to come up with a solution to export Pixar OpenUSD scene files from 3D AutoCad drawings. AutoCad is quite ancient piece of software by now but is still widely used.

There were no plugins available for this task which supported the features we needed. So I decided to create the plugin myself.

## Details

I setup a CMake C++ project which used the AutoCad ObjectArx SDK and OpenUSD library. Package management on windows is usually quite the hassle. Fortunately I could make use of VCPKG to manage the dependencies in a sane way.

The main challenge was optimising the code so that the export process would not take too long. The AutoCad SDK is sadly single threaded, so I could not multithread the AutoCad related functions.

Other processes like recalculating mesh normals for example I managed to multithread for some speedup at least.

Exporting very detailed scenes was still very slow but could not feasibly be made faster because of the limitations in the AutoCad SDK.

IMAGE HERE

Pointlight and spotlight types could be translated into USD light primitives in a way that was mostly consistent with the light look in the AutoCad viewport.

Directional distant light could not be translated however because of some bug in the SDK. According to documentation I should have been able to just get the light direction vector, but the returned vector was not correct after saving and loading the cad file.

So only the directional light from the "sun properties" is supported by the exporter for now.

## Future

The plugin is mainly used by an Estonian boat maker for in-house VR demos for now. I might be able to polish the plugin enough at some point to make a release on the AutoCad store in the future...